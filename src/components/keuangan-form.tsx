"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  createKeuanganAction,
  updateKeuanganAction,
  type KeuanganFormState,
} from "@/lib/actions/keuangan";
import { Icon } from "./icons";
import {
  PressableButton,
  Spinner,
  fadeUp,
  staggerContainer,
} from "./motion";
import {
  KATEGORI_KEUANGAN_BY_TYPE,
  KEUANGAN_TYPES,
  KEUANGAN_TYPE_LABELS,
  isKategoriKeuangan,
  type KeuanganRecord,
  type KeuanganType,
} from "@/lib/keuangan-types";

type KeuanganFormProps = {
  mode: "create" | "edit";
  record?: KeuanganRecord;
  cancelHref: string;
  scope?: { rw: string | null; rt: string | null };
};

const initialState: KeuanganFormState = {};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-700";
const hintClass = "mt-1 text-[11px] text-slate-400";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function KeuanganForm({
  mode,
  record,
  cancelHref,
  scope,
}: KeuanganFormProps) {
  const action = mode === "create" ? createKeuanganAction : updateKeuanganAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const reduce = useReducedMotion();
  const [type, setType] = useState<KeuanganType>(record?.type ?? "pemasukan");
  const categories = KATEGORI_KEUANGAN_BY_TYPE[type];
  const [category, setCategory] = useState<string>(
    record && isKategoriKeuangan(record.category)
      ? record.category
      : categories[0],
  );

  const lockedRw = scope?.rw ?? null;
  const lockedRt = scope?.rt ?? null;

  function handleTypeChange(next: KeuanganType) {
    setType(next);
    const nextCategories = KATEGORI_KEUANGAN_BY_TYPE[next];

    if (!(nextCategories as readonly string[]).includes(category)) {
      setCategory(nextCategories[0]);
    }
  }

  return (
    <motion.form
      action={formAction}
      className="space-y-5"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer(0.06, 0.02)}
    >
      {mode === "edit" && record && (
        <input type="hidden" name="id" value={record.id} />
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
            Detail Transaksi Kas
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Catat pemasukan atau pengeluaran kas sesuai bukti yang sah.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className={labelClass}>
              Jenis Transaksi <span className="text-rose-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              value={type}
              onChange={(event) =>
                handleTypeChange(event.target.value as KeuanganType)
              }
              className={inputClass}
            >
              {KEUANGAN_TYPES.map((value) => (
                <option key={value} value={value}>
                  {KEUANGAN_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Kategori <span className="text-rose-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClass}
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className={labelClass}>
              Nominal <span className="text-rose-500">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              min="1"
              step="0.01"
              inputMode="decimal"
              defaultValue={record?.amount ?? ""}
              placeholder="Contoh: 150000"
              className={inputClass}
            />
            <p className={hintClass}>Masukkan angka tanpa titik pemisah.</p>
          </div>

          <div>
            <label htmlFor="transaction_date" className={labelClass}>
              Tanggal Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              id="transaction_date"
              name="transaction_date"
              type="date"
              required
              defaultValue={record?.transaction_date ?? todayString()}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              Keterangan <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={3}
              maxLength={255}
              rows={3}
              defaultValue={record?.description ?? ""}
              placeholder="Contoh: Iuran kebersihan bulan November"
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Wilayah Kas</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tentukan cakupan wilayah pencatatan transaksi.
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
              defaultValue={lockedRw ?? record?.rw ?? ""}
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
              defaultValue={lockedRt ?? record?.rt ?? ""}
              readOnly={Boolean(lockedRt)}
              aria-readonly={Boolean(lockedRt)}
              placeholder="001 (opsional untuk kas RW)"
              className={`${inputClass} ${
                lockedRt
                  ? "cursor-not-allowed bg-slate-50 text-slate-500 focus:border-slate-200 focus:ring-0"
                  : ""
              }`}
            />
            {lockedRt ? (
              <p className={hintClass}>Mengikuti wilayah akun.</p>
            ) : (
              <p className={hintClass}>Kosongkan untuk kas tingkat RW.</p>
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
              {mode === "create" ? "Simpan Transaksi" : "Simpan Perubahan"}
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
