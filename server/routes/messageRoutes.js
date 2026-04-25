import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { validate, sendMessageWithUrlSchema, editMessageSchema } from "../middleware/validate.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
  editMessage,
  deleteMessage,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, validate(sendMessageWithUrlSchema), sendMessage);
messageRouter.put("/:id", protectRoute, validate(editMessageSchema), editMessage);
messageRouter.delete("/:id", protectRoute, deleteMessage);

export default messageRouter;
