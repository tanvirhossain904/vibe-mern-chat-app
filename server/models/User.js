import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    fullName: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    resetTokenHash: { type: String, default: null, index: true },
    resetTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
