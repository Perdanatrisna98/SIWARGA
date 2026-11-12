import fs from "node:fs";
import mysql from "mysql2/promise";
import { ensureUsersRegion, USERS_TABLE_SQL } from "./users-region.mjs";

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
  await connection.query(USERS_TABLE_SQL);

  const added = await ensureUsersRegion(connection, DB_NAME);

  console.log(`Database "${DB_NAME}" siap.`);
  console.log(
    added
      ? 'Kolom wilayah "rw" dan "rt" ditambahkan ke tabel "users".'
      : 'Kolom wilayah "rw" dan "rt" sudah tersedia.',
  );
  console.log(
    'Akun RT/RW lama tanpa wilayah otomatis diatur ke RW 001 (RT 001 untuk role RT).',
  );
} finally {
  await connection.end();
}
