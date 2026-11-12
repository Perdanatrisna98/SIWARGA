"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { parseWargaForm } from "@/lib/warga-validation";
import type { WargaFormState } from "./warga";

function isDuplicateEntry(error: unknown): boolean {
  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

async function ensureWarga() {
  const session = await requireSession();

  if (session.role !== "warga") {
    redirect(`/dashboard/${session.role}`);
  }

  return session;
}

function refreshProfilePaths() {
  revalidatePath("/dashboard/warga/profil");
  revalidatePath("/dashboard/admin/warga");
  revalidatePath("/dashboard/rt/warga");
  revalidatePath("/dashboard/rw/warga");
}

export async function submitWargaProfileAction(
  _prevState: WargaFormState,
  formData: FormData,
): Promise<WargaFormState> {
  const session = await ensureWarga();

  try {
    const [existingUser] = await pool.execute<
      (RowDataPacket & { id: number })[]
    >("SELECT id FROM warga WHERE user_id = ? LIMIT 1", [session.id]);

    if (existingUser.length > 0) {
      return {
        error:
          "Data Anda sudah pernah diisi. Data yang sudah tersimpan hanya dapat diubah oleh RT/RW.",
      };
    }
  } catch (error) {
    console.error("Gagal memeriksa data warga:", error);
    return {
      error: "Gagal memeriksa data Anda. Silakan coba beberapa saat lagi.",
    };
  }

  // Warga tidak boleh menentukan status kependudukan sendiri.
  formData.set("status", "aktif");

  const parsed = parseWargaForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const data = parsed.data;

  try {
    const [nikRows] = await pool.execute<
      (RowDataPacket & {
        id: number;
        user_id: number | null;
        status: string;
      })[]
    >("SELECT id, user_id, status FROM warga WHERE nik = ? LIMIT 1", [data.nik]);

    const existingNik = nikRows[0];

    if (existingNik) {
      if (existingNik.user_id && Number(existingNik.user_id) !== session.id) {
        return {
          error:
            "NIK sudah terdaftar pada akun lain. Hubungi RT/RW untuk menautkan data Anda.",
        };
      }

      if (existingNik.status !== "aktif") {
        return {
          error:
            "NIK sudah terdaftar dengan status tidak aktif. Hubungi RT/RW untuk membantu memperbarui data Anda.",
        };
      }

      await pool.execute<ResultSetHeader>(
        `UPDATE warga SET
           nik = ?, kk = ?, name = ?, gender = ?, birth_place = ?, birth_date = ?,
           religion = ?, marital_status = ?, education = ?, occupation = ?,
           family_relation = ?, phone = ?, address = ?, rt = ?, rw = ?,
           user_id = ?, edit_requested_at = NULL
         WHERE id = ?`,
        [
          data.nik,
          data.kk,
          data.name,
          data.gender,
          data.birth_place,
          data.birth_date,
          data.religion,
          data.marital_status,
          data.education,
          data.occupation,
          data.family_relation,
          data.phone,
          data.address,
          data.rt,
          data.rw,
          session.id,
          existingNik.id,
        ],
      );
    } else {
      await pool.execute<ResultSetHeader>(
        `INSERT INTO warga
          (nik, kk, name, gender, birth_place, birth_date, religion,
           marital_status, education, occupation, family_relation, phone,
           address, rt, rw, status, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', ?)`,
        [
          data.nik,
          data.kk,
          data.name,
          data.gender,
          data.birth_place,
          data.birth_date,
          data.religion,
          data.marital_status,
          data.education,
          data.occupation,
          data.family_relation,
          data.phone,
          data.address,
          data.rt,
          data.rw,
          session.id,
        ],
      );
    }

    await pool.execute<ResultSetHeader>(
      "UPDATE users SET rw = ?, rt = ? WHERE id = ?",
      [data.rw, data.rt, session.id],
    );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return {
        error:
          "Data warga sudah terdaftar. Hubungi RT/RW jika NIK Anda sudah tercatat.",
      };
    }

    console.error("Gagal menyimpan profil warga:", error);
    return {
      error: "Gagal menyimpan data Anda. Silakan coba beberapa saat lagi.",
    };
  }

  refreshProfilePaths();
  redirect("/dashboard/warga/profil?notice=saved");
}

export async function requestWargaEditAction(): Promise<void> {
  const session = await ensureWarga();
  let notice = "requested";

  try {
    const [rows] = await pool.execute<
      (RowDataPacket & { id: number; edit_requested_at: string | null })[]
    >(
      "SELECT id, edit_requested_at FROM warga WHERE user_id = ? LIMIT 1",
      [session.id],
    );

    const warga = rows[0];

    if (!warga) {
      notice = "request-error";
    } else if (!warga.edit_requested_at) {
      await pool.execute<ResultSetHeader>(
        "UPDATE warga SET edit_requested_at = CURRENT_TIMESTAMP WHERE id = ?",
        [warga.id],
      );
    }
  } catch (error) {
    console.error("Gagal mengirim permintaan perubahan:", error);
    notice = "request-error";
  }

  refreshProfilePaths();
  redirect(`/dashboard/warga/profil?notice=${notice}`);
}
