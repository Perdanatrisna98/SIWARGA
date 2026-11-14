"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  generateTagihanAction,
  type GenerateTagihanState,
} from "@/lib/actions/iuran";
import { Icon } from "./icons";
import {
  PressableButton,
  Spinner,
  fadeUp,
  staggerContainer,
} from "./motion";
import {
  currentPeriode,
  formatPeriode,
  formatRupiah,
  type IuranPeriod,
} from "@/lib/iuran-types";

type JenisOption = {
  id: number;
  name: string;
  amount: number;
  period: IuranPeriod;
  rw: string;
  rt: string | null;
};

type GenerateTagihanFormProps = {
  options: JenisOption[];
  counts: Record<number, number>;
  cancelHref: string;
  jenisHref: string;
  defaultDueDate: string;
};

const initialState: GenerateTagihanState = {};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-700";
const hintClass = "mt-1 text-[11px] text-slate-400";

export function GenerateTagihanForm({
  options,
  counts,
  cancelHref,
  jenisHref,
  defaultDueDate,
}: GenerateTagihanFormProps) {
  const [state, formAction, pending] = useActionState(
    generateTagihanAction,
    initialState,
  );
  const reduce = useReducedMotion();
  const [jenisId, setJenisId] = useState(options[0]?.id ?? 0);
  const selected = useMemo(
    () => options.find((option) => option.id === jenisId) ?? null,
    [options, jenisId],
  );
  const [periode, setPeriode] = useState(
    selected ? currentPeriode(selected.period) : "",
  );

  function handleJenisChange(nextId: number) {
    setJenisId(nextId);
    const next = options.find((option) => option.id === nextId);
    setPeriode(next ? currentPeriode(next.period) : "");
  }

  if (options.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="font-semibold">Belum ada jenis iuran aktif.</p>
        <p className="mt-1 leading-relaxed">
          Tambahkan jenis iuran terlebih dahulu sebelum membuat tagihan warga.
        </p>
        <Link
          href={jenisHref}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
          Kelola Jenis Iuran
        </Link>
      </div>
    );
  }

  return (
    <motion.form
      action={formAction}
      className="space-y-5"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer(0.06, 0.02)}
    >
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
          <h2 className="text-sm font-semibold text-slate-900">Buat Tagihan</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tagihan dibuat otomatis untuk semua warga aktif pada cakupan
            wilayah jenis iuran yang dipilih.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="jenis_id" className={labelClass}>
              Jenis Iuran <span className="text-rose-500">*</span>
            </label>
            <select
              id="jenis_id"
              name="jenis_id"
              required
              value={jenisId}
              onChange={(event) => handleJenisChange(Number(event.target.value))}
              className={inputClass}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} — {formatRupiah(option.amount)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="periode" className={labelClass}>
              Periode <span className="text-rose-500">*</span>
            </label>
            <input
              id="periode"
              name="periode"
              type={selected?.period === "sekali" ? "number" : "month"}
              required
              min={selected?.period === "sekali" ? "2000" : undefined}
              max={selected?.period === "sekali" ? "2100" : undefined}
              value={periode}
              onChange={(event) => setPeriode(event.target.value)}
              placeholder={selected?.period === "sekali" ? "2026" : undefined}
              className={inputClass}
            />
            <p className={hintClass}>
              {selected?.period === "sekali"
                ? "Isi tahun tagihan, contoh 2026."
                : `Tagihan untuk ${formatPeriode(periode)}.`}
            </p>
          </div>

          <div>
            <label htmlFor="due_date" className={labelClass}>
              Jatuh Tempo <span className="text-rose-500">*</span>
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              required
              defaultValue={defaultDueDate}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="note" className={labelClass}>
              Catatan
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              maxLength={255}
              placeholder="Opsional, misalnya: dibayar paling lambat akhir bulan"
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        {selected && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-blue-800">
                {selected.name}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-blue-700 ring-1 ring-blue-200">
                {counts[selected.id] ?? 0} warga aktif
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-blue-700">
              Total potensi tagihan:{" "}
              <span className="font-semibold">
                {formatRupiah(selected.amount * (counts[selected.id] ?? 0))}
              </span>
              . Tagihan yang sudah pernah dibuat untuk periode yang sama akan
              dilewati.
            </p>
          </div>
        )}
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
              Membuat tagihan...
            </>
          ) : (
            <>
              <Icon name="receipt" className="h-4 w-4" />
              Buat Tagihan
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
