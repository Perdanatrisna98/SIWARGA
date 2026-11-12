import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { normalizeRole, type Role } from "./roles";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type Session,
} from "./session";

type SessionUserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  role: string;
  rw: string | null;
  rt: string | null;
};

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);

  if (!session) return null;

  // Ambil ulang data dari database agar perubahan role/wilayah atau akun yang
  // dihapus langsung berlaku tanpa menunggu token kedaluwarsa.
  try {
    const [rows] = await pool.execute<SessionUserRow[]>(
      "SELECT id, name, email, role, rw, rt FROM users WHERE id = ? LIMIT 1",
      [session.id],
    );

    const user = rows[0];

    if (!user) return null;

    const role = normalizeRole(user.role);

    if (!role) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      rw: user.rw ? user.rw.padStart(3, "0") : null,
      rt: user.rt ? user.rt.padStart(3, "0") : null,
    };
  } catch (error) {
    console.error("Gagal memuat sesi pengguna:", error);
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: Role): Promise<Session> {
  const session = await requireSession();

  if (session.role !== role) {
    redirect(`/dashboard/${session.role}`);
  }

  return session;
}
