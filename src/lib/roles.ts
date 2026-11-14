import type { IconName } from "@/components/icons";

export const ROLES = ["admin", "rt", "rw", "warga"] as const;

export type Role = (typeof ROLES)[number];

export type RoleMeta = {
  label: string;
  shortLabel: string;
  description: string;
  greeting: string;
  gradient: string;
  chip: string;
  soft: string;
  icon: IconName;
  modules: {
    title: string;
    short: string;
    description: string;
    icon: IconName;
    href?: string;
  }[];
};

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: {
    label: "Administrator",
    shortLabel: "Admin",
    description:
      "Kelola pengguna, data warga, dan seluruh layanan administrasi SIWARGA dari satu tempat.",
    greeting: "Pusat kendali sistem",
    gradient: "from-indigo-500 via-indigo-600 to-violet-700",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    soft: "bg-indigo-50 text-indigo-600",
    icon: "shield",
    modules: [
      {
        title: "Manajemen Pengguna",
        short: "Pengguna",
        description: "Kelola akun admin, RT, RW, dan warga.",
        icon: "users",
        href: "/dashboard/admin/pengguna",
      },
      {
        title: "Data Warga",
        short: "Warga",
        description: "Pusat data kependudukan seluruh wilayah.",
        icon: "home",
        href: "/dashboard/admin/warga",
      },
      {
        title: "Keuangan & Iuran",
        short: "Keuangan",
        description: "Catat kas, buat tagihan iuran, dan verifikasi bayar.",
        icon: "wallet",
        href: "/dashboard/admin/keuangan",
      },
      {
        title: "Layanan Administrasi",
        short: "Layanan",
        description: "Pantau seluruh pengajuan surat dan layanan.",
        icon: "file",
      },
    ],
  },
  rt: {
    label: "Pengurus RT",
    shortLabel: "RT",
    description:
      "Verifikasi data dan layanan warga di tingkat Rukun Tetangga dengan cepat dan tertata.",
    greeting: "Kelola wilayah RT Anda",
    gradient: "from-sky-500 via-sky-600 to-blue-700",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    soft: "bg-sky-50 text-sky-600",
    icon: "home",
    modules: [
      {
        title: "Data Warga RT",
        short: "Warga",
        description: "Kelola data warga di lingkungan RT.",
        icon: "users",
        href: "/dashboard/rt/warga",
      },
      {
        title: "Keuangan & Iuran",
        short: "Keuangan",
        description: "Catat kas RT, tagih iuran, dan verifikasi pembayaran.",
        icon: "wallet",
        href: "/dashboard/rt/keuangan",
      },
      {
        title: "Verifikasi Pengajuan",
        short: "Verifikasi",
        description: "Periksa pengajuan surat dari warga.",
        icon: "file",
      },
      {
        title: "Pengumuman RT",
        short: "Pengumuman",
        description: "Sebarkan informasi untuk warga RT.",
        icon: "megaphone",
      },
    ],
  },
  rw: {
    label: "Pengurus RW",
    shortLabel: "RW",
    description:
      "Pantau dan koordinasikan administrasi warga di tingkat Rukun Warga secara menyeluruh.",
    greeting: "Koordinasikan wilayah RW",
    gradient: "from-emerald-500 via-emerald-600 to-teal-700",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    soft: "bg-emerald-50 text-emerald-600",
    icon: "building",
    modules: [
      {
        title: "Data Warga RW",
        short: "Warga",
        description: "Pantau data warga lintas RT di wilayah RW.",
        icon: "users",
        href: "/dashboard/rw/warga",
      },
      {
        title: "Keuangan & Iuran",
        short: "Keuangan",
        description: "Kelola kas RW, tagihan iuran, dan verifikasi bayar.",
        icon: "wallet",
        href: "/dashboard/rw/keuangan",
      },
      {
        title: "Persetujuan Layanan",
        short: "Setujui",
        description: "Tinjau layanan yang telah diverifikasi RT.",
        icon: "shield",
      },
      {
        title: "Pengumuman RW",
        short: "Pengumuman",
        description: "Publikasikan informasi tingkat RW.",
        icon: "megaphone",
      },
    ],
  },
  warga: {
    label: "Warga",
    shortLabel: "Warga",
    description:
      "Akses layanan administrasi dan informasi lingkungan Anda dengan mudah lewat SIWARGA.",
    greeting: "Selamat datang di lingkungan Anda",
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    soft: "bg-amber-50 text-amber-600",
    icon: "user",
    modules: [
      {
        title: "Profil Saya",
        short: "Profil",
        description: "Lengkapi data diri dan kependudukan Anda.",
        icon: "user",
        href: "/dashboard/warga/profil",
      },
      {
        title: "Iuran Saya",
        short: "Iuran",
        description: "Pantau tagihan dan kuitansi iuran lingkungan.",
        icon: "receipt",
        href: "/dashboard/warga/iuran",
      },
      {
        title: "Ajukan Layanan",
        short: "Layanan",
        description: "Ajukan surat dan layanan administrasi.",
        icon: "file",
      },
      {
        title: "Pengumuman",
        short: "Pengumuman",
        description: "Baca informasi terbaru dari pengurus.",
        icon: "megaphone",
      },
    ],
  },
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase();
  return isRole(normalized) ? normalized : null;
}

export function getRoleMeta(role: Role): RoleMeta {
  return ROLE_META[role];
}
