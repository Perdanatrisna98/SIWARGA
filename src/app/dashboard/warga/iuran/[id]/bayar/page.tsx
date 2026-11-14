import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { PaymentForm } from "@/components/payment-form";
import { requireSession } from "@/lib/auth";
import { getIuranTagihanForWarga } from "@/lib/iuran";
import { getWargaByUserId } from "@/lib/warga";
import { formatIuranDate } from "@/lib/iuran-types";

export const metadata: Metadata = {
  title: "Bayar Iuran",
};

export default async function BayarIuranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();

  if (session.role !== "warga") {
    redirect(`/dashboard/${session.role}`);
  }

  const { id } = await params;
  const warga = await getWargaByUserId(session.id);

  if (!warga) notFound();

  const record = await getIuranTagihanForWarga(Number(id), warga.id);

  if (!record) notFound();

  if (record.status === "lunas") {
    redirect(`/dashboard/warga/iuran/${record.id}/kuitansi`);
  }

  if (record.status === "menunggu") {
    redirect("/dashboard/warga/iuran?notice=already-submitted");
  }

  return (
    <div className="space-y-5">
      <FadeIn>
        <div>
          <Link
            href="/dashboard/warga/iuran"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-amber-600"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
            Kembali ke Iuran Saya
          </Link>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
            Bayar Iuran
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Pilih Metode Pembayaran
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Bayar tunai melalui pengurus RT/RW, atau transfer/QRIS lalu unggah
            bukti pembayaran. Jatuh tempo{" "}
            {formatIuranDate(record.due_date)}.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <PaymentForm
          tagihan={record}
          cancelHref="/dashboard/warga/iuran"
        />
      </FadeIn>
    </div>
  );
}
