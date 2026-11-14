import {
  isIuranPeriod,
  isValidPeriode,
  type IuranPeriod,
} from "./iuran-types";
import { isValidDateString } from "./keuangan-types";
import { normalizeWilayah, parseAmount } from "./keuangan-validation";

export type IuranJenisInput = {
  name: string;
  amount: number;
  period: IuranPeriod;
  active: boolean;
  rw: string;
  rt: string | null;
};

export type IuranJenisParseResult =
  | { data: IuranJenisInput }
  | { error: string };

export function parseIuranJenisForm(
  formData: FormData,
): IuranJenisParseResult {
  const name = String(formData.get("name") ?? "").trim();
  const period = formData.get("period");
  const amount = parseAmount(formData.get("amount"));
  const rtRaw = String(formData.get("rt") ?? "").trim();
  const rw = normalizeWilayah(formData.get("rw"));
  const rt = normalizeWilayah(formData.get("rt"));
  const active = formData.get("active") === "on" || formData.get("active") === "1";

  if (name.length < 3 || name.length > 100) {
    return { error: "Nama iuran harus antara 3 sampai 100 karakter." };
  }

  if (!isIuranPeriod(period)) {
    return { error: "Periode iuran tidak valid." };
  }

  if (amount === null) {
    return { error: "Nominal iuran harus berupa angka lebih dari nol." };
  }

  if (!rw) {
    return { error: "RW wajib diisi dengan 1-3 angka." };
  }

  if (rtRaw && !rt) {
    return { error: "RT harus berupa 1-3 angka." };
  }

  return {
    data: { name, amount, period, active, rw, rt },
  };
}

export type GenerateTagihanInput = {
  jenisId: number;
  periode: string;
  dueDate: string;
  note: string | null;
};

export type GenerateTagihanParseResult =
  | { data: GenerateTagihanInput }
  | { error: string };

export function parseGenerateTagihanForm(
  formData: FormData,
  period: IuranPeriod,
): GenerateTagihanParseResult {
  const jenisId = Number(formData.get("jenis_id"));
  const periode = String(formData.get("periode") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const noteRaw = String(formData.get("note") ?? "").trim();
  const note = noteRaw ? noteRaw.slice(0, 255) : null;

  if (!Number.isInteger(jenisId) || jenisId <= 0) {
    return { error: "Jenis iuran tidak valid." };
  }

  if (!isValidPeriode(periode, period)) {
    return {
      error:
        period === "bulanan"
          ? "Periode bulanan harus dalam format YYYY-MM."
          : "Periode sekali harus berupa tahun (YYYY).",
    };
  }

  if (!isValidDateString(dueDate)) {
    return { error: "Tanggal jatuh tempo tidak valid." };
  }

  return { data: { jenisId, periode, dueDate, note } };
}
