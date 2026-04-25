# Vibe — MERN + Socket.io chat app

Real-time chat app with auth, presence, image sharing, and unread indicators.

## Stack
- **Frontend:** Vite, React, Tailwind, React Router, React Hot Toast, socket.io-client
- **Backend:** Express, Mongoose, Socket.io, JWT, bcryptjs, Cloudinary
- **DB:** MongoDB Atlas
- **Media:** Cloudinary

## Layout
```
server/   Express + Socket.io API
client/   Vite + React frontend
```

## Setup

**1. Backend**
```bash
cd server
cp .env.example .env       # fill in MongoDB, JWT, Cloudinary keys
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

## API

| Method | Path                       | Auth | Purpose                  |
| ------ | -------------------------- | ---- | ------------------------ |
| POST   | /api/auth/signup           | No   | Create account           |
| POST   | /api/auth/login            | No   | Login                    |
| GET    | /api/auth/check            | Yes  | Validate token           |
| PUT    | /api/auth/update-profile   | Yes  | Update profile / picture |
| GET    | /api/messages/users        | Yes  | Sidebar users + unseen   |
| GET    | /api/messages/:id          | Yes  | Conversation history     |
| POST   | /api/messages/send/:id     | Yes  | Send message             |
| PUT    | /api/messages/mark/:id     | Yes  | Mark message seen        |

## Socket events
- `getOnlineUsers` (server → all): list of online userIds
- `newMessage` (server → recipient): pushes new message in real-time

## Deployment
Both `server/` and `client/` ship with `vercel.json`. Deploy each as a separate Vercel project; set the backend URL in the frontend env.
