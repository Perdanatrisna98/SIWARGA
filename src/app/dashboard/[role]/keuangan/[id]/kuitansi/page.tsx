import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { PrintButton } from "@/components/print-button";
import { getKeuanganById } from "@/lib/keuangan";
import { requireKeuanganManager } from "@/lib/keuangan-access";
import {
  KEUANGAN_TYPE_LABELS,
  formatKeuanganDate,
  formatRupiah,
} from "@/lib/keuangan-types";
import { makeKeuanganReceiptNumber } from "@/lib/iuran-types";

export const metadata: Metadata = {
  title: "Kuitansi Kas",
};

export default async function KuitansiKasPage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  const { access } = await requireKeuanganManager(role);
  const record = await getKeuanganById(Number(id), access);

  if (!record) notFound();

  const number = makeKeuanganReceiptNumber(record.id, record.transaction_date);

  return (
    <div className="space-y-5">
      <FadeIn className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/dashboard/${role}/keuangan`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
            Kembali ke Keuangan
          </Link>
          <PrintButton label="Cetak Kuitansi" />
        </div>
      </FadeIn>

      <FadeIn>
        <article className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b-4 border-blue-600 bg-slate-950 px-6 py-5 text-white print:bg-white print:text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200 print:text-blue-600">
                  SIWARGA
                </p>
                <h1 className="mt-1 text-lg font-bold tracking-tight">
                  Kuitansi Kas
                </h1>
                <p className="mt-0.5 text-[11px] text-slate-300 print:text-slate-500">
                  Sistem Informasi Administrasi Warga
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 print:text-slate-500">
                  Nomor
                </p>
                <p className="font-mono text-xs font-semibold">{number}</p>
                <p className="mt-1 text-[10px] text-slate-300 print:text-slate-500">
                  {formatKeuanganDate(record.transaction_date)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 print:px-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 print:bg-white">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {KEUANGAN_TYPE_LABELS[record.type]}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {formatRupiah(record.amount)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {record.description}
              </p>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Jenis transaksi</dt>
                <dd className="font-semibold text-slate-900">
                  {KEUANGAN_TYPE_LABELS[record.type]}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Kategori</dt>
                <dd className="font-semibold text-slate-900">
                  {record.category}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Wilayah</dt>
                <dd className="font-semibold text-slate-900">
                  RW {record.rw}
                  {record.rt ? ` / RT ${record.rt}` : ""}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Tanggal transaksi</dt>
                <dd className="font-semibold text-slate-900">
                  {formatKeuanganDate(record.transaction_date)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Dicatat oleh</dt>
                <dd className="font-semibold text-slate-900">
                  {record.created_by_name ?? "-"}
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-2 gap-6 pt-8 text-center text-xs text-slate-500">
              <div>
                <p>Penyetor / Penerima</p>
                <div className="mt-12 border-t border-slate-300 pt-1.5 font-semibold text-slate-700">
                  ....................................
                </div>
              </div>
              <div>
                <p>Bendahara</p>
                <div className="mt-12 border-t border-slate-300 pt-1.5 font-semibold text-slate-700">
                  {record.created_by_name ?? "...................................."}
                </div>
              </div>
            </div>

            <p className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-400">
              Kuitansi ini dibuat otomatis oleh SIWARGA. Simpan sebagai bukti
              pencatatan kas yang sah.
            </p>
          </div>
        </article>
      </FadeIn>
    </div>
  );
}
