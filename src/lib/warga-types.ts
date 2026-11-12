export const GENDERS = ["L", "P"] as const;
export type Gender = (typeof GENDERS)[number];

export const MARITAL_STATUSES = [
  "belum-menikah",
  "menikah",
  "cerai-hidup",
  "cerai-mati",
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const FAMILY_RELATIONS = [
  "kepala-keluarga",
  "istri",
  "anak",
  "lainnya",
] as const;
export type FamilyRelation = (typeof FAMILY_RELATIONS)[number];

export const WARGA_STATUSES = ["aktif", "pindah", "meninggal"] as const;
export type WargaStatus = (typeof WARGA_STATUSES)[number];

export const RELIGIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
] as const;

export const EDUCATION_LEVELS = [
  "Tidak/Belum Sekolah",
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/SMK/Sederajat",
  "D3",
  "S1",
  "S2",
  "S3",
] as const;

export const GENDER_LABELS: Record<Gender, string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  "belum-menikah": "Belum Menikah",
  menikah: "Menikah",
  "cerai-hidup": "Cerai Hidup",
  "cerai-mati": "Cerai Mati",
};

export const FAMILY_RELATION_LABELS: Record<FamilyRelation, string> = {
  "kepala-keluarga": "Kepala Keluarga",
  istri: "Istri",
  anak: "Anak",
  lainnya: "Lainnya",
};

export const WARGA_STATUS_LABELS: Record<WargaStatus, string> = {
  aktif: "Aktif",
  pindah: "Pindah",
  meninggal: "Meninggal",
};

export type WargaRecord = {
  id: number;
  nik: string;
  kk: string | null;
  name: string;
  gender: Gender;
  birth_place: string;
  birth_date: string;
  religion: string;
  marital_status: MaritalStatus;
  education: string | null;
  occupation: string | null;
  family_relation: FamilyRelation;
  phone: string | null;
  address: string;
  rt: string;
  rw: string;
  status: WargaStatus;
  user_id: number | null;
  edit_requested_at: string | null;
};

export type WargaInput = Omit<
  WargaRecord,
  "id" | "user_id" | "edit_requested_at"
>;

export type WargaStats = {
  total: number;
  male: number;
  female: number;
  households: number;
};

export function isGender(value: string): value is Gender {
  return (GENDERS as readonly string[]).includes(value);
}

export function isMaritalStatus(value: string): value is MaritalStatus {
  return (MARITAL_STATUSES as readonly string[]).includes(value);
}

export function isFamilyRelation(value: string): value is FamilyRelation {
  return (FAMILY_RELATIONS as readonly string[]).includes(value);
}

export function isWargaStatus(value: string): value is WargaStatus {
  return (WARGA_STATUSES as readonly string[]).includes(value);
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
}

export function formatWargaDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}
