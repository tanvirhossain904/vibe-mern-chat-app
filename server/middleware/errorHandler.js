import { ZodError } from "zod";
import { logger } from "../lib/logger.js";
import { env } from "../lib/env.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const notFound = (req, res, next) => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || "Something went wrong";

  if (err instanceof ZodError) {
    status = 400;
    message = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  }

  if (err.code === 11000) {
    status = 409;
    message = "Resource already exists";
  }

  if (status >= 500) {
    logger.error({ err, reqId: req.id, path: req.originalUrl }, "Unhandled error");
    if (env.NODE_ENV === "production") message = "Something went wrong";
  } else {
    logger.warn({ reqId: req.id, status, path: req.originalUrl }, message);
  }

  res.status(status).json({ success: false, message });
};
