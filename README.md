# Vibe — MERN + Socket.io chat app

Real-time chat with auth (httpOnly cookies), presence, image sharing, unread indicators, and pagination.

## Stack
- **Frontend:** Vite, React, Tailwind, React Router, React Hot Toast, socket.io-client
- **Backend:** Express, Mongoose, Socket.io, JWT (httpOnly cookies), helmet, zod, pino, express-rate-limit, bcryptjs, Cloudinary
- **DB:** MongoDB Atlas
- **Media:** Cloudinary

## Layout
```
server/   Express + Socket.io API
client/   Vite + React frontend
```

## Local setup

**1. Backend**
```bash
cd server
cp .env.example .env       # fill in MongoDB, JWT, Cloudinary keys + CLIENT_URL
npm install
npm run dev
```

**2. Frontend**
```bash
cd client
cp .env.example .env       # set VITE_BACKEND_URL=http://localhost:5000
npm install
npm run dev
```

## Environment

**Server (`server/.env`)** — validated by zod at boot, app refuses to start if anything is missing:

| Var | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | no | `development` (default), `production`, or `test` |
| `PORT` | no | defaults to 5000 |
| `CLIENT_URL` | no | defaults to `http://localhost:5173`. Used by CORS + cookies. **Must match the frontend origin.** |
| `MONGODB_URI` | yes | Mongo connection string (no DB suffix — `vibe-chat` is appended automatically) |
| `JWT_SECRET` | yes | ≥ 32 chars in production. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | yes | from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | yes | from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | yes | from Cloudinary dashboard |
| `APP_NAME` | no | branding for emails (default `Vibe`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | no | for password-reset emails. If unset, the reset link is logged to the server console in dev. |
| `REDIS_URL` | no | enables `@socket.io/redis-adapter` for multi-instance scaling. Without it, `userSocketMap` is in-memory (single instance only). |

**Client (`client/.env`)**:
| Var | Required | Notes |
| --- | --- | --- |
| `VITE_BACKEND_URL` | yes | e.g. `http://localhost:5000` (dev) or `https://api.your-domain.com` (prod) |

## API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Liveness + DB readiness (returns 503 if Mongo down) |
| POST | `/api/auth/signup` | No | Create account (rate-limited: 5 / 15min) |
| POST | `/api/auth/login` | No | Login (rate-limited: 5 / 15min) |
| POST | `/api/auth/logout` | No | Clear auth cookie |
| POST | `/api/auth/forgot-password` | No | Email a reset link (rate-limited; always returns success — no enumeration) |
| POST | `/api/auth/reset-password` | No | Reset with token from email |
| GET | `/api/auth/check` | Yes | Validate session |
| PUT | `/api/auth/update-profile` | Yes | Update profile / picture |
| DELETE | `/api/auth/me` | Yes | Permanently delete account + all messages (GDPR) |
| GET | `/api/uploads/signature` | Yes | Cloudinary signed-upload params for direct browser uploads |
| GET | `/api/messages/users` | Yes | Sidebar users + unseen counts (single-aggregation) |
| GET | `/api/messages/:id?limit=50&before=<ISO>` | Yes | Paginated conversation (newest 50 by default; cursor on `createdAt`) |
| PUT | `/api/messages/mark/:id` | Yes | Mark message seen |
| POST | `/api/messages/send/:id` | Yes | Send message (text ≤ 2000 chars or image ≤ 4 MB) |
| PUT | `/api/messages/:id` | Yes | Edit own text message (within 5 min of sending) |
| DELETE | `/api/messages/:id` | Yes | Soft-delete own message |

Auth is via httpOnly cookie (`token`) on same-site requests; `Authorization: Bearer <token>` is also accepted for API clients.

## Socket events
- `getOnlineUsers` (server → all): list of online userIds
- `newMessage` (server → recipient): pushes new message in real-time
- `messageEdited` (server → recipient): payload `{ _id, text, editedAt }`
- `messageDeleted` (server → recipient): payload `{ _id }`
- `messagesSeen` (server → original sender): emitted when recipient opens the conversation
- `typing:start` / `typing:stop` (client ↔ server, payload `{ to: <userId> }`): debounced typing indicator

The socket handshake is **JWT-authenticated** — the server reads the cookie or `auth.token` from the client and rejects connections without a valid token.

## Deployment

The server is a long-running Node process (sockets need persistent connections). Targets: **Render**, **Railway**, **Fly.io**, or any VPS. Vercel serverless is *not* supported for the backend.

### Backend (Render example)
1. Create a new **Web Service** pointing at `server/`.
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. **Health check path:** `/api/health`
5. Set env vars in the dashboard (matches the table above). `NODE_ENV=production`. Generate a strong `JWT_SECRET`.
6. Set `CLIENT_URL` to your deployed frontend origin (e.g. `https://vibe-chat.vercel.app`) — required for CORS and cookies.

### Frontend (Vercel / Netlify)
1. Point the project at `client/`.
2. **Build:** `npm run build` — **Output:** `dist`
3. Set `VITE_BACKEND_URL` to the deployed backend URL (e.g. `https://vibe-api.onrender.com`).
4. The included `client/vercel.json` rewrites all routes to `/` for client-side routing.

### Cookie / cross-origin notes
Cookies are `sameSite: 'lax'` and `secure: true` in production. If the frontend and backend are on different sites (e.g. `vibe-chat.vercel.app` calling `vibe-api.onrender.com`), browsers won't send the cookie cross-site under `lax`. Two options:

- **Same-site setup (recommended):** put the API behind the same domain (e.g. `app.example.com` + `api.example.com` with `sameSite: 'lax'` works because they're the same site).
- **Cross-site setup:** change `sameSite` to `'none'` in [server/lib/utils.js](server/lib/utils.js) `cookieOptions` (still requires `secure: true`, i.e. HTTPS on both ends).

## Production hardening notes (already in this codebase)

- httpOnly cookie auth (no `localStorage` JWT)
- Locked CORS to `CLIENT_URL` with credentials
- Helmet security headers
- Rate-limited auth routes (5 / 15min) and global API limit (120 / min)
- Zod validation on every mutating request body
- Centralized error handler — never leaks `error.message` in production
- Env validation at boot (fast-fail with readable errors)
- Structured logging via `pino` + `pino-http` (per-request log lines with reqId)
- Real `/api/health` that checks Mongo readiness
- Graceful shutdown on SIGTERM/SIGINT (drain HTTP, close sockets, disconnect Mongo)
- Socket handshake is JWT-authenticated (no client-spoofable userId)
- N+1 sidebar query replaced with a single `$group` aggregation
- Compound DB indexes on `Message` for conversation + unseen queries
- Message pagination (cursor on `createdAt`)
- Image MIME + size validation before Cloudinary upload
- Client error boundary, loading skeletons, socket reconnect resubscribe

## Tests + CI

```bash
cd server
npm test           # vitest run (unit + integration via mongodb-memory-server)
npm run test:watch # interactive
```

GitHub Actions workflow at [.github/workflows/ci.yml](.github/workflows/ci.yml) runs the server test suite and the client production build on every push and pull request to `main`.

## Future work (not in scope right now)
- E2E browser tests (Playwright happy-path)
- Group chats, voice/video calls
- File attachments beyond images
