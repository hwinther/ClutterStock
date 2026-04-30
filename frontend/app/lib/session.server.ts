import { redis } from "./redis.server";

export interface SessionUser {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  groups?: string[] | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix seconds
  idToken: string;
  user: SessionUser;
}

const COOKIE = "clutterstock_sid";
const TTL = 7 * 24 * 60 * 60; // 7 days

export function getSid(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  return /(?:^|;\s*)clutterstock_sid=([^;]+)/.exec(cookie)?.[1];
}

export async function getSession(
  request: Request,
): Promise<{ sid: string; data: Session } | null> {
  const sid = getSid(request);
  if (!sid) return null;
  const raw = await redis().get(`session:${sid}`);
  if (!raw) return null;
  return { sid, data: JSON.parse(raw) as Session };
}

export async function createSession(data: Session): Promise<string> {
  const sid = crypto.randomUUID();
  await redis().set(`session:${sid}`, JSON.stringify(data), { EX: TTL });
  return sid;
}

export async function updateSession(sid: string, data: Session): Promise<void> {
  const ttl = await redis().ttl(`session:${sid}`);
  await redis().set(`session:${sid}`, JSON.stringify(data), { EX: ttl > 0 ? ttl : TTL });
}

export async function destroySession(sid: string): Promise<void> {
  await redis().del(`session:${sid}`);
}

export function sessionCookie(sid: string): string {
  return `${COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}`;
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
