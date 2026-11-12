import { SignJWT, jwtVerify } from "jose";
import { isRole, type Role } from "./roles";

export const SESSION_COOKIE = "siwarga_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

const FALLBACK_SECRET = "siwarga-dev-secret-change-me-in-production";

export type Session = {
  id: number;
  name: string;
  email: string;
  role: Role;
  rw: string | null;
  rt: string | null;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || FALLBACK_SECRET;
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({
    name: session.name,
    email: session.email,
    role: session.role,
    rw: session.rw,
    rt: session.rt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    const id = Number(payload.sub);
    const name = payload.name;
    const email = payload.email;
    const role = payload.role;
    const rw = typeof payload.rw === "string" ? payload.rw : null;
    const rt = typeof payload.rt === "string" ? payload.rt : null;

    if (!Number.isInteger(id) || id <= 0) return null;
    if (typeof name !== "string" || typeof email !== "string") return null;
    if (!isRole(role)) return null;

    return { id, name, email, role, rw, rt };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
