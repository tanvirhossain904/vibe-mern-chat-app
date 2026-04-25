import rateLimit from "express-rate-limit";

const passthrough = (_req, _res, next) => next();
const isTest = process.env.NODE_ENV === "test";

export const authLimiter = isTest
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
    });

export const apiLimiter = isTest
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: "Too many requests. Slow down." },
    });
