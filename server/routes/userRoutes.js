import express from "express";
import {
  signup,
  login,
  logout,
  checkAuth,
  updateProfile,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  validate,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../middleware/validate.js";

const userRouter = express.Router();

userRouter.post("/signup", authLimiter, validate(signupSchema), signup);
userRouter.post("/login", authLimiter, validate(loginSchema), login);
userRouter.post("/logout", logout);
userRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
userRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);
userRouter.put("/update-profile", protectRoute, validate(updateProfileSchema), updateProfile);
userRouter.delete("/me", protectRoute, deleteAccount);
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;
