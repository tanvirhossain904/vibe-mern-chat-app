import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getCloudinarySignature } from "../controllers/uploadController.js";

const uploadRouter = express.Router();

uploadRouter.get("/signature", protectRoute, getCloudinarySignature);

export default uploadRouter;
