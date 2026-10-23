import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { Request, Response, RequestHandler } from "express";
import type { AdminUser } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { HttpError } from "../lib/http-error";
import { DEMO_ADMIN_EMAIL, type AdminIdentity } from "../../../shared/admin-access";

const COOKIE = "iaris_session";
const SESSION_MS = 8 * 60 * 60 * 1000;
const OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, OPTIONS, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return `scrypt:${salt}:${key.toString("hex")}`;
}
async function verifyPassword(password: string, stored: string) {
  const [, salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const key = await derive(password, salt);
  const expected = Buffer.from(hex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const tokenFrom = (req: Request) =>
  (req.headers.cookie ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1) ?? "";
export function identity(user: AdminUser): AdminIdentity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase() as AdminIdentity["role"],
  };
}
export function database() {
  if (!prisma)
    throw new HttpError(
      503,
      "Chưa cấu hình database cho ứng dụng.",
    );
  return prisma;
}
export const sameOrigin: RequestHandler = (req, _res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const allowed = env.appOrigins.length
    ? env.appOrigins
    : [`${req.protocol}://${req.get("host")}`];
  if (!origin || !allowed.includes(origin) || !req.is("application/json"))
    throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.");
  next();
};
export const authenticated: RequestHandler = async (req, res, next) => {
  const token = tokenFrom(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new HttpError(401, "Vui lòng đăng nhập.");
  const session = await database().adminSession.findUnique({
    where: { id: digest(token) },
    include: { user: true },
  });
  if (
    !session || session.expiresAt <= new Date() || !session.user.active ||
    (session.user.email === DEMO_ADMIN_EMAIL && !env.demoAdminLogin)
  )
    throw new HttpError(401, "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
  res.locals.user = identity(session.user);
  next();
};
export const currentUser = (res: Response) => res.locals.user as AdminIdentity;

// Local-process login throttling. Use a shared limiter before scaling deployment.
const failures = new Map<string, { count: number; until: number }>();
const dummyHash = hashPassword(randomBytes(32).toString("hex"));
export async function login(
  req: Request,
  res: Response,
  email: string,
  password: string,
) {
  const key = req.ip ?? "unknown";
  const entry = failures.get(key);
  if (entry && entry.until > Date.now() && entry.count >= 10)
    throw new HttpError(
      429,
      "Thử đăng nhập quá nhiều lần. Vui lòng chờ 15 phút.",
    );
  const accountEmail = email === "admin" ? DEMO_ADMIN_EMAIL : email;
  const user = accountEmail === DEMO_ADMIN_EMAIL && !env.demoAdminLogin
    ? null
    : await database().adminUser.findUnique({ where: { email: accountEmail } });
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? (await dummyHash),
  );
  if (!user?.active || !valid) {
    for (const [ip, item] of failures)
      if (item.until <= Date.now()) failures.delete(ip);
    if (failures.size > 10000) failures.clear();
    failures.set(key, {
      count: entry && entry.until > Date.now() ? entry.count + 1 : 1,
      until:
        entry && entry.until > Date.now() ? entry.until : Date.now() + 900000,
    });
    throw new HttpError(401, "Tài khoản hoặc mật khẩu chưa đúng.");
  }
  failures.delete(key);
  const token = randomBytes(32).toString("hex");
  await database().$transaction([
    database().adminSession.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { id: digest(tokenFrom(req)) }],
      },
    }),
    database().adminSession.create({
      data: {
        id: digest(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_MS),
      },
    }),
  ]);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: SESSION_MS,
  });
  return identity(user);
}
export async function logout(req: Request, res: Response) {
  await database().adminSession.deleteMany({
    where: { id: digest(tokenFrom(req)) },
  });
  res.clearCookie(COOKIE, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    path: "/api/admin",
  });
}
