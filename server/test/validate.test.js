import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  sendMessageWithUrlSchema,
  editMessageSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../middleware/validate.js";

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const out = signupSchema.parse({
      fullName: "Jane Doe",
      email: "JANE@EXAMPLE.COM",
      password: "longenoughpw",
      bio: "  hi  ",
    });
    expect(out.email).toBe("jane@example.com");
    expect(out.bio).toBe("hi");
  });

  it("rejects short passwords", () => {
    expect(() =>
      signupSchema.parse({ fullName: "Jane", email: "j@e.co", password: "short" })
    ).toThrow(/8 characters/);
  });

  it("rejects bad emails", () => {
    expect(() =>
      signupSchema.parse({ fullName: "Jane", email: "not-an-email", password: "longenoughpw" })
    ).toThrow();
  });
});

describe("loginSchema", () => {
  it("normalises email to lowercase", () => {
    const out = loginSchema.parse({ email: "X@Y.COM", password: "anything" });
    expect(out.email).toBe("x@y.com");
  });
});

describe("sendMessageWithUrlSchema", () => {
  it("requires text or image or imageUrl", () => {
    expect(() => sendMessageWithUrlSchema.parse({})).toThrow();
  });
  it("accepts text only", () => {
    expect(sendMessageWithUrlSchema.parse({ text: "hi" }).text).toBe("hi");
  });
  it("accepts a Cloudinary URL", () => {
    const out = sendMessageWithUrlSchema.parse({
      imageUrl: "https://res.cloudinary.com/demo/image/upload/x.jpg",
    });
    expect(out.imageUrl).toMatch(/cloudinary/);
  });
  it("rejects non-Cloudinary URLs", () => {
    expect(() =>
      sendMessageWithUrlSchema.parse({ imageUrl: "https://evil.com/x.jpg" })
    ).toThrow();
  });
  it("caps text at 2000 chars", () => {
    expect(() =>
      sendMessageWithUrlSchema.parse({ text: "x".repeat(2001) })
    ).toThrow();
  });
});

describe("editMessageSchema", () => {
  it("requires non-empty text", () => {
    expect(() => editMessageSchema.parse({ text: "   " })).toThrow();
  });
});

describe("password reset schemas", () => {
  it("forgotPasswordSchema requires a valid email", () => {
    expect(() => forgotPasswordSchema.parse({ email: "x" })).toThrow();
    expect(forgotPasswordSchema.parse({ email: "ok@x.co" }).email).toBe("ok@x.co");
  });
  it("resetPasswordSchema requires a token and 8+ char password", () => {
    expect(() =>
      resetPasswordSchema.parse({ token: "short", password: "longenoughpw" })
    ).toThrow();
    expect(() =>
      resetPasswordSchema.parse({ token: "x".repeat(40), password: "1234" })
    ).toThrow();
    expect(
      resetPasswordSchema.parse({ token: "x".repeat(40), password: "longenoughpw" })
    ).toBeTruthy();
  });
});
