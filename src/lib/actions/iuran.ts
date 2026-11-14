"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getWargaAccess } from "@/lib/warga-access";
import {
  getIuranJenisById,
  getIuranTagihanForWarga,
  listEligibleWarga,
} from "@/lib/iuran";
import {
  parseGenerateTagihanForm,
  parseIuranJenisForm,
} from "@/lib/iuran-validation";
import { isIuranPaymentMethod } from "@/lib/iuran-types";
import { getWargaByUserId } from "@/lib/warga";
import { deletePaymentProof, savePaymentProof } from "@/lib/uploads";

export type IuranJenisFormState = {
  error?: string;
};

export type GenerateTagihanState = {
  error?: string;
};

export type PaymentFormState = {
  error?: string;
};

export type VerifyPaymentState = {
  error?: string;
};

async function ensureManager() {
  const session = await requireSession();

  if (session.role === "warga") {
    redirect("/dashboard/warga/iuran");
  }

  return { session, access: getWargaAccess(session) };
}

function refreshIuranPaths() {
  revalidatePath("/dashboard/admin/iuran");
  revalidatePath("/dashboard/rt/iuran");
  revalidatePath("/dashboard/rw/iuran");
  revalidatePath("/dashboard/admin/iuran/jenis");
  revalidatePath("/dashboard/rt/iuran/jenis");
  revalidatePath("/dashboard/rw/iuran/jenis");
  revalidatePath("/dashboard/admin/keuangan");
  revalidatePath("/dashboard/rt/keuangan");
  revalidatePath("/dashboard/rw/keuangan");
  revalidatePath("/dashboard/warga/iuran");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/rt");
  revalidatePath("/dashboard/rw");
  revalidatePath("/dashboard/warga");
}

export async function createIuranJenisAction(
  _prevState: IuranJenisFormState,
  formData: FormData,
): Promise<IuranJenisFormState> {
  const { session, access } = await ensureManager();

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  const parsed = parseIuranJenisForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const data = parsed.data;
  const rw = access.rw ?? data.rw;
  const rt = access.rt ?? data.rt;

  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO iuran_jenis (name, amount, period, rw, rt, active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.amount,
        data.period,
        rw,
        rt,
        data.active ? 1 : 0,
        session.id,
      ],
    );
  } catch (error) {
    console.error("Gagal menambahkan jenis iuran:", error);
    return {
      error: "Gagal menyimpan jenis iuran. Silakan coba beberapa saat lagi.",
    };
  }

  refreshIuranPaths();
  redirect(`/dashboard/${session.role}/iuran/jenis?notice=created`);
}

export async function updateIuranJenisAction(
  _prevState: IuranJenisFormState,
  formData: FormData,
): Promise<IuranJenisFormState> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Jenis iuran tidak valid." };
  }

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  const parsed = parseIuranJenisForm(formData);

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
      `SELECT id FROM iuran_jenis WHERE ${conditions.join(" AND ")} LIMIT 1`,
      values,
    );

    if (existing.length === 0) {
      return {
        error: "Jenis iuran tidak ditemukan atau berada di luar wilayah Anda.",
      };
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE iuran_jenis SET name = ?, amount = ?, period = ?, rw = ?, rt = ?,
         active = ?
       WHERE id = ?`,
      [data.name, data.amount, data.period, rw, rt, data.active ? 1 : 0, id],
    );
  } catch (error) {
    console.error("Gagal memperbarui jenis iuran:", error);
    return {
      error: "Gagal memperbarui jenis iuran. Silakan coba beberapa saat lagi.",
    };
  }

  refreshIuranPaths();
  redirect(`/dashboard/${session.role}/iuran/jenis?notice=updated`);
}

export async function toggleIuranJenisAction(
  formData: FormData,
): Promise<void> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));
  const next = formData.get("active") === "1" ? 1 : 0;
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
        `UPDATE iuran_jenis SET active = ? WHERE ${conditions.join(" AND ")}`,
        [next, ...values],
      );

      if (result.affectedRows === 0) failed = true;
    } catch (error) {
      console.error("Gagal mengubah status jenis iuran:", error);
      failed = true;
    }
  }

  refreshIuranPaths();
  redirect(
    `/dashboard/${session.role}/iuran/jenis?${
      failed ? "notice=update-error" : "notice=updated"
    }`,
  );
}

export async function deleteIuranJenisAction(
  formData: FormData,
): Promise<void> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));
  let failed = access.blocked;

  if (!Number.isInteger(id) || id <= 0) {
    failed = true;
  } else if (!failed) {
    try {
      const [used] = await pool.execute<
        (RowDataPacket & { total: number | string })[]
      >("SELECT COUNT(*) AS total FROM iuran_tagihan WHERE jenis_id = ?", [
        id,
      ]);

      if (Number(used[0]?.total ?? 0) > 0) {
        failed = true;
      } else {
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
          `DELETE FROM iuran_jenis WHERE ${conditions.join(" AND ")}`,
          values,
        );

        if (result.affectedRows === 0) failed = true;
      }
    } catch (error) {
      console.error("Gagal menghapus jenis iuran:", error);
      failed = true;
    }
  }

  refreshIuranPaths();
  redirect(
    `/dashboard/${session.role}/iuran/jenis?${
      failed ? "notice=delete-error" : "notice=deleted"
    }`,
  );
}

export async function generateTagihanAction(
  _prevState: GenerateTagihanState,
  formData: FormData,
): Promise<GenerateTagihanState> {
  const { session, access } = await ensureManager();

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  const jenisIdRaw = Number(formData.get("jenis_id"));

  if (!Number.isInteger(jenisIdRaw) || jenisIdRaw <= 0) {
    return { error: "Jenis iuran tidak valid." };
  }

  const jenis = await getIuranJenisById(jenisIdRaw, access);

  if (!jenis) {
    return { error: "Jenis iuran tidak ditemukan atau bukan wilayah Anda." };
  }

  if (!jenis.active) {
    return { error: "Jenis iuran tidak aktif. Aktifkan terlebih dahulu." };
  }

  const parsed = parseGenerateTagihanForm(formData, jenis.period);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const eligible = await listEligibleWarga(jenis);

  if (eligible.length === 0) {
    return {
      error:
        "Tidak ada warga aktif pada wilayah iuran ini. Tambahkan data warga terlebih dahulu.",
    };
  }

  const data = parsed.data;
  let inserted = 0;

  try {
    for (const warga of eligible) {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT IGNORE INTO iuran_tagihan
          (jenis_id, warga_id, jenis_name, jenis_period, warga_name, warga_nik,
           periode, amount, due_date, note, rw, rt, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jenis.id,
          warga.id,
          jenis.name,
          jenis.period,
          warga.name,
          warga.nik,
          data.periode,
          jenis.amount,
          data.dueDate,
          data.note,
          warga.rw,
          warga.rt,
          session.id,
        ],
      );

      inserted += result.affectedRows;
    }
  } catch (error) {
    console.error("Gagal membuat tagihan iuran:", error);
    return {
      error: "Gagal membuat tagihan iuran. Silakan coba beberapa saat lagi.",
    };
  }

  refreshIuranPaths();

  if (inserted === 0) {
    redirect(`/dashboard/${session.role}/iuran?notice=generated-none`);
  }

  redirect(
    `/dashboard/${session.role}/iuran?notice=generated&count=${inserted}`,
  );
}

export async function verifyPaymentAction(
  _prevState: VerifyPaymentState,
  formData: FormData,
): Promise<VerifyPaymentState> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Tagihan tidak valid." };
  }

  if (access.blocked) {
    return {
      error:
        "Akun Anda belum memiliki wilayah. Hubungi admin untuk mengatur wilayah akun.",
    };
  }

  let uploadedPath: string | null = null;
  const proof = formData.get("proof");

  if (proof instanceof File && proof.size > 0) {
    const saved = await savePaymentProof(proof);

    if ("error" in saved) {
      return { error: saved.error };
    }

    uploadedPath = saved.path;
  }

  let outcome: "ok" | "notfound" | "already" | "error" = "error";
  let errorMessage: string | undefined;
  let oldProofToDelete: string | null = null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const scopeConditions = ["t.id = ?"];
    const scopeValues: (string | number)[] = [id];

    if (access.rw) {
      scopeConditions.push("t.rw = ?");
      scopeValues.push(access.rw);
    }

    if (access.rt) {
      scopeConditions.push("t.rt = ?");
      scopeValues.push(access.rt);
    }

    const [rows] = await connection.execute<
      (RowDataPacket & {
        id: number;
        jenis_name: string;
        warga_name: string;
        periode: string;
        amount: number | string;
        status: string;
        payment_method: string | null;
        proof_path: string | null;
        rw: string;
        rt: string;
      })[]
    >(
      `SELECT t.id, t.jenis_name, t.warga_name, t.periode, t.amount, t.status,
              t.payment_method, t.proof_path, t.rw, t.rt
         FROM iuran_tagihan t
         WHERE ${scopeConditions.join(" AND ")}
         FOR UPDATE`,
      scopeValues,
    );

    const tagihan = rows[0];

    if (!tagihan) {
      outcome = "notfound";
      errorMessage = "Tagihan tidak ditemukan atau berada di luar wilayah Anda.";
    } else if (tagihan.status === "lunas") {
      outcome = "already";
      errorMessage = "Tagihan ini sudah lunas.";
    } else {
      const methodRaw = formData.get("method");
      const method = isIuranPaymentMethod(methodRaw)
        ? methodRaw
        : tagihan.payment_method;

      const finalMethod = method ?? "cash";
      const finalProof = uploadedPath ?? tagihan.proof_path;

      if (!finalProof) {
        outcome = "error";
        errorMessage =
          "Bukti pembayaran wajib ada. Unggah bukti transfer/QRIS atau foto tanda terima tunai.";
      } else {
        const description = `Iuran ${tagihan.jenis_name} ${tagihan.periode} - ${tagihan.warga_name}`.slice(
          0,
          255,
        );

        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO keuangan_transaksi
            (transaction_type, category, description, amount, transaction_date,
             rw, rt, created_by)
           VALUES ('pemasukan', 'Iuran', ?, ?, CURDATE(), ?, ?, ?)`,
          [
            description,
            Number(tagihan.amount),
            tagihan.rw,
            tagihan.rt,
            session.id,
          ],
        );

        await connection.execute<ResultSetHeader>(
          `UPDATE iuran_tagihan SET
             status = 'lunas',
             payment_method = ?,
             proof_path = ?,
             rejection_reason = NULL,
             paid_at = NOW(),
             paid_by = ?,
             transaksi_id = ?
           WHERE id = ?`,
          [finalMethod, finalProof, session.id, result.insertId, id],
        );

        if (tagihan.proof_path && tagihan.proof_path !== finalProof) {
          oldProofToDelete = tagihan.proof_path;
        }

        outcome = "ok";
      }
    }

    if (outcome === "ok") {
      await connection.commit();
    } else {
      await connection.rollback();
    }
  } catch (error) {
    console.error("Gagal memverifikasi pembayaran iuran:", error);
    await connection.rollback();
    outcome = "error";
    errorMessage = "Verifikasi pembayaran gagal. Silakan coba lagi.";
  } finally {
    connection.release();
  }

  if (outcome !== "ok") {
    if (uploadedPath) await deletePaymentProof(uploadedPath);
    return { error: errorMessage ?? "Verifikasi pembayaran gagal." };
  }

  if (oldProofToDelete) await deletePaymentProof(oldProofToDelete);

  refreshIuranPaths();
  redirect(`/dashboard/${session.role}/iuran?notice=verified`);
}

export async function submitPaymentAction(
  _prevState: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const session = await requireSession();

  if (session.role !== "warga") {
    redirect(`/dashboard/${session.role}`);
  }

  const warga = await getWargaByUserId(session.id);

  if (!warga) {
    return {
      error:
        "Profil warga belum terhubung. Lengkapi Profil Saya terlebih dahulu.",
    };
  }

  const id = Number(formData.get("id"));
  const methodRaw = formData.get("method");
  const note = String(formData.get("note") ?? "").trim().slice(0, 255);
  const emptyToNull = (value: string) => (value.length > 0 ? value : null);

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Tagihan tidak valid." };
  }

  if (!isIuranPaymentMethod(methodRaw)) {
    return { error: "Pilih metode pembayaran terlebih dahulu." };
  }

  const tagihan = await getIuranTagihanForWarga(id, warga.id);

  if (!tagihan) {
    return { error: "Tagihan tidak ditemukan." };
  }

  if (tagihan.status === "lunas") {
    return { error: "Tagihan ini sudah lunas." };
  }

  if (tagihan.status === "menunggu") {
    return {
      error:
        "Pembayaran sudah diajukan dan sedang menunggu verifikasi pengurus.",
    };
  }

  let proofPath: string | null = null;

  if (methodRaw === "transfer" || methodRaw === "qris") {
    const saved = await savePaymentProof(formData.get("proof"));

    if ("error" in saved) {
      return { error: saved.error };
    }

    proofPath = saved.path;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE iuran_tagihan SET
         status = 'menunggu',
         payment_method = ?,
         proof_path = ?,
         submitted_at = NOW(),
         submitted_note = ?,
         rejection_reason = NULL
       WHERE id = ? AND warga_id = ? AND status = 'belum'`,
      [methodRaw, proofPath, emptyToNull(note), id, warga.id],
    );

    if (result.affectedRows === 0) {
      if (proofPath) await deletePaymentProof(proofPath);
      return {
        error:
          "Pengajuan gagal. Tagihan mungkin sudah dibayar atau sedang diverifikasi.",
      };
    }
  } catch (error) {
    console.error("Gagal mengajukan pembayaran iuran:", error);
    if (proofPath) await deletePaymentProof(proofPath);
    return { error: "Pengajuan pembayaran gagal. Silakan coba lagi." };
  }

  refreshIuranPaths();
  redirect("/dashboard/warga/iuran?notice=submitted");
}

export async function cancelSubmissionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireSession();

  if (session.role !== "warga") {
    redirect(`/dashboard/${session.role}`);
  }

  const warga = await getWargaByUserId(session.id);
  const id = Number(formData.get("id"));
  let failed = !warga || !Number.isInteger(id) || id <= 0;

  if (!failed && warga) {
    const tagihan = await getIuranTagihanForWarga(id, warga.id);

    if (!tagihan || tagihan.status !== "menunggu") {
      failed = true;
    } else {
      try {
        const [result] = await pool.execute<ResultSetHeader>(
          `UPDATE iuran_tagihan SET
             status = 'belum',
             payment_method = NULL,
             proof_path = NULL,
             submitted_at = NULL,
             submitted_note = NULL,
             rejection_reason = NULL
           WHERE id = ? AND warga_id = ? AND status = 'menunggu'`,
          [id, warga.id],
        );

        if (result.affectedRows === 0) {
          failed = true;
        } else {
          await deletePaymentProof(tagihan.proof_path);
        }
      } catch (error) {
        console.error("Gagal membatalkan pengajuan pembayaran:", error);
        failed = true;
      }
    }
  }

  refreshIuranPaths();
  redirect(
    `/dashboard/warga/iuran?${
      failed ? "notice=submit-cancel-error" : "notice=submitted-canceled"
    }`,
  );
}

export async function rejectPaymentAction(formData: FormData): Promise<void> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));
  let failed = access.blocked || !Number.isInteger(id) || id <= 0;
  let proofToDelete: string | null = null;

  if (!failed) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const conditions = ["id = ?", "status = 'menunggu'"];
      const values: (string | number)[] = [id];

      if (access.rw) {
        conditions.push("rw = ?");
        values.push(access.rw);
      }

      if (access.rt) {
        conditions.push("rt = ?");
        values.push(access.rt);
      }

      const [rows] = await connection.execute<
        (RowDataPacket & { proof_path: string | null })[]
      >(
        `SELECT proof_path FROM iuran_tagihan
          WHERE ${conditions.join(" AND ")}
          FOR UPDATE`,
        values,
      );

      if (!rows[0]) {
        failed = true;
      } else {
        proofToDelete = rows[0].proof_path;

        await connection.execute<ResultSetHeader>(
          `UPDATE iuran_tagihan SET
             status = 'belum',
             payment_method = NULL,
             proof_path = NULL,
             submitted_at = NULL,
             submitted_note = NULL,
             rejection_reason = ?
           WHERE ${conditions.join(" AND ")}`,
          ["Pengajuan pembayaran ditolak pengurus.", ...values],
        );
      }

      if (failed) {
        await connection.rollback();
      } else {
        await connection.commit();
      }
    } catch (error) {
      console.error("Gagal menolak pengajuan pembayaran:", error);
      await connection.rollback();
      failed = true;
    } finally {
      connection.release();
    }
  }

  if (!failed) await deletePaymentProof(proofToDelete);

  refreshIuranPaths();
  redirect(
    `/dashboard/${session.role}/iuran?${
      failed ? "notice=reject-error" : "notice=rejected"
    }`,
  );
}

export async function cancelPaymentAction(formData: FormData): Promise<void> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));

  let outcome: "ok" | "notfound" | "unpaid" | "error" = "error";
  let proofToDelete: string | null = null;

  if (!Number.isInteger(id) || id <= 0 || access.blocked) {
    outcome = "notfound";
  } else {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const scopeConditions = ["t.id = ?"];
      const scopeValues: (string | number)[] = [id];

      if (access.rw) {
        scopeConditions.push("t.rw = ?");
        scopeValues.push(access.rw);
      }

      if (access.rt) {
        scopeConditions.push("t.rt = ?");
        scopeValues.push(access.rt);
      }

      const [rows] = await connection.execute<
        (RowDataPacket & {
          id: number;
          status: string;
          transaksi_id: number | null;
          proof_path: string | null;
        })[]
      >(
        `SELECT t.id, t.status, t.transaksi_id, t.proof_path
         FROM iuran_tagihan t
         WHERE ${scopeConditions.join(" AND ")}
         FOR UPDATE`,
        scopeValues,
      );

      const tagihan = rows[0];

      if (!tagihan) {
        outcome = "notfound";
      } else if (tagihan.status !== "lunas") {
        outcome = "unpaid";
      } else {
        if (tagihan.transaksi_id) {
          await connection.execute<ResultSetHeader>(
            "DELETE FROM keuangan_transaksi WHERE id = ?",
            [tagihan.transaksi_id],
          );
        }

        proofToDelete = tagihan.proof_path;

        await connection.execute<ResultSetHeader>(
          `UPDATE iuran_tagihan SET
             status = 'belum',
             payment_method = NULL,
             proof_path = NULL,
             submitted_at = NULL,
             submitted_note = NULL,
             rejection_reason = NULL,
             paid_at = NULL,
             paid_by = NULL,
             transaksi_id = NULL
           WHERE id = ?`,
          [id],
        );

        outcome = "ok";
      }

      if (outcome === "ok") {
        await connection.commit();
      } else {
        await connection.rollback();
      }
    } catch (error) {
      console.error("Gagal membatalkan verifikasi pembayaran:", error);
      await connection.rollback();
      outcome = "error";
    } finally {
      connection.release();
    }
  }

  if (outcome === "ok") await deletePaymentProof(proofToDelete);

  refreshIuranPaths();
  redirect(
    `/dashboard/${session.role}/iuran?${
      outcome === "ok"
        ? "notice=canceled"
        : outcome === "unpaid"
          ? "notice=not-paid"
          : "notice=cancel-error"
    }`,
  );
}

export async function deleteTagihanAction(formData: FormData): Promise<void> {
  const { session, access } = await ensureManager();
  const id = Number(formData.get("id"));
  let failed = access.blocked;

  if (!Number.isInteger(id) || id <= 0) {
    failed = true;
  } else if (!failed) {
    try {
      const conditions = ["id = ?", "status = 'belum'"];
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
        `DELETE FROM iuran_tagihan WHERE ${conditions.join(" AND ")}`,
        values,
      );

      if (result.affectedRows === 0) failed = true;
    } catch (error) {
      console.error("Gagal menghapus tagihan iuran:", error);
      failed = true;
    }
  }

  refreshIuranPaths();
  redirect(
    `/dashboard/${session.role}/iuran?${
      failed ? "notice=delete-error" : "notice=deleted"
    }`,
  );
}
