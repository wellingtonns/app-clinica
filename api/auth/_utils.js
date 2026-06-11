import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../_prisma.js";

const sessionCookieName = "softstetic_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export { bcrypt, prisma };

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      resolve(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return;
    }

    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV !== "production") return "softstetic-local-development-secret";
  throw new Error("JWT_SECRET não configurado.");
}

function getCookieHeaderOptions(maxAge = sessionMaxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function createSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    getJwtSecret(),
    { expiresIn: sessionMaxAgeSeconds }
  );
}

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${sessionCookieName}=${token}; ${getCookieHeaderOptions()}`);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${sessionCookieName}=; ${getCookieHeaderOptions(0)}`);
}

export function getSessionToken(req) {
  const cookieHeader = req.headers.cookie ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");
        return separatorIndex >= 0
          ? [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))]
          : [cookie, ""];
      })
  );

  return cookies[sessionCookieName] ?? "";
}

export function verifySessionToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}
