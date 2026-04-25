import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { env, hasRedis } from "./env.js";
import { logger } from "./logger.js";

export const attachRedisAdapter = async (io) => {
  if (!hasRedis) {
    logger.info("REDIS_URL not set — using in-memory socket adapter (single-instance only)");
    return;
  }
  try {
    const pubClient = createClient({ url: env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Redis socket adapter connected — multi-instance ready");
  } catch (err) {
    logger.error({ err }, "Failed to attach Redis adapter — falling back to in-memory");
  }
};
