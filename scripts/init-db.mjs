import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import {
  ensureUsersRegion,
  USERS_TABLE_SQL,
} from "./users-region.mjs";
import { WARGA_TABLE_SQL } from "./warga-table.mjs";
import { KEUANGAN_TABLE_STATEMENTS } from "./keuangan-table.mjs";
import "./load-env.mjs";

const DB_NAME = process.env.DB_NAME || "siwarga_v2";
const DEFAULT_PASSWORD = "123456";

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
  await ensureUsersRegion(connection, DB_NAME);
  await connection.query(WARGA_TABLE_SQL);

  for (const statement of KEUANGAN_TABLE_STATEMENTS) {
    await connection.query(statement);
  }

  const accounts = [
    {
      name: "Administrator",
      email: "admin@siwarga.com",
      role: "admin",
      rw: null,
      rt: null,
    },
  ];

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const account of accounts) {
    await connection.execute(
      `INSERT INTO users (name, email, password, role, rw, rt)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password = VALUES(password),
         role = VALUES(role),
         rw = VALUES(rw),
         rt = VALUES(rt)`,
      [
        account.name,
        account.email,
        passwordHash,
        account.role,
        account.rw,
        account.rt,
      ],
    );
  }

  const keepEmails = accounts.map((account) => account.email);
  const keepPlaceholders = keepEmails.map(() => "?").join(", ");

  // Buang akun lain agar hanya ada satu akun utama (admin)
  await connection.execute(
    `UPDATE warga
        SET user_id = NULL
      WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT id FROM (SELECT id FROM users WHERE email IN (${keepPlaceholders})) AS keep_users)`,
    keepEmails,
  );
  await connection.execute(
    `DELETE FROM users WHERE email NOT IN (${keepPlaceholders})`,
    keepEmails,
  );

  console.log(`Database "${DB_NAME}" siap.`);
  console.log(`Tabel "users", "warga", "keuangan", dan "iuran" siap.`);
  console.log("Akun yang tersedia (password: 123456):");
  for (const account of accounts) {
    console.log(`  - ${account.role.padEnd(5)} : ${account.email}`);
  }
} finally {
  await connection.end();
}
