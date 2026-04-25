import jwt from "jsonwebtoken";
import { env } from "./env.js";

export const generateToken = (userId) =>
  jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });

const isProd = env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  sameSite: env.COOKIE_SAMESITE,
  // sameSite=none requires secure=true even in dev; otherwise prod-only
  secure: env.COOKIE_SAMESITE === "none" ? true : isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
