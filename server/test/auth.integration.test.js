import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import userRouter from "../routes/userRoutes.js";
import { errorHandler, notFound } from "../middleware/errorHandler.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

let mongo;
let app;

const buildApp = () => {
  const a = express();
  a.use(express.json({ limit: "1mb" }));
  a.use(cookieParser());
  a.use("/api/auth", userRouter);
  a.use(notFound);
  a.use(errorHandler);
  return a;
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = buildApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Message.deleteMany({});
});

describe("POST /api/auth/signup", () => {
  it("creates an account and sets a cookie", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ fullName: "Jane Doe", email: "jane@example.com", password: "longenoughpw" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("jane@example.com");
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]?.[0]).toMatch(/token=/);
  });

  it("rejects duplicate emails with 409", async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Jane",
      email: "jane@example.com",
      password: "longenoughpw",
    });
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Jane Two",
      email: "jane@example.com",
      password: "longenoughpw",
    });
    expect(res.status).toBe(409);
  });

  it("rejects weak passwords with 400", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Jane",
      email: "jane@example.com",
      password: "short",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Jane",
      email: "jane@example.com",
      password: "longenoughpw",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "longenoughpw" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects wrong password with 401 and a generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("rejects unknown email with the same generic 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nope@example.com", password: "longenoughpw" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});

describe("DELETE /api/auth/me", () => {
  it("requires auth", async () => {
    const res = await request(app).delete("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("deletes the account when authenticated", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      fullName: "Jane",
      email: "jane@example.com",
      password: "longenoughpw",
    });
    const cookie = signupRes.headers["set-cookie"];
    const userId = signupRes.body.user._id;

    await Message.create({ senderId: userId, receiverId: userId, text: "hi" });

    const res = await request(app).delete("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(await User.findById(userId)).toBeNull();
    expect(await Message.countDocuments()).toBe(0);
  });
});

describe("password reset flow", () => {
  it("forgot-password always returns success (no enumeration)", async () => {
    const a = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });
    expect(a.status).toBe(200);
    expect(a.body.success).toBe(true);
  });

  it("reset-password with bad token returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "x".repeat(40), password: "newlongenough" });
    expect(res.status).toBe(400);
  });
});
