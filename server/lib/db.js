import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => logger.info("Mongo connected"));
    mongoose.connection.on("error", (err) => logger.error({ err }, "Mongo error"));
    mongoose.connection.on("disconnected", () => logger.warn("Mongo disconnected"));
    await mongoose.connect(`${env.MONGODB_URI}/vibe-chat`);
  } catch (err) {
    logger.fatal({ err }, "Mongo connection failed");
    process.exit(1);
  }
};
