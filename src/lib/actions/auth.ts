"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { normalizeRole, type Role } from "@/lib/roles";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  type Session,
} from "@/lib/session";

export type AuthFormState = {
  error?: string;
};

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  rw: string | null;
  rt: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function startSession(session: Session) {
  const token = await createSessionToken(session);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  let redirectRole: Role | null = null;

  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, name, email, password, role, rw, rt FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    const user = rows[0];

    if (!user) {
      return { error: "Email atau password salah." };
    }

    const role = normalizeRole(user.role);

    if (!role) {
      return { error: "Email atau password salah." };
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return { error: "Email atau password salah." };
    }

    await startSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      rw: user.rw || null,
      rt: user.rt || null,
    });

    redirectRole = role;
  } catch (error) {
    console.error("Gagal melakukan login:", error);
    return {
      error: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.",
    };
  }

  if (redirectRole) {
    redirect(`/dashboard/${redirectRole}`);
  }

  return { error: "Email atau password salah." };
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 3) {
    return { error: "Nama lengkap minimal 3 karakter." };
  }

  if (name.length > 100) {
    return { error: "Nama lengkap maksimal 100 karakter." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Format email tidak valid." };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  let createdSession: Session | null = null;

  try {
    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    if (existing.length > 0) {
      return { error: "Email sudah terdaftar. Silakan gunakan email lain." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (name, email, password, role, rw, rt) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, passwordHash, "warga", null, null],
    );

    createdSession = {
      id: result.insertId,
      name,
      email,
      role: "warga",
      rw: null,
      rt: null,
    };

    await startSession(createdSession);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return { error: "Email sudah terdaftar. Silakan gunakan email lain." };
    }

    console.error("Gagal melakukan registrasi:", error);
    return {
      error: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.",
    };
  }

  if (createdSession) {
    redirect("/dashboard/warga");
  }

  return { error: "Registrasi gagal. Silakan coba lagi." };
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });

  redirect("/login");
}
