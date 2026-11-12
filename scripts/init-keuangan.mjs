import fs from "node:fs";
import mysql from "mysql2/promise";
import { KEUANGAN_TABLE_STATEMENTS } from "./keuangan-table.mjs";

// Muat .env.local bila ada (Node 20.12+)
if (fs.existsSync(".env.local")) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // abaikan, gunakan nilai default di bawah
  }
}

const DB_NAME = process.env.DB_NAME || "siwarga_v2";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: false,
});

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.query(`USE \`${DB_NAME}\``);

  for (const statement of KEUANGAN_TABLE_STATEMENTS) {
    await connection.query(statement);
  }

  console.log(`Tabel keuangan dan iuran siap di database "${DB_NAME}".`);
} finally {
  await connection.end();
}
