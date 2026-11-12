"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  createWargaAction,
  updateWargaAction,
  type WargaFormState,
} from "@/lib/actions/warga";
import { Icon } from "./icons";
import {
  PressableButton,
  Spinner,
  fadeUp,
  staggerContainer,
} from "./motion";
import {
  EDUCATION_LEVELS,
  FAMILY_RELATIONS,
  FAMILY_RELATION_LABELS,
  GENDERS,
  GENDER_LABELS,
  MARITAL_STATUSES,
  MARITAL_STATUS_LABELS,
  RELIGIONS,
  WARGA_STATUSES,
  WARGA_STATUS_LABELS,
  isFamilyRelation,
  isGender,
  isMaritalStatus,
  isWargaStatus,
  type WargaRecord,
} from "@/lib/warga-types";

type WargaFormAction = (
  state: WargaFormState,
  formData: FormData,
) => Promise<WargaFormState>;

type WargaFormProps = {
  mode: "create" | "edit";
  warga?: WargaRecord;
  cancelHref?: string;
  scope?: {
    rw: string | null;
    rt: string | null;
  };
  actionOverride?: WargaFormAction;
  showStatus?: boolean;
  submitLabel?: string;
};

const initialState: WargaFormState = {};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass =
  "mb-1.5 block text-[13px] font-semibold text-slate-700";
const hintClass = "mt-1 text-[11px] text-slate-400";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </motion.section>
  );
}

export function WargaForm({
  mode,
  warga,
  cancelHref,
  scope,
  actionOverride,
  showStatus = true,
  submitLabel,
}: WargaFormProps) {
  const action =
    actionOverride ??
    (mode === "create" ? createWargaAction : updateWargaAction);
  const [state, formAction, pending] = useActionState(action, initialState);
  const reduce = useReducedMotion();
  const lockedRw = scope?.rw ?? null;
  const lockedRt = scope?.rt ?? null;

  const currentGender =
    warga?.gender && isGender(warga.gender) ? warga.gender : "";
  const currentMarital =
    warga?.marital_status && isMaritalStatus(warga.marital_status)
      ? warga.marital_status
      : "";
  const currentRelation =
    warga?.family_relation && isFamilyRelation(warga.family_relation)
      ? warga.family_relation
      : "";
  const currentStatus =
    warga?.status && isWargaStatus(warga.status) ? warga.status : "aktif";

  const religionOptions: string[] = [...RELIGIONS];
  if (warga?.religion && !religionOptions.includes(warga.religion)) {
    religionOptions.unshift(warga.religion);
  }

  const educationOptions: string[] = [...EDUCATION_LEVELS];
  if (warga?.education && !educationOptions.includes(warga.education)) {
    educationOptions.unshift(warga.education);
  }

  return (
    <motion.form
      action={formAction}
      className="space-y-5"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer(0.06, 0.02)}
    >
      {mode === "edit" && warga && (
        <input type="hidden" name="id" value={warga.id} />
      )}

      <AnimatePresence initial={false}>
        {state.error && (
          <motion.div
            key="error"
            role="alert"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <FormSection
        title="Identitas Warga"
        description="Isi data sesuai KTP dan Kartu Keluarga."
      >
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={100}
            autoComplete="name"
            defaultValue={warga?.name ?? ""}
            placeholder="Contoh: Ahmad Fauzi"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="nik" className={labelClass}>
            NIK <span className="text-rose-500">*</span>
          </label>
          <input
            id="nik"
            name="nik"
            type="text"
            required
            inputMode="numeric"
            pattern="\d{16}"
            maxLength={16}
            defaultValue={warga?.nik ?? ""}
            placeholder="16 angka sesuai KTP"
            className={inputClass}
          />
          <p className={hintClass}>Harus terdiri dari 16 angka.</p>
        </div>

        <div>
          <label htmlFor="kk" className={labelClass}>
            Nomor Kartu Keluarga
          </label>
          <input
            id="kk"
            name="kk"
            type="text"
            inputMode="numeric"
            pattern="\d{16}"
            maxLength={16}
            defaultValue={warga?.kk ?? ""}
            placeholder="Opsional, 16 angka"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="gender" className={labelClass}>
            Jenis Kelamin <span className="text-rose-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            required
            defaultValue={currentGender}
            className={inputClass}
          >
            <option value="" disabled>
              Pilih jenis kelamin
            </option>
            {GENDERS.map((value) => (
              <option key={value} value={value}>
                {GENDER_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="birth_place" className={labelClass}>
            Tempat Lahir <span className="text-rose-500">*</span>
          </label>
          <input
            id="birth_place"
            name="birth_place"
            type="text"
            required
            minLength={3}
            maxLength={100}
            defaultValue={warga?.birth_place ?? ""}
            placeholder="Contoh: Bandung"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="birth_date" className={labelClass}>
            Tanggal Lahir <span className="text-rose-500">*</span>
          </label>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            required
            defaultValue={warga?.birth_date ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="religion" className={labelClass}>
            Agama <span className="text-rose-500">*</span>
          </label>
          <select
            id="religion"
            name="religion"
            required
            defaultValue={warga?.religion ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Pilih agama
            </option>
            {religionOptions.map((religion) => (
              <option key={religion} value={religion}>
                {religion}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="marital_status" className={labelClass}>
            Status Perkawinan <span className="text-rose-500">*</span>
          </label>
          <select
            id="marital_status"
            name="marital_status"
            required
            defaultValue={currentMarital}
            className={inputClass}
          >
            <option value="" disabled>
              Pilih status perkawinan
            </option>
            {MARITAL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {MARITAL_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </FormSection>

      <FormSection
        title="Keluarga & Pekerjaan"
        description="Hubungan dalam keluarga serta latar belakang pendidikan dan pekerjaan."
      >
        <div>
          <label htmlFor="family_relation" className={labelClass}>
            Hubungan Keluarga <span className="text-rose-500">*</span>
          </label>
          <select
            id="family_relation"
            name="family_relation"
            required
            defaultValue={currentRelation}
            className={inputClass}
          >
            <option value="" disabled>
              Pilih hubungan keluarga
            </option>
            {FAMILY_RELATIONS.map((value) => (
              <option key={value} value={value}>
                {FAMILY_RELATION_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="education" className={labelClass}>
            Pendidikan Terakhir
          </label>
          <select
            id="education"
            name="education"
            defaultValue={warga?.education ?? ""}
            className={inputClass}
          >
            <option value="">Tidak diisi</option>
            {educationOptions.map((education) => (
              <option key={education} value={education}>
                {education}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="occupation" className={labelClass}>
            Pekerjaan
          </label>
          <input
            id="occupation"
            name="occupation"
            type="text"
            maxLength={100}
            defaultValue={warga?.occupation ?? ""}
            placeholder="Contoh: Karyawan swasta"
            className={inputClass}
          />
        </div>
      </FormSection>

      <FormSection
        title="Alamat & Kontak"
        description="Alamat domisili, wilayah RT/RW, serta nomor yang dapat dihubungi."
      >
        <div className="sm:col-span-2">
          <label htmlFor="address" className={labelClass}>
            Alamat Lengkap <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            required
            minLength={5}
            maxLength={255}
            rows={3}
            defaultValue={warga?.address ?? ""}
            placeholder="Nama jalan, nomor rumah, kelurahan, kecamatan, kota"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="rt" className={labelClass}>
            RT <span className="text-rose-500">*</span>
          </label>
          <input
            id="rt"
            name="rt"
            type="text"
            required
            inputMode="numeric"
            pattern="\d{1,3}"
            maxLength={3}
            defaultValue={lockedRt ?? warga?.rt ?? ""}
            readOnly={Boolean(lockedRt)}
            aria-readonly={Boolean(lockedRt)}
            placeholder="001"
            className={`${inputClass} ${
              lockedRt
                ? "cursor-not-allowed bg-slate-50 text-slate-500 focus:border-slate-200 focus:ring-0"
                : ""
            }`}
          />
          {lockedRt && (
            <p className={hintClass}>Mengikuti wilayah akun Anda.</p>
          )}
        </div>

        <div>
          <label htmlFor="rw" className={labelClass}>
            RW <span className="text-rose-500">*</span>
          </label>
          <input
            id="rw"
            name="rw"
            type="text"
            required
            inputMode="numeric"
            pattern="\d{1,3}"
            maxLength={3}
            defaultValue={lockedRw ?? warga?.rw ?? ""}
            readOnly={Boolean(lockedRw)}
            aria-readonly={Boolean(lockedRw)}
            placeholder="002"
            className={`${inputClass} ${
              lockedRw
                ? "cursor-not-allowed bg-slate-50 text-slate-500 focus:border-slate-200 focus:ring-0"
                : ""
            }`}
          />
          {lockedRw && (
            <p className={hintClass}>Mengikuti wilayah akun Anda.</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Nomor HP
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={20}
            defaultValue={warga?.phone ?? ""}
            placeholder="08xxxxxxxxxx"
            className={inputClass}
          />
        </div>

        {showStatus && (
          <div>
            <label htmlFor="status" className={labelClass}>
              Status Kependudukan <span className="text-rose-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              required
              defaultValue={currentStatus}
              className={inputClass}
            >
              {WARGA_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {WARGA_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        )}
      </FormSection>

      <motion.div
        variants={fadeUp}
        className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
      >
        {cancelHref && (
          <Link
            href={cancelHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            Batal
          </Link>
        )}
        <PressableButton
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
              Menyimpan...
            </>
          ) : (
            <>
              <Icon name="check" className="h-4 w-4" />
              {submitLabel ??
                (mode === "create" ? "Simpan Data" : "Simpan Perubahan")}
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
