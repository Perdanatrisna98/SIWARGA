import {
  isFamilyRelation,
  isGender,
  isMaritalStatus,
  isWargaStatus,
  type WargaInput,
} from "./warga-types";

const NIK_PATTERN = /^\d{16}$/;
const RT_RW_PATTERN = /^\d{1,3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_PATTERN = /^[0-9+\-\s().]{8,20}$/;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

export function parseWargaForm(
  formData: FormData,
): { data: WargaInput } | { error: string } {
  const name = text(formData, "name").replace(/\s+/g, " ");
  const nik = text(formData, "nik");
  const kk = optionalText(formData, "kk");
  const gender = text(formData, "gender");
  const birthPlace = text(formData, "birth_place").replace(/\s+/g, " ");
  const birthDate = text(formData, "birth_date");
  const religion = text(formData, "religion");
  const maritalStatus = text(formData, "marital_status");
  const education = optionalText(formData, "education");
  const occupation = optionalText(formData, "occupation");
  const familyRelation = text(formData, "family_relation");
  const phone = optionalText(formData, "phone");
  const address = text(formData, "address").replace(/\s+/g, " ");
  const rt = text(formData, "rt");
  const rw = text(formData, "rw");
  const status = text(formData, "status");

  if (name.length < 3) {
    return { error: "Nama lengkap minimal 3 karakter." };
  }

  if (name.length > 100) {
    return { error: "Nama lengkap maksimal 100 karakter." };
  }

  if (!NIK_PATTERN.test(nik)) {
    return { error: "NIK harus terdiri dari 16 angka." };
  }

  if (kk && !NIK_PATTERN.test(kk)) {
    return { error: "Nomor KK harus terdiri dari 16 angka." };
  }

  if (!isGender(gender)) {
    return { error: "Jenis kelamin wajib dipilih." };
  }

  if (birthPlace.length < 3) {
    return { error: "Tempat lahir minimal 3 karakter." };
  }

  if (birthPlace.length > 100) {
    return { error: "Tempat lahir maksimal 100 karakter." };
  }

  if (!DATE_PATTERN.test(birthDate)) {
    return { error: "Tanggal lahir wajib diisi dengan format yang valid." };
  }

  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const parsedBirthDate = new Date(
    Date.UTC(birthYear, birthMonth - 1, birthDay),
  );

  if (
    Number.isNaN(parsedBirthDate.getTime()) ||
    parsedBirthDate.getUTCFullYear() !== birthYear ||
    parsedBirthDate.getUTCMonth() !== birthMonth - 1 ||
    parsedBirthDate.getUTCDate() !== birthDay
  ) {
    return { error: "Tanggal lahir tidak valid." };
  }

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  if (parsedBirthDate > endOfToday) {
    return { error: "Tanggal lahir tidak boleh melebihi hari ini." };
  }

  if (!religion) {
    return { error: "Agama wajib dipilih." };
  }

  if (religion.length > 30) {
    return { error: "Agama maksimal 30 karakter." };
  }

  if (!isMaritalStatus(maritalStatus)) {
    return { error: "Status perkawinan wajib dipilih." };
  }

  if (education && education.length > 50) {
    return { error: "Pendidikan maksimal 50 karakter." };
  }

  if (occupation && occupation.length > 100) {
    return { error: "Pekerjaan maksimal 100 karakter." };
  }

  if (!isFamilyRelation(familyRelation)) {
    return { error: "Hubungan keluarga wajib dipilih." };
  }

  if (phone && !PHONE_PATTERN.test(phone)) {
    return { error: "Nomor HP tidak valid (8-20 karakter angka/simbol + -)." };
  }

  if (address.length < 5) {
    return { error: "Alamat minimal 5 karakter." };
  }

  if (address.length > 255) {
    return { error: "Alamat maksimal 255 karakter." };
  }

  if (!RT_RW_PATTERN.test(rt)) {
    return { error: "RT harus berupa 1-3 angka." };
  }

  if (!RT_RW_PATTERN.test(rw)) {
    return { error: "RW harus berupa 1-3 angka." };
  }

  if (!isWargaStatus(status)) {
    return { error: "Status kependudukan wajib dipilih." };
  }

  return {
    data: {
      nik,
      kk,
      name,
      gender,
      birth_place: birthPlace,
      birth_date: birthDate,
      religion,
      marital_status: maritalStatus,
      education,
      occupation,
      family_relation: familyRelation,
      phone,
      address,
      rt: rt.padStart(3, "0"),
      rw: rw.padStart(3, "0"),
      status,
    },
  };
}
