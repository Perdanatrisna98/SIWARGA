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
  id,
  transaction_type,
  category,
  description,
  amount,
  DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
  rw,
  rt,
  created_by
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
  };
}

function buildAccessFilter(access: WargaAccess) {
  const conditions: string[] = [];
  const values: string[] = [];

  if (access.blocked) {
    conditions.push("1 = 0");
  } else {
    if (access.rw) {
      conditions.push("rw = ?");
      values.push(access.rw);
    }

    if (access.rt) {
      conditions.push("rt = ?");
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
    conditions.push("(description LIKE ? OR category LIKE ?)");
    values.push(like, like);
  }

  if (isKeuanganType(params.type)) {
    conditions.push("transaction_type = ?");
    values.push(params.type);
  }

  if (isKategoriKeuangan(params.category)) {
    conditions.push("category = ?");
    values.push(params.category);
  }

  if (params.from) {
    conditions.push("transaction_date >= ?");
    values.push(params.from);
  }

  if (params.to) {
    conditions.push("transaction_date <= ?");
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
  >(`SELECT COUNT(*) AS total FROM keuangan_transaksi ${where}`, values);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<KeuanganRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM keuangan_transaksi ${where}
     ORDER BY transaction_date DESC, id DESC
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
  const conditions = ["id = ?", ...scope.conditions];
  const values: (string | number)[] = [id, ...scope.values];

  const [rows] = await pool.execute<KeuanganRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM keuangan_transaksi
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
       COALESCE(SUM(CASE WHEN transaction_type = 'pemasukan' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN transaction_type = 'pengeluaran' THEN amount ELSE 0 END), 0) AS expense,
       COUNT(*) AS total
     FROM keuangan_transaksi ${where}`,
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
