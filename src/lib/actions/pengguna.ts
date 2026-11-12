"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { isRole, type Role } from "@/lib/roles";

export type PenggunaFormState = {
  error?: string;
};

type ParsedPengguna = {
  name: string;
  email: string;
  role: Role;
  rw: string | null;
  rt: string | null;
  password: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RT_RW_PATTERN = /^\d{1,3}$/;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function isDuplicateEntry(error: unknown): boolean {
  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

function parsePenggunaForm(
  formData: FormData,
  mode: "create" | "edit",
): { data: ParsedPengguna } | { error: string } {
  const name = text(formData, "name").replace(/\s+/g, " ");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleInput = text(formData, "role").toLowerCase();
  const rawRw = text(formData, "rw");
  const rawRt = text(formData, "rt");

  if (name.length < 3) {
    return { error: "Nama lengkap minimal 3 karakter." };
  }

  if (name.length > 100) {
    return { error: "Nama lengkap maksimal 100 karakter." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Format email tidak valid." };
  }

  if (email.length > 150) {
    return { error: "Email maksimal 150 karakter." };
  }

  if (mode === "create" && password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  if (mode === "edit" && password.length > 0 && password.length < 6) {
    return { error: "Password baru minimal 6 karakter." };
  }

  if (password.length > 72) {
    return { error: "Password maksimal 72 karakter." };
  }

  if (!isRole(roleInput)) {
    return { error: "Role pengguna wajib dipilih." };
  }

  let rw = rawRw || null;
  let rt = rawRt || null;

  if (roleInput === "admin") {
    rw = null;
    rt = null;
  } else {
    if (rw && !RT_RW_PATTERN.test(rw)) {
      return { error: "RW harus berupa 1-3 angka." };
    }

    if (rt && !RT_RW_PATTERN.test(rt)) {
      return { error: "RT harus berupa 1-3 angka." };
    }

    if (roleInput === "rw") {
      if (!rw) {
        return { error: "RW wajib diisi untuk akun Pengurus RW." };
      }
      rt = null;
    }

    if (roleInput === "rt") {
      if (!rw) {
        return { error: "RW wajib diisi untuk akun Pengurus RT." };
      }
      if (!rt) {
        return { error: "RT wajib diisi untuk akun Pengurus RT." };
      }
    }

    if (roleInput === "warga" && rt && !rw) {
      return { error: "RW wajib diisi jika RT diisi." };
    }
  }

  // Samakan format dengan data warga: 1 -> 001.
  if (rw) rw = rw.padStart(3, "0");
  if (rt) rt = rt.padStart(3, "0");

  return {
    data: {
      name,
      email,
      role: roleInput,
      rw,
      rt,
      password: password.length > 0 ? password : null,
    },
  };
}

async function ensureAdmin() {
  const session = await requireSession();

  if (session.role !== "admin") {
    redirect(`/dashboard/${session.role}`);
  }

  return session;
}

function refreshPenggunaPaths() {
  revalidatePath("/dashboard/admin/pengguna");
  revalidatePath("/dashboard/admin");
}

export async function createPenggunaAction(
  _prevState: PenggunaFormState,
  formData: FormData,
): Promise<PenggunaFormState> {
  const session = await ensureAdmin();
  const parsed = parsePenggunaForm(formData, "create");

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const data = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(data.password ?? "", 10);

    await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password, role, rw, rt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.name, data.email, passwordHash, data.role, data.rw, data.rt],
    );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { error: "Email sudah terdaftar. Gunakan email lain." };
    }

    console.error("Gagal menambahkan pengguna:", error);
    return {
      error: "Gagal menambahkan pengguna. Silakan coba beberapa saat lagi.",
    };
  }

  refreshPenggunaPaths();
  redirect(`/dashboard/${session.role}/pengguna?notice=created`);
}

export async function updatePenggunaAction(
  _prevState: PenggunaFormState,
  formData: FormData,
): Promise<PenggunaFormState> {
  const session = await ensureAdmin();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Data pengguna tidak valid." };
  }

  const parsed = parsePenggunaForm(formData, "edit");

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const data = parsed.data;

  if (id === session.id && data.role !== "admin") {
    return { error: "Anda tidak dapat mengubah role akun sendiri." };
  }

  try {
    const [existingRows] = await pool.execute<
      (RowDataPacket & { id: number; role: string })[]
    >("SELECT id, role FROM users WHERE id = ? LIMIT 1", [id]);

    const existing = existingRows[0];

    if (!existing) {
      return { error: "Data pengguna tidak ditemukan." };
    }

    if (existing.role === "admin" && data.role !== "admin") {
      const [adminRows] = await pool.execute<
        (RowDataPacket & { total: number | string })[]
      >("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");

      if (Number(adminRows[0]?.total ?? 0) <= 1) {
        return {
          error: "Akun admin terakhir tidak dapat diubah menjadi role lain.",
        };
      }
    }

    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);

      await pool.execute<ResultSetHeader>(
        `UPDATE users SET
           name = ?, email = ?, password = ?, role = ?, rw = ?, rt = ?
         WHERE id = ?`,
        [
          data.name,
          data.email,
          passwordHash,
          data.role,
          data.rw,
          data.rt,
          id,
        ],
      );
    } else {
      await pool.execute<ResultSetHeader>(
        `UPDATE users SET
           name = ?, email = ?, role = ?, rw = ?, rt = ?
         WHERE id = ?`,
        [data.name, data.email, data.role, data.rw, data.rt, id],
      );
    }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { error: "Email sudah digunakan oleh pengguna lain." };
    }

    console.error("Gagal memperbarui pengguna:", error);
    return {
      error: "Gagal memperbarui pengguna. Silakan coba beberapa saat lagi.",
    };
  }

  refreshPenggunaPaths();
  redirect(`/dashboard/${session.role}/pengguna?notice=updated`);
}

export async function deletePenggunaAction(formData: FormData): Promise<void> {
  const session = await ensureAdmin();
  const id = Number(formData.get("id"));
  let notice = "deleted";

  if (!Number.isInteger(id) || id <= 0) {
    notice = "delete-error";
  } else if (id === session.id) {
    notice = "self-error";
  } else {
    try {
      const [rows] = await pool.execute<
        (RowDataPacket & { role: string })[]
      >("SELECT role FROM users WHERE id = ? LIMIT 1", [id]);

      const target = rows[0];

      if (!target) {
        notice = "delete-error";
      } else {
        if (target.role === "admin") {
          const [adminRows] = await pool.execute<
            (RowDataPacket & { total: number | string })[]
          >("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");

          if (Number(adminRows[0]?.total ?? 0) <= 1) {
            notice = "last-admin";
          }
        }

        if (notice === "deleted") {
          await pool.execute<ResultSetHeader>(
            "UPDATE warga SET user_id = NULL, edit_requested_at = NULL WHERE user_id = ?",
            [id],
          );
          await pool.execute<ResultSetHeader>(
            "DELETE FROM users WHERE id = ?",
            [id],
          );
        }
      }
    } catch (error) {
      console.error("Gagal menghapus pengguna:", error);
      notice = "delete-error";
    }
  }

  refreshPenggunaPaths();
  redirect(`/dashboard/${session.role}/pengguna?notice=${notice}`);
}
