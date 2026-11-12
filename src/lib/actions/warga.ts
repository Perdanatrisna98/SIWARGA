"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getWargaAccess } from "@/lib/warga-access";
import { parseWargaForm } from "@/lib/warga-validation";

export type WargaFormState = {
  error?: string;
};

function isDuplicateEntry(error: unknown): boolean {
  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

async function ensureManager() {
  const session = await requireSession();

  if (session.role === "warga") {
    redirect("/dashboard/warga");
  }

  return { session, access: getWargaAccess(session) };
}

function refreshWargaPaths() {
  revalidatePath("/dashboard/admin/warga");
  revalidatePath("/dashboard/rt/warga");
  revalidatePath("/dashboard/rw/warga");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/rt");
  revalidatePath("/dashboard/rw");
  revalidatePath("/dashboard/warga/profil");
}

export async function createWargaAction(
  _prevState: WargaFormState,
  formData: FormData,
): Promise<WargaFormState> {
  const { session, access } = await ensureManager();

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  const parsed = parseWargaForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const data = parsed.data;
  const rw = access.rw ?? data.rw;
  const rt = access.rt ?? data.rt;

  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO warga
        (nik, kk, name, gender, birth_place, birth_date, religion,
         marital_status, education, occupation, family_relation, phone,
         address, rt, rw, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        rt,
        rw,
        data.status,
      ],
    );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { error: "NIK sudah terdaftar. Periksa kembali data warga." };
    }

    console.error("Gagal menambahkan data warga:", error);
    return {
      error: "Gagal menyimpan data warga. Silakan coba beberapa saat lagi.",
    };
  }

  refreshWargaPaths();
  redirect(`/dashboard/${session.role}/warga?notice=created`);
}

export async function updateWargaAction(
  _prevState: WargaFormState,
  formData: FormData,
): Promise<WargaFormState> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Data warga tidak valid." };
  }

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  const parsed = parseWargaForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const data = parsed.data;
  const rw = access.rw ?? data.rw;
  const rt = access.rt ?? data.rt;

  try {
    const conditions = ["id = ?"];
    const values: (string | number)[] = [id];

    if (access.rw) {
      conditions.push("rw = ?");
      values.push(access.rw);
    }

    if (access.rt) {
      conditions.push("rt = ?");
      values.push(access.rt);
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM warga WHERE ${conditions.join(" AND ")} LIMIT 1`,
      values,
    );

    if (existing.length === 0) {
      return {
        error: "Data warga tidak ditemukan atau berada di luar wilayah Anda.",
      };
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE warga SET
         nik = ?, kk = ?, name = ?, gender = ?, birth_place = ?, birth_date = ?,
         religion = ?, marital_status = ?, education = ?, occupation = ?,
         family_relation = ?, phone = ?, address = ?, rt = ?, rw = ?, status = ?,
         edit_requested_at = NULL
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
        rt,
        rw,
        data.status,
        id,
      ],
    );
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { error: "NIK sudah digunakan oleh data warga lain." };
    }

    console.error("Gagal memperbarui data warga:", error);
    return {
      error: "Gagal memperbarui data warga. Silakan coba beberapa saat lagi.",
    };
  }

  refreshWargaPaths();
  redirect(`/dashboard/${session.role}/warga?notice=updated`);
}

export async function deleteWargaAction(formData: FormData): Promise<void> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));
  let failed = access.blocked;

  if (!Number.isInteger(id) || id <= 0) {
    failed = true;
  } else if (!failed) {
    try {
      const conditions = ["id = ?"];
      const values: (string | number)[] = [id];

      if (access.rw) {
        conditions.push("rw = ?");
        values.push(access.rw);
      }

      if (access.rt) {
        conditions.push("rt = ?");
        values.push(access.rt);
      }

      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM warga WHERE ${conditions.join(" AND ")}`,
        values,
      );

      if (result.affectedRows === 0) {
        failed = true;
      }
    } catch (error) {
      console.error("Gagal menghapus data warga:", error);
      failed = true;
    }
  }

  refreshWargaPaths();
  redirect(
    `/dashboard/${session.role}/warga?${failed ? "notice=delete-error" : "notice=deleted"}`,
  );
}
