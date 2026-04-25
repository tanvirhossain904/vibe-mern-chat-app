import cloudinary from "../lib/cloudinary.js";
import { env } from "../lib/env.js";

export const getCloudinarySignature = (_req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "vibe-chat";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET
  );

  res.json({
    success: true,
    signature,
    timestamp,
    folder,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
  });
};
