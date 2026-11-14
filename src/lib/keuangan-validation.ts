import {
  KATEGORI_KEUANGAN_BY_TYPE,
  isKategoriKeuangan,
  isKeuanganType,
  isValidDateString,
  type KeuanganType,
  type KategoriKeuangan,
} from "./keuangan-types";

export type KeuanganInput = {
  type: KeuanganType;
  category: KategoriKeuangan;
  description: string;
  amount: number;
  transaction_date: string;
  rw: string;
  rt: string | null;
};

export type KeuanganParseResult =
  | { data: KeuanganInput }
  | { error: string };

export function normalizeWilayah(
  value: FormDataEntryValue | null,
): string | null {
  const raw = String(value ?? "").trim();

  if (!raw) return null;
  if (!/^\d{1,3}$/.test(raw)) return null;

  return raw.padStart(3, "0");
}

export function parseAmount(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const normalized = raw.includes(",")
    ? raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
    : raw.replace(/\s/g, "");

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (amount > 999_999_999_999.99) return null;

  return Math.round(amount * 100) / 100;
}

export function parseKeuanganForm(formData: FormData): KeuanganParseResult {
  const type = formData.get("type");
  const category = formData.get("category");
  const description = String(formData.get("description") ?? "").trim();
  const transactionDate = String(
    formData.get("transaction_date") ?? "",
  ).trim();
  const amount = parseAmount(formData.get("amount"));
  const rtRaw = String(formData.get("rt") ?? "").trim();
  const rw = normalizeWilayah(formData.get("rw"));
  const rt = normalizeWilayah(formData.get("rt"));

  if (!isKeuanganType(type)) {
    return { error: "Jenis transaksi tidak valid." };
  }

  if (!isKategoriKeuangan(category)) {
    return { error: "Kategori transaksi tidak valid." };
  }

  if (!(KATEGORI_KEUANGAN_BY_TYPE[type] as readonly string[]).includes(category)) {
    return { error: "Kategori tidak sesuai dengan jenis transaksi." };
  }

  if (description.length < 3 || description.length > 255) {
    return { error: "Keterangan harus antara 3 sampai 255 karakter." };
  }

  if (amount === null) {
    return { error: "Nominal harus berupa angka lebih dari nol." };
  }

  if (!isValidDateString(transactionDate)) {
    return { error: "Tanggal transaksi tidak valid." };
  }

  if (!rw) {
    return { error: "RW wajib diisi dengan 1-3 angka." };
  }

  if (rtRaw && !rt) {
    return { error: "RT harus berupa 1-3 angka." };
  }

  return {
    data: {
      type,
      category,
      description,
      amount,
      transaction_date: transactionDate,
      rw,
      rt,
    },
  };
}
