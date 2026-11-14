import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import type { WargaAccess } from "./warga-access";
import {
  isKategoriKeuangan,
  isKeuanganType,
  type KeuanganRecord,
  type KeuanganStats,
  type KeuanganType,
} from "./keuangan-types";

export const KEUANGAN_PAGE_SIZE = 10;

type KeuanganRow = RowDataPacket & {
  id: number;
  transaction_type: string;
  category: string;
  description: string;
  amount: number | string;
  transaction_date: string;
  rw: string;
  rt: string | null;
  created_by: number | null;
  created_by_name: string | null;
};

export type ListKeuanganParams = {
  q?: string;
  type?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  access: WargaAccess;
};

const SELECT_COLUMNS = `
  k.id,
  k.transaction_type,
  k.category,
  k.description,
  k.amount,
  DATE_FORMAT(k.transaction_date, '%Y-%m-%d') AS transaction_date,
  k.rw,
  k.rt,
  k.created_by,
  u.name AS created_by_name
`;

function mapRow(row: KeuanganRow): KeuanganRecord {
  return {
    id: Number(row.id),
    type: row.transaction_type as KeuanganType,
    category: row.category as KeuanganRecord["category"],
    description: row.description,
    amount: Number(row.amount),
    transaction_date: row.transaction_date,
    rw: row.rw,
    rt: row.rt,
    created_by: row.created_by ? Number(row.created_by) : null,
    created_by_name: row.created_by_name ?? null,
  };
}

function buildAccessFilter(access: WargaAccess) {
  const conditions: string[] = [];
  const values: string[] = [];

  if (access.blocked) {
    conditions.push("1 = 0");
  } else {
    if (access.rw) {
      conditions.push("k.rw = ?");
      values.push(access.rw);
    }

    if (access.rt) {
      conditions.push("k.rt = ?");
      values.push(access.rt);
    }
  }

  return { conditions, values };
}

function buildFilters(params: ListKeuanganParams) {
  const accessFilter = buildAccessFilter(params.access);
  const conditions: string[] = [...accessFilter.conditions];
  const values: (string | number)[] = [...accessFilter.values];

  const q = params.q?.trim();

  if (q) {
    const like = `%${q}%`;
    conditions.push("(k.description LIKE ? OR k.category LIKE ?)");
    values.push(like, like);
  }

  if (isKeuanganType(params.type)) {
    conditions.push("k.transaction_type = ?");
    values.push(params.type);
  }

  if (isKategoriKeuangan(params.category)) {
    conditions.push("k.category = ?");
    values.push(params.category);
  }

  if (params.from) {
    conditions.push("k.transaction_date >= ?");
    values.push(params.from);
  }

  if (params.to) {
    conditions.push("k.transaction_date <= ?");
    values.push(params.to);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

export async function listKeuangan(params: ListKeuanganParams) {
  const { where, values } = buildFilters(params);
  const pageSize = KEUANGAN_PAGE_SIZE;

  const [countRows] = await pool.execute<
    (RowDataPacket & { total: number | string })[]
  >(`SELECT COUNT(*) AS total FROM keuangan_transaksi k ${where}`, values);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<KeuanganRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM keuangan_transaksi k
     LEFT JOIN users u ON u.id = k.created_by
     ${where}
     ORDER BY k.transaction_date DESC, k.id DESC
     LIMIT ? OFFSET ?`,
    [...values, pageSize, offset],
  );

  return {
    rows: rows.map(mapRow),
    total,
    page,
    totalPages,
    pageSize,
  };
}

export async function getKeuanganById(
  id: number,
  access: WargaAccess,
): Promise<KeuanganRecord | null> {
  const scope = buildAccessFilter(access);
  const conditions = ["k.id = ?", ...scope.conditions];
  const values: (string | number)[] = [id, ...scope.values];

  const [rows] = await pool.execute<KeuanganRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM keuangan_transaksi k
     LEFT JOIN users u ON u.id = k.created_by
     WHERE ${conditions.join(" AND ")} LIMIT 1`,
    values,
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getKeuanganStats(
  access: WargaAccess,
): Promise<KeuanganStats> {
  const scope = buildAccessFilter(access);
  const where =
    scope.conditions.length > 0
      ? `WHERE ${scope.conditions.join(" AND ")}`
      : "";

  const [rows] = await pool.execute<
    (RowDataPacket & {
      income: number | string | null;
      expense: number | string | null;
      total: number | string;
    })[]
  >(
    `SELECT
       COALESCE(SUM(CASE WHEN k.transaction_type = 'pemasukan' THEN k.amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN k.transaction_type = 'pengeluaran' THEN k.amount ELSE 0 END), 0) AS expense,
       COUNT(*) AS total
     FROM keuangan_transaksi k ${where}`,
    scope.values,
  );

  const row = rows[0];
  const income = Number(row?.income ?? 0);
  const expense = Number(row?.expense ?? 0);

  return {
    balance: income - expense,
    income,
    expense,
    count: Number(row?.total ?? 0),
  };
}
