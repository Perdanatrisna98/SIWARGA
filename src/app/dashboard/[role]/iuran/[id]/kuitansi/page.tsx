import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { PrintButton } from "@/components/print-button";
import { getIuranTagihanById } from "@/lib/iuran";
import { requireKeuanganManager } from "@/lib/keuangan-access";
import {
  IURAN_PAYMENT_METHOD_LABELS,
  IURAN_PERIOD_LABELS,
  formatIuranDate,
  formatIuranDateTime,
  formatPeriode,
  formatRupiah,
  makeIuranReceiptNumber,
} from "@/lib/iuran-types";

export const metadata: Metadata = {
  title: "Kuitansi Iuran",
};

export default async function KuitansiIuranPage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  const { access } = await requireKeuanganManager(role);
  const record = await getIuranTagihanById(Number(id), access);

  if (!record || record.status !== "lunas") notFound();

  const number = makeIuranReceiptNumber(record.id, record.paid_at);

  return (
    <div className="space-y-5">
      <FadeIn className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/dashboard/${role}/iuran`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
            Kembali ke Iuran
          </Link>
          <PrintButton label="Cetak Kuitansi" />
        </div>
      </FadeIn>

      <FadeIn>
        <article className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b-4 border-emerald-600 bg-slate-950 px-6 py-5 text-white print:bg-white print:text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200 print:text-emerald-600">
                  SIWARGA
                </p>
                <h1 className="mt-1 text-lg font-bold tracking-tight">
                  Kuitansi Pembayaran Iuran
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
                  {formatIuranDateTime(record.paid_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 print:px-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 print:bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                    Jumlah dibayar
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {formatRupiah(record.amount)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Icon name="check" className="h-3 w-3" />
                  Lunas
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {record.jenis_name} — periode {formatPeriode(record.periode)}
              </p>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Nama warga</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {record.warga_name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">NIK</dt>
                <dd className="font-mono text-xs font-semibold text-slate-900">
                  {record.warga_nik}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Wilayah</dt>
                <dd className="font-semibold text-slate-900">
                  RW {record.rw} / RT {record.rt}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Jenis iuran</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {record.jenis_name}
                  <span className="ml-1.5 text-[11px] font-medium text-slate-500">
                    ({IURAN_PERIOD_LABELS[record.jenis_period]})
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Periode tagihan</dt>
                <dd className="font-semibold text-slate-900">
                  {formatPeriode(record.periode)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Jatuh tempo</dt>
                <dd className="font-semibold text-slate-900">
                  {formatIuranDate(record.due_date)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Tanggal bayar</dt>
                <dd className="font-semibold text-slate-900">
                  {formatIuranDateTime(record.paid_at)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Metode pembayaran</dt>
                <dd className="font-semibold text-slate-900">
                  {record.payment_method
                    ? IURAN_PAYMENT_METHOD_LABELS[record.payment_method]
                    : "-"}
                </dd>
              </div>
              {record.proof_path && (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Bukti pembayaran</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    <a
                      href={record.proof_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline print:text-slate-700 print:no-underline"
                    >
                      Lihat bukti
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Diverifikasi oleh</dt>
                <dd className="font-semibold text-slate-900">
                  {record.paid_by_name ?? "-"}
                </dd>
              </div>
              {record.note && (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Catatan</dt>
                  <dd className="text-right text-xs font-medium text-slate-700">
                    {record.note}
                  </dd>
                </div>
              )}
            </dl>

            <div className="grid grid-cols-2 gap-6 pt-8 text-center text-xs text-slate-500">
              <div>
                <p>Warga / Pembayar</p>
                <div className="mt-12 border-t border-slate-300 pt-1.5 font-semibold text-slate-700">
                  {record.warga_name}
                </div>
              </div>
              <div>
                <p>Pengurus / Bendahara</p>
                <div className="mt-12 border-t border-slate-300 pt-1.5 font-semibold text-slate-700">
                  {record.paid_by_name ?? "...................................."}
                </div>
              </div>
            </div>

            <p className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-400">
              Kuitansi ini dibuat otomatis oleh SIWARGA setelah pembayaran
              diverifikasi. Pembayaran iuran tercatat sebagai pemasukan kas
              wilayah.
            </p>
          </div>
        </article>
      </FadeIn>
    </div>
  );
}
