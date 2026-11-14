import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { VerifyPaymentForm } from "@/components/verify-payment-form";
import { rejectPaymentAction } from "@/lib/actions/iuran";
import { getIuranTagihanById } from "@/lib/iuran";
import { requireKeuanganManager } from "@/lib/keuangan-access";
import {
  IURAN_PAYMENT_METHOD_LABELS,
  formatIuranDate,
  formatIuranDateTime,
  formatPeriode,
  formatRupiah,
} from "@/lib/iuran-types";

export const metadata: Metadata = {
  title: "Verifikasi Pembayaran Iuran",
};

export default async function VerifikasiIuranPage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  const { access } = await requireKeuanganManager(role);
  const record = await getIuranTagihanById(Number(id), access);

  if (!record) notFound();

  if (record.status === "lunas") {
    redirect(`/dashboard/${role}/iuran/${record.id}/kuitansi`);
  }

  const baseHref = `/dashboard/${role}/iuran`;

  return (
    <div className="space-y-5">
      <FadeIn>
        <div>
          <Link
            href={baseHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
            Kembali ke Iuran
          </Link>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Keuangan & Iuran
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Verifikasi Pembayaran
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Periksa bukti pembayaran sebelum mengubah status menjadi lunas.
            Setelah diverifikasi, pemasukan kas dan kuitansi dibuat otomatis.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Warga
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {record.warga_name}
              </dd>
              <dd className="mt-0.5 font-mono text-[11px] text-slate-400">
                {record.warga_nik}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Iuran
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {record.jenis_name}
              </dd>
              <dd className="mt-0.5 text-xs text-slate-500">
                {formatPeriode(record.periode)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Nominal
              </dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">
                {formatRupiah(record.amount)}
              </dd>
              <dd className="mt-0.5 text-xs text-slate-500">
                Jatuh tempo {formatIuranDate(record.due_date)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Wilayah
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                RW {record.rw} / RT {record.rt}
              </dd>
            </div>
          </dl>

          {record.status === "menunggu" && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Icon name="clock" className="h-3.5 w-3.5" />
                Menunggu verifikasi
              </span>
              <span>
                Metode{" "}
                {record.payment_method
                  ? IURAN_PAYMENT_METHOD_LABELS[record.payment_method]
                  : "-"}
              </span>
              {record.submitted_at && (
                <span>Diajukan {formatIuranDateTime(record.submitted_at)}</span>
              )}
            </div>
          )}
        </section>
      </FadeIn>

      <FadeIn delay={0.1}>
        <VerifyPaymentForm
          tagihan={record}
          cancelHref={baseHref}
        />
      </FadeIn>

      {record.status === "menunggu" && (
        <FadeIn delay={0.14}>
          <section className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-rose-800">
                Tolak pengajuan pembayaran
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-700">
                Status kembali menjadi belum dibayar dan bukti yang diunggah
                warga dihapus. Gunakan jika bukti tidak valid.
              </p>
            </div>
            <ConfirmActionButton
              action={rejectPaymentAction}
              id={record.id}
              icon="x"
              title="Tolak pengajuan pembayaran?"
              description={`Pengajuan ${record.warga_name} akan ditolak, bukti dihapus, dan status kembali menjadi belum dibayar.`}
              confirmLabel="Tolak"
              triggerLabel="Tolak pengajuan"
            />
          </section>
        </FadeIn>
      )}
    </div>
  );
}
