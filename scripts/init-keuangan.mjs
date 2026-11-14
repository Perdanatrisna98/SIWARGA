import mysql from "mysql2/promise";
import { KEUANGAN_TABLE_STATEMENTS } from "./keuangan-table.mjs";
import "./load-env.mjs";

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

  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME, COLUMN_TYPE
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'iuran_tagihan'`,
    [DB_NAME],
  );
  const names = new Map(
    columns.map((column) => [column.COLUMN_NAME, column.COLUMN_TYPE]),
  );

  const statusType = names.get("status") ?? "";
  if (!statusType.includes("menunggu")) {
    await connection.query(
      `ALTER TABLE iuran_tagihan
         MODIFY COLUMN status ENUM('belum', 'menunggu', 'lunas')
         NOT NULL DEFAULT 'belum'`,
    );
    console.log('Status "menunggu" ditambahkan ke tabel "iuran_tagihan".');
  }

  const migrations = [
    {
      column: "payment_method",
      sql: `ALTER TABLE iuran_tagihan
              ADD COLUMN payment_method ENUM('cash', 'transfer', 'qris') NULL
              AFTER status`,
    },
    {
      column: "proof_path",
      sql: `ALTER TABLE iuran_tagihan
              ADD COLUMN proof_path VARCHAR(255) NULL
              AFTER payment_method`,
    },
    {
      column: "submitted_at",
      sql: `ALTER TABLE iuran_tagihan
              ADD COLUMN submitted_at TIMESTAMP NULL DEFAULT NULL
              AFTER proof_path`,
    },
    {
      column: "submitted_note",
      sql: `ALTER TABLE iuran_tagihan
              ADD COLUMN submitted_note VARCHAR(255) NULL
              AFTER submitted_at`,
    },
    {
      column: "rejection_reason",
      sql: `ALTER TABLE iuran_tagihan
              ADD COLUMN rejection_reason VARCHAR(255) NULL
              AFTER submitted_note`,
    },
  ];

  for (const migration of migrations) {
    if (!names.has(migration.column)) {
      await connection.query(migration.sql);
      console.log(`Kolom "${migration.column}" ditambahkan ke "iuran_tagihan".`);
    }
  }

  console.log(`Tabel keuangan dan iuran siap di database "${DB_NAME}".`);
} finally {
  await connection.end();
}
