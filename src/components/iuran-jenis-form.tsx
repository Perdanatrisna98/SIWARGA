"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  createIuranJenisAction,
  updateIuranJenisAction,
  type IuranJenisFormState,
} from "@/lib/actions/iuran";
import { Icon } from "./icons";
import {
  PressableButton,
  Spinner,
  fadeUp,
  staggerContainer,
} from "./motion";
import {
  IURAN_PERIODS,
  IURAN_PERIOD_LABELS,
  type IuranJenisRecord,
} from "@/lib/iuran-types";

type IuranJenisFormProps = {
  mode: "create" | "edit";
  jenis?: IuranJenisRecord;
  cancelHref: string;
  scope?: { rw: string | null; rt: string | null };
};

const initialState: IuranJenisFormState = {};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-700";
const hintClass = "mt-1 text-[11px] text-slate-400";

export function IuranJenisForm({
  mode,
  jenis,
  cancelHref,
  scope,
}: IuranJenisFormProps) {
  const action =
    mode === "create" ? createIuranJenisAction : updateIuranJenisAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const reduce = useReducedMotion();
  const lockedRw = scope?.rw ?? null;
  const lockedRt = scope?.rt ?? null;

  return (
    <motion.form
      action={formAction}
      className="space-y-5"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer(0.06, 0.02)}
    >
      {mode === "edit" && jenis && (
        <input type="hidden" name="id" value={jenis.id} />
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

      <motion.section
        variants={fadeUp}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Informasi Jenis Iuran
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Jenis iuran menjadi acuan nominal saat membuat tagihan warga.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>
              Nama Iuran <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={100}
              defaultValue={jenis?.name ?? ""}
              placeholder="Contoh: Iuran Kebersihan"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="amount" className={labelClass}>
              Nominal per Warga <span className="text-rose-500">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              min="1"
              step="0.01"
              inputMode="decimal"
              defaultValue={jenis?.amount ?? ""}
              placeholder="Contoh: 50000"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="period" className={labelClass}>
              Periode <span className="text-rose-500">*</span>
            </label>
            <select
              id="period"
              name="period"
              required
              defaultValue={jenis?.period ?? "bulanan"}
              className={inputClass}
            >
              {IURAN_PERIODS.map((value) => (
                <option key={value} value={value}>
                  {IURAN_PERIOD_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <input
              id="active"
              name="active"
              type="checkbox"
              defaultChecked={jenis?.active ?? true}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label
                htmlFor="active"
                className="text-[13px] font-semibold text-slate-700"
              >
                Iuran aktif
              </label>
              <p className={hintClass}>
                Hanya jenis iuran aktif yang dapat dipakai untuk membuat tagihan.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Cakupan Wilayah</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tagihan hanya dibuat untuk warga aktif pada wilayah ini.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              defaultValue={lockedRw ?? jenis?.rw ?? ""}
              readOnly={Boolean(lockedRw)}
              aria-readonly={Boolean(lockedRw)}
              placeholder="002"
              className={`${inputClass} ${
                lockedRw
                  ? "cursor-not-allowed bg-slate-50 text-slate-500 focus:border-slate-200 focus:ring-0"
                  : ""
              }`}
            />
            {lockedRw && <p className={hintClass}>Mengikuti wilayah akun.</p>}
          </div>

          <div>
            <label htmlFor="rt" className={labelClass}>
              RT
            </label>
            <input
              id="rt"
              name="rt"
              type="text"
              inputMode="numeric"
              pattern="\d{1,3}"
              maxLength={3}
              defaultValue={lockedRt ?? jenis?.rt ?? ""}
              readOnly={Boolean(lockedRt)}
              aria-readonly={Boolean(lockedRt)}
              placeholder="001 (opsional untuk RW)"
              className={`${inputClass} ${
                lockedRt
                  ? "cursor-not-allowed bg-slate-50 text-slate-500 focus:border-slate-200 focus:ring-0"
                  : ""
              }`}
            />
            {lockedRt ? (
              <p className={hintClass}>Mengikuti wilayah akun.</p>
            ) : (
              <p className={hintClass}>Kosongkan untuk cakupan seluruh RW.</p>
            )}
          </div>
        </div>
      </motion.section>

      <motion.div
        variants={fadeUp}
        className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
      >
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
        >
          Batal
        </Link>
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
              {mode === "create" ? "Simpan Jenis Iuran" : "Simpan Perubahan"}
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
