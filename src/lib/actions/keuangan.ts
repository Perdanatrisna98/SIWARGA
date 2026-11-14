"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getWargaAccess } from "@/lib/warga-access";
import { parseKeuanganForm } from "@/lib/keuangan-validation";

export type KeuanganFormState = {
  error?: string;
};

async function ensureManager() {
  const session = await requireSession();

  if (session.role === "warga") {
    redirect("/dashboard/warga");
  }

  return { session, access: getWargaAccess(session) };
}

function refreshKeuanganPaths() {
  revalidatePath("/dashboard/admin/keuangan");
  revalidatePath("/dashboard/rt/keuangan");
  revalidatePath("/dashboard/rw/keuangan");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/rt");
  revalidatePath("/dashboard/rw");
}

export async function createKeuanganAction(
  _prevState: KeuanganFormState,
  formData: FormData,
): Promise<KeuanganFormState> {
  const { session, access } = await ensureManager();

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  const parsed = parseKeuanganForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const data = parsed.data;
  const rw = access.rw ?? data.rw;
  const rt = access.rt ?? data.rt;

  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO keuangan_transaksi
        (transaction_type, category, description, amount, transaction_date,
         rw, rt, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type,
        data.category,
        data.description,
        data.amount,
        data.transaction_date,
        rw,
        rt,
        session.id,
      ],
    );
  } catch (error) {
    console.error("Gagal mencatat transaksi kas:", error);
    return {
      error: "Gagal menyimpan transaksi kas. Silakan coba beberapa saat lagi.",
    };
  }

  refreshKeuanganPaths();
  redirect(`/dashboard/${session.role}/keuangan?notice=created`);
}

export async function updateKeuanganAction(
  _prevState: KeuanganFormState,
  formData: FormData,
): Promise<KeuanganFormState> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Transaksi tidak valid." };
  }

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  const parsed = parseKeuanganForm(formData);

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
      `SELECT id FROM keuangan_transaksi WHERE ${conditions.join(" AND ")} LIMIT 1`,
      values,
    );

    if (existing.length === 0) {
      return {
        error: "Transaksi tidak ditemukan atau berada di luar wilayah Anda.",
      };
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE keuangan_transaksi SET
         transaction_type = ?, category = ?, description = ?, amount = ?,
         transaction_date = ?, rw = ?, rt = ?
       WHERE id = ?`,
      [
        data.type,
        data.category,
        data.description,
        data.amount,
        data.transaction_date,
        rw,
        rt,
        id,
      ],
    );
  } catch (error) {
    console.error("Gagal memperbarui transaksi kas:", error);
    return {
      error: "Gagal memperbarui transaksi kas. Silakan coba beberapa saat lagi.",
    };
  }

  refreshKeuanganPaths();
  redirect(`/dashboard/${session.role}/keuangan?notice=updated`);
}

export async function deleteKeuanganAction(formData: FormData): Promise<void> {
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

      const [linked] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM iuran_tagihan WHERE transaksi_id = ? LIMIT 1",
        [id],
      );

      if (linked.length > 0) {
        failed = true;
      } else {
        const [result] = await pool.execute<ResultSetHeader>(
          `DELETE FROM keuangan_transaksi WHERE ${conditions.join(" AND ")}`,
          values,
        );

        if (result.affectedRows === 0) failed = true;
      }
    } catch (error) {
      console.error("Gagal menghapus transaksi kas:", error);
      failed = true;
    }
  }

  refreshKeuanganPaths();
  redirect(
    `/dashboard/${session.role}/keuangan?${failed ? "notice=delete-error" : "notice=deleted"}`,
  );
}
