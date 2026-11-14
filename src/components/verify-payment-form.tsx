"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  verifyPaymentAction,
  type VerifyPaymentState,
} from "@/lib/actions/iuran";
import {
  IURAN_PAYMENT_METHODS,
  IURAN_PAYMENT_METHOD_LABELS,
  formatIuranDateTime,
  formatPeriode,
  formatRupiah,
  type IuranPaymentMethod,
  type IuranTagihanRecord,
} from "@/lib/iuran-types";
import { Icon } from "./icons";
import { PressableButton, Spinner, fadeUp, staggerContainer } from "./motion";

type VerifyPaymentFormProps = {
  tagihan: IuranTagihanRecord;
  cancelHref: string;
};

const initialState: VerifyPaymentState = {};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-700";

export function VerifyPaymentForm({
  tagihan,
  cancelHref,
}: VerifyPaymentFormProps) {
  const [state, formAction, pending] = useActionState(
    verifyPaymentAction,
    initialState,
  );
  const [method, setMethod] = useState<IuranPaymentMethod>(
    tagihan.payment_method ?? "cash",
  );
  const [proofName, setProofName] = useState("");
  const reduce = useReducedMotion();
  const existingProof = tagihan.proof_path;
  const isImage =
    existingProof !== null && /\.(jpe?g|png|webp)$/i.test(existingProof);

  return (
    <motion.form
      action={formAction}
      className="space-y-5"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer(0.06, 0.02)}
    >
      <input type="hidden" name="id" value={tagihan.id} />

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
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Tagihan
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {tagihan.jenis_name} — {formatPeriode(tagihan.periode)}
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
            {formatRupiah(tagihan.amount)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {tagihan.warga_name} • RW {tagihan.rw} / RT {tagihan.rt}
          </p>
        </div>

        {tagihan.status === "menunggu" && (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-800">
            <p className="font-semibold">Pengajuan pembayaran warga</p>
            <p className="mt-1">
              Metode:{" "}
              {tagihan.payment_method
                ? IURAN_PAYMENT_METHOD_LABELS[tagihan.payment_method]
                : "-"}
              {tagihan.submitted_at
                ? ` • ${formatIuranDateTime(tagihan.submitted_at)}`
                : ""}
            </p>
            {tagihan.submitted_note && (
              <p className="mt-1">Catatan: {tagihan.submitted_note}</p>
            )}
          </div>
        )}

        <div className="mt-4">
          <p className={labelClass}>Metode Pembayaran</p>
          <select
            name="method"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as IuranPaymentMethod)
            }
            className={inputClass}
          >
            {IURAN_PAYMENT_METHODS.map((value) => (
              <option key={value} value={value}>
                {IURAN_PAYMENT_METHOD_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">
            Untuk pembayaran tunai, pilih tunai lalu unggah foto tanda terima.
          </p>
        </div>

        {existingProof && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Bukti dari warga
            </p>
            {isImage ? (
              <a
                href={existingProof}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={existingProof}
                  alt="Bukti pembayaran warga"
                  className="max-h-56 w-full object-contain"
                />
              </a>
            ) : (
              <a
                href={existingProof}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                <Icon name="file" className="h-4 w-4" />
                Lihat bukti pembayaran
              </a>
            )}
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="proof" className={labelClass}>
            Unggah Bukti{" "}
            <span className="font-normal text-slate-400">
              {existingProof ? "(opsional, mengganti bukti lama)" : "*"}
            </span>
          </label>
          <label
            htmlFor="proof"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
              <Icon name="upload" className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {proofName || "Pilih file bukti"}
            </span>
            <span className="text-[11px] text-slate-400">
              JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.
            </span>
          </label>
          <input
            id="proof"
            name="proof"
            type="file"
            required={!existingProof}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) =>
              setProofName(event.target.files?.[0]?.name ?? "")
            }
            className="sr-only"
          />
          {!existingProof && (
            <p className="mt-1 text-[11px] text-amber-600">
              Bukti wajib diunggah sebelum pembayaran diverifikasi.
            </p>
          )}
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
              Memverifikasi...
            </>
          ) : (
            <>
              <Icon name="check" className="h-4 w-4" />
              Verifikasi & Tandai Lunas
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
