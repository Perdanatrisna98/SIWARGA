import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import type { WargaAccess } from "./warga-access";
import type {
  FamilyRelation,
  Gender,
  MaritalStatus,
  WargaRecord,
  WargaStats,
  WargaStatus,
} from "./warga-types";

export const WARGA_PAGE_SIZE = 10;

export type ListWargaParams = {
  q?: string;
  rt?: string;
  rw?: string;
  status?: string;
  page?: number;
  access: WargaAccess;
};

type WargaRow = RowDataPacket & {
  id: number;
  nik: string;
  kk: string | null;
  name: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  religion: string;
  marital_status: string;
  education: string | null;
  occupation: string | null;
  family_relation: string;
  phone: string | null;
  address: string;
  rt: string;
  rw: string;
  status: string;
  user_id: number | null;
  edit_requested_at: string | null;
};

const SELECT_COLUMNS = `
  id,
  nik,
  kk,
  name,
  gender,
  birth_place,
  DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date,
  religion,
  marital_status,
  education,
  occupation,
  family_relation,
  phone,
  address,
  rt,
  rw,
  status,
  user_id,
  DATE_FORMAT(edit_requested_at, '%Y-%m-%d') AS edit_requested_at
`;

function mapRow(row: WargaRow): WargaRecord {
  return {
    id: Number(row.id),
    nik: row.nik,
    kk: row.kk,
    name: row.name,
    gender: row.gender as Gender,
    birth_place: row.birth_place,
    birth_date: row.birth_date,
    religion: row.religion,
    marital_status: row.marital_status as MaritalStatus,
    education: row.education,
    occupation: row.occupation,
    family_relation: row.family_relation as FamilyRelation,
    phone: row.phone,
    address: row.address,
    rt: row.rt,
    rw: row.rw,
    status: row.status as WargaStatus,
    user_id: row.user_id ? Number(row.user_id) : null,
    edit_requested_at: row.edit_requested_at || null,
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

function buildFilters(params: ListWargaParams) {
  const accessFilter = buildAccessFilter(params.access);
  const conditions: string[] = [...accessFilter.conditions];
  const values: (string | number)[] = [...accessFilter.values];

  const q = params.q?.trim();

  if (q) {
    const like = `%${q}%`;
    conditions.push(
      "(name LIKE ? OR nik LIKE ? OR kk LIKE ? OR phone LIKE ?)",
    );
    values.push(like, like, like, like);
  }

  if (params.rt) {
    conditions.push("rt = ?");
    values.push(params.rt);
  }

  if (params.rw) {
    conditions.push("rw = ?");
    values.push(params.rw);
  }

  if (params.status) {
    conditions.push("status = ?");
    values.push(params.status);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

export async function listWarga(params: ListWargaParams) {
  const { where, values } = buildFilters(params);
  const pageSize = WARGA_PAGE_SIZE;

  const [countRows] = await pool.execute<
    (RowDataPacket & { total: number | string })[]
  >(`SELECT COUNT(*) AS total FROM warga ${where}`, values);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<WargaRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM warga ${where} ORDER BY name ASC, id ASC LIMIT ? OFFSET ?`,
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

export async function getWargaById(id: number): Promise<WargaRecord | null> {
  const [rows] = await pool.execute<WargaRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM warga WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getWargaByUserId(
  userId: number,
): Promise<WargaRecord | null> {
  const [rows] = await pool.execute<WargaRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM warga WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getWargaStats(
  access: WargaAccess,
): Promise<WargaStats> {
  const scope = buildAccessFilter(access);
  const where =
    scope.conditions.length > 0
      ? `WHERE ${scope.conditions.join(" AND ")}`
      : "";

  const [rows] = await pool.execute<
    (RowDataPacket & {
      total: number | string;
      male: number | string | null;
      female: number | string | null;
      households: number | string;
    })[]
  >(
    `SELECT
       COUNT(*) AS total,
       SUM(gender = 'L') AS male,
       SUM(gender = 'P') AS female,
       COUNT(DISTINCT kk) AS households
     FROM warga ${where}`,
    scope.values,
  );

  const stats = rows[0];

  return {
    total: Number(stats?.total ?? 0),
    male: Number(stats?.male ?? 0),
    female: Number(stats?.female ?? 0),
    households: Number(stats?.households ?? 0),
  };
}
