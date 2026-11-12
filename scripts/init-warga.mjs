import fs from "node:fs";
import mysql from "mysql2/promise";
import { WARGA_TABLE_SQL } from "./warga-table.mjs";

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
  await connection.query(WARGA_TABLE_SQL);

  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warga'`,
    [DB_NAME],
  );
  const names = new Set(columns.map((column) => column.COLUMN_NAME));

  if (!names.has("user_id")) {
    await connection.query(
      "ALTER TABLE warga ADD COLUMN user_id INT UNSIGNED NULL AFTER status, ADD UNIQUE KEY uq_warga_user (user_id)",
    );
    console.log('Kolom "user_id" ditambahkan ke tabel "warga".');
  }

  if (!names.has("edit_requested_at")) {
    await connection.query(
      "ALTER TABLE warga ADD COLUMN edit_requested_at TIMESTAMP NULL DEFAULT NULL AFTER user_id",
    );
    console.log('Kolom "edit_requested_at" ditambahkan ke tabel "warga".');
  }

  console.log(`Tabel "warga" siap di database "${DB_NAME}".`);
} finally {
  await connection.end();
}
