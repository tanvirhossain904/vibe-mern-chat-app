import "dotenv/config";
import "../lib/env.js";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import { seedGuest } from "../lib/seedGuest.js";
import { logger } from "../lib/logger.js";

try {
  await connectDB();
  await seedGuest();
  await mongoose.disconnect();
  logger.info("Seed complete");
  process.exit(0);
} catch (err) {
  logger.fatal({ err }, "Seed failed");
  process.exit(1);
}
