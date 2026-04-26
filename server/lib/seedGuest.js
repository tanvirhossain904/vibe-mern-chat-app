import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { logger } from "./logger.js";

export const GUEST_EMAIL = "guest@vibe.com";
export const GUEST_PASSWORD = "password123";

const DEMO_USERS = [
  {
    email: "alex@vibe-demo.com",
    fullName: "Alex Carter",
    bio: "Coffee, code, repeat. Frontend at a startup.",
  },
  {
    email: "maya@vibe-demo.com",
    fullName: "Maya Singh",
    bio: "Product designer based in Berlin.",
  },
  {
    email: "riley@vibe-demo.com",
    fullName: "Riley Park",
    bio: "Just here to chat about side projects.",
  },
];

const ensureUser = async (data, makePassword) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) return existing;
  const password = await makePassword();
  return User.create({ ...data, password });
};

const buildSampleMessages = (guestId, demoIds) => {
  const minute = 60_000;
  const now = Date.now();

  const conversations = [
    {
      otherId: demoIds[0],
      messages: [
        { from: "other", text: "Hey, welcome to Vibe! I'm Alex.", offsetMin: 240 },
        { from: "guest", text: "Thanks! Loving the UI so far.", offsetMin: 238 },
        {
          from: "other",
          text: "It's a real-time MERN chat. Try pasting an image into the input too.",
          offsetMin: 235,
        },
      ],
    },
    {
      otherId: demoIds[1],
      messages: [
        { from: "other", text: "Heya, Maya here. Designer side of the team.", offsetMin: 120 },
        { from: "guest", text: "Nice to meet you!", offsetMin: 118 },
        { from: "other", text: "Curious what you think of the dark theme.", offsetMin: 115 },
      ],
    },
    {
      otherId: demoIds[2],
      messages: [
        { from: "other", text: "Yo, did you try the typing indicator yet?", offsetMin: 30 },
        {
          from: "other",
          text: "Open a chat and start typing — the other side sees it live.",
          offsetMin: 28,
        },
      ],
    },
  ];

  const docs = [];
  for (const conv of conversations) {
    for (const m of conv.messages) {
      const senderId = m.from === "guest" ? guestId : conv.otherId;
      const receiverId = m.from === "guest" ? conv.otherId : guestId;
      const at = new Date(now - m.offsetMin * minute);
      docs.push({
        senderId,
        receiverId,
        text: m.text,
        seen: m.from === "guest",
        createdAt: at,
        updatedAt: at,
      });
    }
  }
  return docs;
};

export const seedGuest = async () => {
  try {
    const guest = await ensureUser(
      {
        email: GUEST_EMAIL,
        fullName: "Guest Visitor",
        bio: "Exploring Vibe. Feel free to message anyone in the sidebar!",
      },
      () => bcrypt.hash(GUEST_PASSWORD, 10)
    );

    const demos = [];
    for (const u of DEMO_USERS) {
      const demo = await ensureUser(u, () =>
        bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10)
      );
      demos.push(demo);
    }

    const hasGuestMessages = await Message.exists({
      $or: [{ senderId: guest._id }, { receiverId: guest._id }],
    });
    if (hasGuestMessages) {
      logger.info("Guest seed: messages already present, skipping");
      return;
    }

    const docs = buildSampleMessages(
      guest._id,
      demos.map((d) => d._id)
    );
    await Message.insertMany(docs);
    logger.info({ count: docs.length }, "Guest seed: sample messages inserted");
  } catch (err) {
    logger.error({ err }, "Guest seed failed");
  }
};
