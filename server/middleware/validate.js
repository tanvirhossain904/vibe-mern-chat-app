import { z } from "zod";

export const validate = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

const dataUrlImage = z
  .string()
  .regex(
    /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/,
    "Image must be a base64 data URL (jpeg/png/webp/gif)"
  )
  .refine((val) => val.length < 5_500_000, "Image too large (max ~4 MB)");

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  bio: z.string().trim().max(280).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(280).optional(),
  profilePic: dataUrlImage.optional(),
});

export const sendMessageSchema = z
  .object({
    text: z.string().trim().max(2000).optional(),
    image: dataUrlImage.optional(),
  })
  .refine((d) => d.text || d.image, "Message must include text or image");

export const editMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(72),
});

const cloudinaryUrl = z.string().url().regex(/res\.cloudinary\.com\//, "Must be a Cloudinary URL");

export const sendMessageWithUrlSchema = z
  .object({
    text: z.string().trim().max(2000).optional(),
    image: dataUrlImage.optional(),
    imageUrl: cloudinaryUrl.optional(),
  })
  .refine((d) => d.text || d.image || d.imageUrl, "Message must include text or image");
