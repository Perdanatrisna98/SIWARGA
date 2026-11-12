# SIWARGA

**SIWARGA — Sistem Informasi Administrasi Warga** adalah aplikasi web untuk
mengelola administrasi warga dengan empat peran pengguna: **Admin**, **RT**,
**RW**, dan **Warga**.

Aplikasi dibangun dengan Next.js 16 (App Router), TypeScript, Tailwind CSS,
MySQL, dan autentikasi berbasis cookie sesi (JWT).

## Fitur

- Login dengan pembagian dashboard sesuai role.
- Register publik yang otomatis membuat akun dengan role **Warga**.
- Proteksi halaman dashboard melalui proxy dan validasi sesi di server.
- Logout yang menghapus sesi dan mengembalikan pengguna ke halaman login.
- Password disimpan sebagai hash bcrypt.
- CRUD data warga (tambah, lihat, cari, filter, edit, hapus) untuk role
  **Admin**, **RT**, dan **RW**.
- Pembatasan data warga berdasarkan wilayah: **RW** hanya melihat RW miliknya,
  **RT** hanya melihat RT/RW miliknya, sedangkan **Admin** melihat semua
  wilayah.
- Manajemen pengguna khusus **Admin**: tambah, edit, hapus akun, serta atur role
  dan wilayah akses RW/RT.
- Profil warga mandiri: akun **Warga** dapat mengisi data kependudukannya sendiri
  satu kali tanpa harus ditambahkan RT lebih dahulu.
- Setelah pengisian pertama, data warga terkunci. Warga dapat mengirim permintaan
  perubahan, lalu **RT/RW** meninjau dan mengedit data tersebut.

## Prasyarat

- Node.js 20 atau lebih baru.
- MySQL dari Laragon yang sedang berjalan (default `127.0.0.1:3306`).

## Menjalankan Aplikasi

```bash
# 1. Install dependency
npm install

# 2. Salin konfigurasi environment
copy .env.example .env.local     # Windows
# cp .env.example .env.local     # macOS/Linux

# 3. Buat database + tabel + akun demo
npm run db:init

# 4. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Sesuaikan `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` pada
`.env.local` bila konfigurasi MySQL Anda berbeda. Ganti juga `AUTH_SECRET`
dengan nilai acak yang panjang sebelum digunakan di production. Jika aplikasi
diakses melalui HTTPS, set `AUTH_COOKIE_SECURE=true`.

## Akun Demo

Dibuat otomatis oleh `npm run db:init`:

| Role  | Email               | Password | Wilayah         |
| ----- | ------------------- | -------- | --------------- |
| Admin | `admin@siwarga.com` | `123456` | Semua wilayah   |
| RT    | `rt@siwarga.com`    | `123456` | RW 001 / RT 001 |
| RW    | `rw@siwarga.com`    | `123456` | RW 001          |

Akun **Warga** dibuat melalui halaman `/register` dan otomatis mendapat role
`warga`. Setelah login, warga melengkapi data kependudukannya melalui menu
**Profil Saya** dan hanya dapat menyimpan sekali. Admin dapat mengubah wilayah
akun RT/RW melalui menu **Manajemen Pengguna**.

## Perintah

| Perintah              | Keterangan                                              |
| --------------------- | ------------------------------------------------------- |
| `npm run dev`         | Menjalankan development server                          |
| `npm run build`       | Membuat production build                                |
| `npm run start`       | Menjalankan hasil production build                      |
| `npm run lint`        | Menjalankan ESLint                                      |
| `npm run db:init`     | Membuat database, tabel `users`/`warga`, dan akun demo  |
| `npm run db:warga`    | Membuat/menyiapkan tabel `warga` + kolom profil mandiri |
| `npm run db:pengguna` | Menambah kolom wilayah `rw`/`rt` pada tabel `users`     |

## Struktur Singkat

```
scripts/init-db.mjs             Inisialisasi database & seed akun
scripts/init-warga.mjs          Membuat tabel warga saja
scripts/init-pengguna.mjs       Migrasi kolom wilayah pada tabel users
scripts/users-region.mjs        Skema users & migrasi wilayah
scripts/warga-table.mjs         Definisi SQL tabel warga
src/app/(auth)/                 Halaman login dan register
src/app/dashboard/              Layout dan dashboard per role
src/app/dashboard/[role]/warga/ Halaman CRUD data warga
src/app/dashboard/[role]/profil/ Halaman profil mandiri warga
src/app/dashboard/[role]/pengguna/ Halaman manajemen pengguna (admin)
src/components/warga-form.tsx   Form tambah/edit data warga
src/components/pengguna-form.tsx Form tambah/edit pengguna
src/lib/actions/auth.ts         Server action login, register, logout
src/lib/actions/warga.ts        Server action CRUD data warga
src/lib/actions/warga-profile.ts Server action profil mandiri warga
src/lib/actions/pengguna.ts     Server action CRUD pengguna
src/lib/warga.ts                Query data warga
src/lib/warga-access.ts         Aturan akses wilayah data warga
src/lib/warga-validation.ts     Validasi input data warga
src/lib/warga-types.ts          Tipe & label data warga
src/lib/pengguna.ts             Query data pengguna
src/lib/pengguna-types.ts       Tipe data pengguna
src/lib/auth.ts                 Helper sesi server (validasi ke database)
src/lib/session.ts              JWT & cookie sesi
src/lib/roles.ts                Definisi role dan konten dashboard
src/proxy.ts                    Proteksi route dashboard
```

## Catatan

Project ini berada pada path yang mengandung karakter `#`. Tailwind CSS v4 dan
Turbopack memiliki masalah kompatibilitas dengan karakter tersebut, sehingga
project menggunakan Tailwind CSS v3 + PostCSS yang stabil pada path ini.

Untuk database yang sudah ada sebelum fitur wilayah, jalankan
`npm run db:pengguna`. Perintah ini menambahkan kolom `rw` dan `rt` tanpa
mengubah password akun demo. Akun RT/RW lama yang belum memiliki wilayah akan
diatur ke **RW 001** (dan **RT 001** untuk akun RT), lalu dapat disesuaikan
Admin melalui menu **Manajemen Pengguna**.

Untuk database yang sudah ada sebelum fitur profil mandiri warga, jalankan
`npm run db:warga`. Perintah ini menambahkan kolom `user_id` dan
`edit_requested_at` pada tabel `warga` tanpa menghapus data warga yang sudah
ada. Setelah itu akun warga dapat mengisi profilnya sekali melalui menu
**Profil Saya**; perubahan berikutnya dilakukan oleh RT/RW sesuai wilayah.
