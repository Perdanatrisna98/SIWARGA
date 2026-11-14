export const KEUANGAN_TYPES = ["pemasukan", "pengeluaran"] as const;
export type KeuanganType = (typeof KEUANGAN_TYPES)[number];

export const KEUANGAN_TYPE_LABELS: Record<KeuanganType, string> = {
  pemasukan: "Pemasukan",
  pengeluaran: "Pengeluaran",
};

export const KATEGORI_KEUANGAN = [
  "Iuran",
  "Donasi",
  "Bantuan",
  "Usaha",
  "Operasional",
  "Pembangunan",
  "Sosial",
  "Lainnya",
] as const;
export type KategoriKeuangan = (typeof KATEGORI_KEUANGAN)[number];

export const KATEGORI_KEUANGAN_BY_TYPE: Record<
  KeuanganType,
  readonly KategoriKeuangan[]
> = {
  pemasukan: ["Iuran", "Donasi", "Bantuan", "Usaha", "Lainnya"],
  pengeluaran: [
    "Operasional",
    "Pembangunan",
    "Sosial",
    "Lainnya",
  ],
};

export type KeuanganRecord = {
  id: number;
  type: KeuanganType;
  category: KategoriKeuangan;
  description: string;
  amount: number;
  transaction_date: string;
  rw: string;
  rt: string | null;
  created_by: number | null;
  created_by_name?: string | null;
};

export type KeuanganStats = {
  balance: number;
  income: number;
  expense: number;
  count: number;
};

export function isKeuanganType(value: unknown): value is KeuanganType {
  return (
    typeof value === "string" &&
    (KEUANGAN_TYPES as readonly string[]).includes(value)
  );
}

export function isKategoriKeuangan(
  value: unknown,
): value is KategoriKeuangan {
  return (
    typeof value === "string" &&
    (KATEGORI_KEUANGAN as readonly string[]).includes(value)
  );
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKeuanganDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
