import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import type { WargaAccess } from "./warga-access";
import {
  isIuranStatus,
  type IuranJenisRecord,
  type IuranPeriod,
  type IuranStats,
  type IuranTagihanRecord,
} from "./iuran-types";

export const IURAN_PAGE_SIZE = 12;

type JenisRow = RowDataPacket & {
  id: number;
  name: string;
  amount: number | string;
  period: string;
  rw: string;
  rt: string | null;
  active: number | string | boolean;
  created_by: number | null;
};

type TagihanRow = RowDataPacket & {
  id: number;
  jenis_id: number;
  warga_id: number;
  jenis_name: string;
  jenis_period: string;
  warga_name: string;
  warga_nik: string;
  periode: string;
  amount: number | string;
  due_date: string;
  status: string;
  payment_method: string | null;
  proof_path: string | null;
  submitted_at: string | null;
  submitted_note: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  paid_by: number | null;
  paid_by_name: string | null;
  transaksi_id: number | null;
  note: string | null;
  rw: string;
  rt: string;
  created_by: number | null;
};

export type WargaTagihanOption = {
  id: number;
  name: string;
  nik: string;
  rt: string;
  rw: string;
};

const JENIS_COLUMNS = `
  j.id,
  j.name,
  j.amount,
  j.period,
  j.rw,
  j.rt,
  j.active,
  j.created_by
`;

const TAGIHAN_COLUMNS = `
  t.id,
  t.jenis_id,
  t.warga_id,
  t.jenis_name,
  t.jenis_period,
  t.warga_name,
  t.warga_nik,
  t.periode,
  t.amount,
  DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
  t.status,
  t.payment_method,
  t.proof_path,
  DATE_FORMAT(t.submitted_at, '%Y-%m-%d %H:%i:%s') AS submitted_at,
  t.submitted_note,
  t.rejection_reason,
  DATE_FORMAT(t.paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
  t.paid_by,
  u.name AS paid_by_name,
  t.transaksi_id,
  t.note,
  t.rw,
  t.rt,
  t.created_by
`;

function mapJenis(row: JenisRow): IuranJenisRecord {
  return {
    id: Number(row.id),
    name: row.name,
    amount: Number(row.amount),
    period: row.period as IuranPeriod,
    rw: row.rw,
    rt: row.rt,
    active: Boolean(Number(row.active)),
    created_by: row.created_by ? Number(row.created_by) : null,
  };
}

function mapTagihan(row: TagihanRow): IuranTagihanRecord {
  return {
    id: Number(row.id),
    jenis_id: Number(row.jenis_id),
    warga_id: Number(row.warga_id),
    jenis_name: row.jenis_name,
    jenis_period: row.jenis_period as IuranPeriod,
    warga_name: row.warga_name,
    warga_nik: row.warga_nik,
    periode: row.periode,
    amount: Number(row.amount),
    due_date: row.due_date,
    status: row.status as IuranTagihanRecord["status"],
    payment_method: row.payment_method
      ? (row.payment_method as IuranTagihanRecord["payment_method"])
      : null,
    proof_path: row.proof_path,
    submitted_at: row.submitted_at,
    submitted_note: row.submitted_note,
    rejection_reason: row.rejection_reason,
    paid_at: row.paid_at,
    paid_by: row.paid_by ? Number(row.paid_by) : null,
    paid_by_name: row.paid_by_name ?? null,
    transaksi_id: row.transaksi_id ? Number(row.transaksi_id) : null,
    note: row.note,
    rw: row.rw,
    rt: row.rt,
    created_by: row.created_by ? Number(row.created_by) : null,
  };
}

function buildAccessFilter(access: WargaAccess, alias: string) {
  const conditions: string[] = [];
  const values: string[] = [];

  if (access.blocked) {
    conditions.push("1 = 0");
  } else {
    if (access.rw) {
      conditions.push(`${alias}.rw = ?`);
      values.push(access.rw);
    }

    if (access.rt) {
      conditions.push(`${alias}.rt = ?`);
      values.push(access.rt);
    }
  }

  return { conditions, values };
}

export async function listIuranJenis(
  access: WargaAccess,
  options: { activeOnly?: boolean } = {},
): Promise<IuranJenisRecord[]> {
  const scope = buildAccessFilter(access, "j");
  const conditions = [...scope.conditions];
  const values: string[] = [...scope.values];

  if (options.activeOnly) {
    conditions.push("j.active = 1");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute<JenisRow[]>(
    `SELECT ${JENIS_COLUMNS}
     FROM iuran_jenis j
     ${where}
     ORDER BY j.active DESC, j.name ASC`,
    values,
  );

  return rows.map(mapJenis);
}

export async function getIuranJenisById(
  id: number,
  access: WargaAccess,
): Promise<IuranJenisRecord | null> {
  const scope = buildAccessFilter(access, "j");
  const conditions = ["j.id = ?", ...scope.conditions];
  const values: (string | number)[] = [id, ...scope.values];

  const [rows] = await pool.execute<JenisRow[]>(
    `SELECT
       j.id, j.name, j.amount, j.period, j.rw, j.rt, j.active, j.created_by
     FROM iuran_jenis j
     WHERE ${conditions.join(" AND ")}
     LIMIT 1`,
    values,
  );

  return rows[0] ? mapJenis(rows[0]) : null;
}

export async function countEligibleWarga(
  jenis: Pick<IuranJenisRecord, "rw" | "rt">,
): Promise<number> {
  const conditions = ["status = 'aktif'", "rw = ?"];
  const values: string[] = [jenis.rw];

  if (jenis.rt) {
    conditions.push("rt = ?");
    values.push(jenis.rt);
  }

  const [rows] = await pool.execute<
    (RowDataPacket & { total: number | string })[]
  >(
    `SELECT COUNT(*) AS total FROM warga WHERE ${conditions.join(" AND ")}`,
    values,
  );

  return Number(rows[0]?.total ?? 0);
}

export async function listEligibleWarga(
  jenis: Pick<IuranJenisRecord, "rw" | "rt">,
): Promise<WargaTagihanOption[]> {
  const conditions = ["status = 'aktif'", "rw = ?"];
  const values: string[] = [jenis.rw];

  if (jenis.rt) {
    conditions.push("rt = ?");
    values.push(jenis.rt);
  }

  const [rows] = await pool.execute<
    (RowDataPacket & {
      id: number;
      name: string;
      nik: string;
      rt: string;
      rw: string;
    })[]
  >(
    `SELECT id, name, nik, rt, rw FROM warga
     WHERE ${conditions.join(" AND ")}
     ORDER BY name ASC`,
    values,
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    nik: row.nik,
    rt: row.rt,
    rw: row.rw,
  }));
}

export type ListIuranTagihanParams = {
  q?: string;
  status?: string;
  jenisId?: number;
  periode?: string;
  page?: number;
  access: WargaAccess;
};

export async function listIuranTagihan(params: ListIuranTagihanParams) {
  const scope = buildAccessFilter(params.access, "t");
  const conditions = [...scope.conditions];
  const values: (string | number)[] = [...scope.values];

  const q = params.q?.trim();

  if (q) {
    const like = `%${q}%`;
    conditions.push(
      "(t.warga_name LIKE ? OR t.warga_nik LIKE ? OR t.jenis_name LIKE ?)",
    );
    values.push(like, like, like);
  }

  if (isIuranStatus(params.status)) {
    conditions.push("t.status = ?");
    values.push(params.status);
  }

  if (params.jenisId && Number.isInteger(params.jenisId)) {
    conditions.push("t.jenis_id = ?");
    values.push(params.jenisId);
  }

  if (params.periode) {
    conditions.push("t.periode = ?");
    values.push(params.periode);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const pageSize = IURAN_PAGE_SIZE;

  const [countRows] = await pool.execute<
    (RowDataPacket & { total: number | string })[]
  >(`SELECT COUNT(*) AS total FROM iuran_tagihan t ${where}`, values);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<TagihanRow[]>(
    `SELECT ${TAGIHAN_COLUMNS}
     FROM iuran_tagihan t
     LEFT JOIN users u ON u.id = t.paid_by
     ${where}
     ORDER BY (t.status = 'lunas') ASC, t.due_date ASC, t.id DESC
     LIMIT ? OFFSET ?`,
    [...values, pageSize, offset],
  );

  return {
    rows: rows.map(mapTagihan),
    total,
    page,
    totalPages,
    pageSize,
  };
}

export async function getIuranTagihanById(
  id: number,
  access: WargaAccess,
): Promise<IuranTagihanRecord | null> {
  const scope = buildAccessFilter(access, "t");
  const conditions = ["t.id = ?", ...scope.conditions];
  const values: (string | number)[] = [id, ...scope.values];

  const [rows] = await pool.execute<TagihanRow[]>(
    `SELECT ${TAGIHAN_COLUMNS}
     FROM iuran_tagihan t
     LEFT JOIN users u ON u.id = t.paid_by
     WHERE ${conditions.join(" AND ")}
     LIMIT 1`,
    values,
  );

  return rows[0] ? mapTagihan(rows[0]) : null;
}

export async function getIuranStats(access: WargaAccess): Promise<IuranStats> {
  const scope = buildAccessFilter(access, "t");
  const where = scope.conditions.length
    ? `WHERE ${scope.conditions.join(" AND ")}`
    : "";

  const [rows] = await pool.execute<
    (RowDataPacket & {
      total: number | string;
      paid: number | string;
      pending: number | string;
      unpaid: number | string;
      overdue: number | string;
      paid_amount: number | string | null;
      unpaid_amount: number | string | null;
    })[]
  >(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(t.status = 'lunas'), 0) AS paid,
       COALESCE(SUM(t.status = 'menunggu'), 0) AS pending,
       COALESCE(SUM(t.status = 'belum'), 0) AS unpaid,
       COALESCE(SUM(t.status = 'belum' AND t.due_date < CURDATE()), 0) AS overdue,
       COALESCE(SUM(CASE WHEN t.status = 'lunas' THEN t.amount ELSE 0 END), 0) AS paid_amount,
       COALESCE(SUM(CASE WHEN t.status = 'belum' THEN t.amount ELSE 0 END), 0) AS unpaid_amount
     FROM iuran_tagihan t ${where}`,
    scope.values,
  );

  const row = rows[0];

  return {
    total: Number(row?.total ?? 0),
    paid: Number(row?.paid ?? 0),
    pending: Number(row?.pending ?? 0),
    unpaid: Number(row?.unpaid ?? 0),
    overdue: Number(row?.overdue ?? 0),
    paidAmount: Number(row?.paid_amount ?? 0),
    unpaidAmount: Number(row?.unpaid_amount ?? 0),
  };
}

export async function listIuranTagihanForWarga(
  wargaId: number,
  params: { status?: string; page?: number } = {},
) {
  const conditions = ["t.warga_id = ?"];
  const values: (string | number)[] = [wargaId];

  if (isIuranStatus(params.status)) {
    conditions.push("t.status = ?");
    values.push(params.status);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const pageSize = IURAN_PAGE_SIZE;

  const [countRows] = await pool.execute<
    (RowDataPacket & { total: number | string })[]
  >(`SELECT COUNT(*) AS total FROM iuran_tagihan t ${where}`, values);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<TagihanRow[]>(
    `SELECT ${TAGIHAN_COLUMNS}
     FROM iuran_tagihan t
     LEFT JOIN users u ON u.id = t.paid_by
     ${where}
     ORDER BY (t.status = 'lunas') ASC, t.due_date ASC, t.id DESC
     LIMIT ? OFFSET ?`,
    [...values, pageSize, offset],
  );

  return {
    rows: rows.map(mapTagihan),
    total,
    page,
    totalPages,
    pageSize,
  };
}

export async function getIuranTagihanForWarga(
  id: number,
  wargaId: number,
): Promise<IuranTagihanRecord | null> {
  const [rows] = await pool.execute<TagihanRow[]>(
    `SELECT ${TAGIHAN_COLUMNS}
     FROM iuran_tagihan t
     LEFT JOIN users u ON u.id = t.paid_by
     WHERE t.id = ? AND t.warga_id = ?
     LIMIT 1`,
    [id, wargaId],
  );

  return rows[0] ? mapTagihan(rows[0]) : null;
}

export async function getWargaIuranStats(wargaId: number) {
  const [rows] = await pool.execute<
    (RowDataPacket & {
      total: number | string;
      paid: number | string;
      pending: number | string;
      unpaid: number | string;
      overdue: number | string;
      paid_amount: number | string | null;
      unpaid_amount: number | string | null;
    })[]
  >(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(status = 'lunas'), 0) AS paid,
       COALESCE(SUM(status = 'menunggu'), 0) AS pending,
       COALESCE(SUM(status = 'belum'), 0) AS unpaid,
       COALESCE(SUM(status = 'belum' AND due_date < CURDATE()), 0) AS overdue,
       COALESCE(SUM(CASE WHEN status = 'lunas' THEN amount ELSE 0 END), 0) AS paid_amount,
       COALESCE(SUM(CASE WHEN status = 'belum' THEN amount ELSE 0 END), 0) AS unpaid_amount
     FROM iuran_tagihan WHERE warga_id = ?`,
    [wargaId],
  );

  const row = rows[0];

  return {
    total: Number(row?.total ?? 0),
    paid: Number(row?.paid ?? 0),
    pending: Number(row?.pending ?? 0),
    unpaid: Number(row?.unpaid ?? 0),
    overdue: Number(row?.overdue ?? 0),
    paidAmount: Number(row?.paid_amount ?? 0),
    unpaidAmount: Number(row?.unpaid_amount ?? 0),
  };
}
