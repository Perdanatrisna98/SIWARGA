export const IURAN_PERIODS = ["bulanan", "sekali"] as const;
export type IuranPeriod = (typeof IURAN_PERIODS)[number];

export const IURAN_PERIOD_LABELS: Record<IuranPeriod, string> = {
  bulanan: "Bulanan",
  sekali: "Sekali",
};

export const IURAN_STATUSES = ["belum", "menunggu", "lunas"] as const;
export type IuranStatus = (typeof IURAN_STATUSES)[number];

export const IURAN_STATUS_LABELS: Record<IuranStatus, string> = {
  belum: "Belum dibayar",
  menunggu: "Menunggu verifikasi",
  lunas: "Lunas",
};

export const IURAN_PAYMENT_METHODS = ["cash", "transfer", "qris"] as const;
export type IuranPaymentMethod = (typeof IURAN_PAYMENT_METHODS)[number];

export const IURAN_PAYMENT_METHOD_LABELS: Record<IuranPaymentMethod, string> = {
  cash: "Tunai (ke RT/RW)",
  transfer: "Transfer Bank",
  qris: "QRIS",
};

export type IuranJenisRecord = {
  id: number;
  name: string;
  amount: number;
  period: IuranPeriod;
  rw: string;
  rt: string | null;
  active: boolean;
  created_by: number | null;
};

export type IuranTagihanRecord = {
  id: number;
  jenis_id: number;
  warga_id: number;
  jenis_name: string;
  jenis_period: IuranPeriod;
  warga_name: string;
  warga_nik: string;
  periode: string;
  amount: number;
  due_date: string;
  status: IuranStatus;
  payment_method: IuranPaymentMethod | null;
  proof_path: string | null;
  submitted_at: string | null;
  submitted_note: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  paid_by: number | null;
  paid_by_name?: string | null;
  transaksi_id: number | null;
  note: string | null;
  rw: string;
  rt: string;
  created_by: number | null;
};

export type WargaOption = {
  id: number;
  name: string;
  nik: string;
  kk: string | null;
  rt: string;
  rw: string;
};

export type IuranStats = {
  total: number;
  paid: number;
  pending: number;
  unpaid: number;
  overdue: number;
  paidAmount: number;
  unpaidAmount: number;
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function isIuranPeriod(value: unknown): value is IuranPeriod {
  return (
    typeof value === "string" &&
    (IURAN_PERIODS as readonly string[]).includes(value)
  );
}

export function isIuranStatus(value: unknown): value is IuranStatus {
  return (
    typeof value === "string" &&
    (IURAN_STATUSES as readonly string[]).includes(value)
  );
}

export function isIuranPaymentMethod(
  value: unknown,
): value is IuranPaymentMethod {
  return (
    typeof value === "string" &&
    (IURAN_PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

export function isValidPeriode(value: string, period: IuranPeriod): boolean {
  if (period === "bulanan") {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }

  return /^\d{4}$/.test(value);
}

export function formatPeriode(value: string): string {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    const [year, month] = value.split("-");
    return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
  }

  return value;
}

export function currentPeriode(period: IuranPeriod): string {
  const now = new Date();
  const year = String(now.getFullYear());

  if (period === "sekali") return year;

  return `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function makeIuranReceiptNumber(
  id: number,
  paidAt?: string | null,
): string {
  const year = paidAt?.slice(0, 4) || String(new Date().getFullYear());
  return `INV/IURAN/${year}/${String(id).padStart(4, "0")}`;
}

export function makeKeuanganReceiptNumber(
  id: number,
  date?: string | null,
): string {
  const year = date?.slice(0, 4) || String(new Date().getFullYear());
  return `KW/KAS/${year}/${String(id).padStart(4, "0")}`;
}

export function formatIuranDate(value: string | null): string {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatIuranDateTime(value: string | null): string {
  if (!value) return "-";

  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function isOverdue(
  dueDate: string,
  status: IuranStatus,
): boolean {
  if (status !== "belum") return false;

  const today = new Date();
  const todayIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return dueDate < todayIso;
}

export { formatRupiah } from "./keuangan-types";
