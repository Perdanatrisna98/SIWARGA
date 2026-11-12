import type { Role } from "./roles";

export type PenggunaRecord = {
  id: number;
  name: string;
  email: string;
  role: Role;
  rw: string | null;
  rt: string | null;
  created_at: string;
};

export type PenggunaStats = {
  total: number;
  admin: number;
  rt: number;
  rw: number;
  warga: number;
};

export function formatPenggunaWilayah(
  role: Role,
  rw: string | null,
  rt: string | null,
): string {
  if (role === "admin") return "Semua wilayah";

  const parts = [
    rw ? `RW ${rw.padStart(3, "0")}` : null,
    rt ? `RT ${rt.padStart(3, "0")}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Belum diatur";
}

export function formatPenggunaDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
