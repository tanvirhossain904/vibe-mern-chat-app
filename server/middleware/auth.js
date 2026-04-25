import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../lib/env.js";
import { HttpError } from "./errorHandler.js";

const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
};

export const protectRoute = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw new HttpError(401, "Not authenticated");

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw new HttpError(401, "Invalid or expired session");
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw new HttpError(401, "User no longer exists");

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
