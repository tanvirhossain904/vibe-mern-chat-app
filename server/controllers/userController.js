import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { generateToken, cookieOptions } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import { HttpError } from "../middleware/errorHandler.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const sanitize = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  const { password: _pw, __v: _v, resetTokenHash: _rth, resetTokenExpiresAt: _rte, ...rest } = obj;
  return rest;
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, bio } = req.body;

    const exists = await User.findOne({ email });
    if (exists) throw new HttpError(409, "Account already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ fullName, email, password: hashedPassword, bio });

    const token = generateToken(newUser._id);
    res.cookie("token", token, cookieOptions);
    res.status(201).json({ success: true, user: sanitize(newUser), token });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new HttpError(401, "Invalid credentials");

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.json({ success: true, user: sanitize(user), token });
  } catch (err) {
    next(err);
  }
};

export const logout = (_req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
  res.json({ success: true });
};

export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const update = {};
    if (typeof bio === "string") update.bio = bio;
    if (typeof fullName === "string") update.fullName = fullName;
    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic);
      update.profilePic = upload.secure_url;
    }
    const updated = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = hashToken(rawToken);
      user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
      try {
        const result = await sendPasswordResetEmail({ to: user.email, resetUrl });
        if (result?.skipped && env.NODE_ENV !== "production") {
          logger.info({ resetUrl }, "Dev password reset link (SMTP disabled)");
        }
      } catch (err) {
        logger.error({ err }, "Failed to send password reset email");
      }
    }

    res.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    });
    if (!user) throw new HttpError(400, "Reset link is invalid or expired");

    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
    await User.findByIdAndDelete(userId);
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    next(err);
  }
};
