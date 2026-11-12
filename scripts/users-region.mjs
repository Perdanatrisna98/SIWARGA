export const USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'rt', 'rw', 'warga') NOT NULL DEFAULT 'warga',
    rw VARCHAR(3) NULL,
    rt VARCHAR(3) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_wilayah (rw, rt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

/**
 * Menambahkan kolom wilayah ke tabel users yang sudah ada, lalu memberi
 * wilayah default untuk akun RT/RW lama agar tetap bisa digunakan.
 */
export async function ensureUsersRegion(connection, dbName) {
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [dbName],
  );

  const names = new Set(columns.map((column) => column.COLUMN_NAME));
  let added = false;

  if (!names.has("rw")) {
    await connection.query(
      "ALTER TABLE users ADD COLUMN rw VARCHAR(3) NULL AFTER role",
    );
    added = true;
  }

  if (!names.has("rt")) {
    await connection.query(
      "ALTER TABLE users ADD COLUMN rt VARCHAR(3) NULL AFTER rw",
    );
    added = true;
  }

  // Akun RT/RW yang dibuat sebelum fitur wilayah diaktifkan.
  await connection.execute(
    `UPDATE users
        SET rw = COALESCE(NULLIF(rw, ''), '001'),
            rt = COALESCE(NULLIF(rt, ''), '001')
      WHERE role = 'rt'
        AND (rw IS NULL OR rw = '' OR rt IS NULL OR rt = '')`,
  );

  await connection.execute(
    `UPDATE users
        SET rw = COALESCE(NULLIF(rw, ''), '001')
      WHERE role = 'rw'
        AND (rw IS NULL OR rw = '')`,
  );

  return added;
}
