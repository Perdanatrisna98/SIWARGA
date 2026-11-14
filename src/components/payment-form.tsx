"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  submitPaymentAction,
  type PaymentFormState,
} from "@/lib/actions/iuran";
import {
  IURAN_PAYMENT_METHODS,
  IURAN_PAYMENT_METHOD_LABELS,
  formatPeriode,
  formatRupiah,
  type IuranPaymentMethod,
  type IuranTagihanRecord,
} from "@/lib/iuran-types";
import { Icon, type IconName } from "./icons";
import { PressableButton, Spinner, fadeUp, staggerContainer } from "./motion";

type PaymentFormProps = {
  tagihan: IuranTagihanRecord;
  cancelHref: string;
};

const initialState: PaymentFormState = {};

const METHOD_META: Record<IuranPaymentMethod, { icon: IconName; hint: string }> =
  {
    cash: {
      icon: "wallet",
      hint: "Serahkan uang ke pengurus RT/RW. Pengurus akan mencatat dan mengunggah bukti penerimaan.",
    },
    transfer: {
      icon: "bank",
      hint: "Transfer ke rekening resmi RT/RW, lalu unggah bukti transfer.",
    },
    qris: {
      icon: "qr",
      hint: "Scan QRIS resmi RT/RW, lalu unggah bukti pembayaran.",
    },
  };

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-700";

export function PaymentForm({ tagihan, cancelHref }: PaymentFormProps) {
  const [state, formAction, pending] = useActionState(
    submitPaymentAction,
    initialState,
  );
  const [method, setMethod] = useState<IuranPaymentMethod>("transfer");
  const [proofName, setProofName] = useState("");
  const reduce = useReducedMotion();
  const needsProof = method === "transfer" || method === "qris";

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
        </div>

        <div className="mt-5">
          <p className={labelClass}>
            Metode Pembayaran <span className="text-rose-500">*</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {IURAN_PAYMENT_METHODS.map((value) => {
              const meta = METHOD_META[value];
              const active = method === value;

              return (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                    active
                      ? "border-blue-300 bg-blue-50/60 ring-2 ring-blue-500/15"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={value}
                    checked={active}
                    onChange={() => setMethod(value)}
                    className="sr-only"
                  />
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon name={meta.icon} className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-slate-900">
                      {IURAN_PAYMENT_METHOD_LABELS[value]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                      {meta.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <p className="flex items-start gap-2">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {method === "cash"
                ? "Pengajuan tunai akan diteruskan ke pengurus. Setelah uang diterima, pengurus mengunggah bukti penerimaan dan status berubah menjadi lunas."
                : "Hubungi pengurus RT/RW untuk detail rekening atau QRIS resmi, lalu unggah bukti pembayaran."}
            </span>
          </p>
        </div>

        {needsProof && (
          <div className="mt-5">
            <label htmlFor="proof" className={labelClass}>
              Bukti Pembayaran <span className="text-rose-500">*</span>
            </label>
            <label
              htmlFor="proof"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                <Icon name="upload" className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {proofName || "Pilih file bukti pembayaran"}
              </span>
              <span className="text-[11px] text-slate-400">
                JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.
              </span>
            </label>
            <input
              id="proof"
              name="proof"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) =>
                setProofName(event.target.files?.[0]?.name ?? "")
              }
              className="sr-only"
            />
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="note" className={labelClass}>
            Catatan <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            maxLength={255}
            placeholder="Contoh: transfer dari rekening BCA a/n ..."
            className={inputClass}
          />
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
              Mengirim...
            </>
          ) : (
            <>
              <Icon name="check" className="h-4 w-4" />
              Ajukan Pembayaran
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
