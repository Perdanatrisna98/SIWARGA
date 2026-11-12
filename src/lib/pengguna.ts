import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import type { PenggunaRecord, PenggunaStats } from "./pengguna-types";
import { normalizeRole, type Role } from "./roles";

export const PENGGUNA_PAGE_SIZE = 10;

export type ListPenggunaParams = {
  q?: string;
  role?: Role | "";
  rw?: string;
  rt?: string;
  page?: number;
};

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  role: string;
  rw: string | null;
  rt: string | null;
  created_at: string;
};

const SELECT_COLUMNS = `
  id,
  name,
  email,
  role,
  rw,
  rt,
  DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at
`;

function mapRow(row: UserRow): PenggunaRecord {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: normalizeRole(row.role) ?? "warga",
    rw: row.rw || null,
    rt: row.rt || null,
    created_at: row.created_at,
  };
}

function buildFilters(params: ListPenggunaParams) {
  const conditions: string[] = [];
  const values: string[] = [];

  const q = params.q?.trim();

  if (q) {
    const like = `%${q}%`;
    conditions.push("(name LIKE ? OR email LIKE ?)");
    values.push(like, like);
  }

  if (params.role) {
    conditions.push("role = ?");
    values.push(params.role);
  }

  if (params.rw) {
    conditions.push("rw = ?");
    values.push(params.rw);
  }

  if (params.rt) {
    conditions.push("rt = ?");
    values.push(params.rt);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

export async function listPengguna(params: ListPenggunaParams) {
  const { where, values } = buildFilters(params);
  const pageSize = PENGGUNA_PAGE_SIZE;

  const [countRows] = await pool.execute<
    (RowDataPacket & { total: number | string })[]
  >(`SELECT COUNT(*) AS total FROM users ${where}`, values);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<UserRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM users ${where} ORDER BY name ASC, id ASC LIMIT ? OFFSET ?`,
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

export async function getPenggunaById(
  id: number,
): Promise<PenggunaRecord | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getPenggunaStats(): Promise<PenggunaStats> {
  const [rows] = await pool.execute<
    (RowDataPacket & {
      total: number | string;
      admin: number | string | null;
      rt: number | string | null;
      rw: number | string | null;
      warga: number | string | null;
    })[]
  >(
    `SELECT
       COUNT(*) AS total,
       SUM(role = 'admin') AS admin,
       SUM(role = 'rt') AS rt,
       SUM(role = 'rw') AS rw,
       SUM(role = 'warga') AS warga
     FROM users`,
  );

  const stats = rows[0];

  return {
    total: Number(stats?.total ?? 0),
    admin: Number(stats?.admin ?? 0),
    rt: Number(stats?.rt ?? 0),
    rw: Number(stats?.rw ?? 0),
    warga: Number(stats?.warga ?? 0),
  };
}
