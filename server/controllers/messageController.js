import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { HttpError } from "../middleware/errorHandler.js";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

const emitToUser = (userId, event, payload) => {
  const socketId = userSocketMap[String(userId)];
  if (socketId) io.to(socketId).emit(event, payload);
};

export const getUsersForSidebar = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [users, unseenAgg] = await Promise.all([
      User.find({ _id: { $ne: userId } }).select("-password").lean(),
      Message.aggregate([
        { $match: { receiverId: userId, seen: false, deleted: { $ne: true } } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
      ]),
    ]);

    const unseenMessages = Object.fromEntries(
      unseenAgg.map((row) => [row._id.toString(), row.count])
    );

    res.json({ success: true, users, unseenMessages });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id: otherId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(otherId)) {
      throw new HttpError(400, "Invalid user id");
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    const filter = {
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    };
    if (before && !isNaN(before)) filter.createdAt = { $lt: before };

    const pageDesc = await Message.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    const messages = pageDesc.reverse();

    await Message.updateMany(
      { senderId: otherId, receiverId: myId, seen: false },
      { seen: true }
    );

    emitToUser(otherId, "messagesSeen", { byUserId: myId.toString() });

    res.json({ success: true, messages, hasMore: pageDesc.length === limit });
  } catch (err) {
    next(err);
  }
};

export const markMessageAsSeen = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid message id");
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { text, image, imageUrl: prebuiltUrl } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    if (!mongoose.isValidObjectId(receiverId)) {
      throw new HttpError(400, "Invalid receiver id");
    }

    let finalImage = prebuiltUrl;
    if (!finalImage && image) {
      const upload = await cloudinary.uploader.upload(image, { folder: "vibe-chat" });
      finalImage = upload.secure_url;
    }

    const newMessage = await Message.create({ senderId, receiverId, text, image: finalImage });

    emitToUser(receiverId, "newMessage", newMessage);

    res.status(201).json({ success: true, newMessage });
  } catch (err) {
    next(err);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid message id");

    const message = await Message.findById(id);
    if (!message) throw new HttpError(404, "Message not found");
    if (!message.senderId.equals(req.user._id)) throw new HttpError(403, "Not your message");
    if (message.deleted) throw new HttpError(400, "Cannot edit a deleted message");
    if (message.image) throw new HttpError(400, "Image messages cannot be edited");
    if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new HttpError(400, "Edit window (5 min) expired");
    }

    message.text = text;
    message.editedAt = new Date();
    await message.save();

    emitToUser(message.receiverId, "messageEdited", {
      _id: message._id,
      text: message.text,
      editedAt: message.editedAt,
    });

    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid message id");

    const message = await Message.findById(id);
    if (!message) throw new HttpError(404, "Message not found");
    if (!message.senderId.equals(req.user._id)) throw new HttpError(403, "Not your message");
    if (message.deleted) return res.json({ success: true, message });

    message.deleted = true;
    message.text = undefined;
    message.image = undefined;
    await message.save();

    emitToUser(message.receiverId, "messageDeleted", { _id: message._id });

    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
};
