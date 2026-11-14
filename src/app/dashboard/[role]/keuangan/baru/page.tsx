import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { KeuanganForm } from "@/components/keuangan-form";
import { requireKeuanganManager } from "@/lib/keuangan-access";

export const metadata: Metadata = {
  title: "Catat Kas",
};

export default async function CatatKasPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const { access } = await requireKeuanganManager(role);

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href={`/dashboard/${role}/keuangan`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Kembali ke Keuangan
        </Link>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Keuangan & Iuran
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Catat Kas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Catat transaksi pemasukan atau pengeluaran kas. Kolom bertanda{" "}
            <span className="text-rose-500">*</span> wajib diisi.
          </p>
        </div>
      </FadeIn>

      {access.blocked ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Akun Anda belum memiliki wilayah. Hubungi admin agar wilayah RW/RT
            ditetapkan sebelum mencatat kas.
          </p>
        </div>
      ) : (
        <KeuanganForm
          mode="create"
          cancelHref={`/dashboard/${role}/keuangan`}
          scope={{ rw: access.rw, rt: access.rt }}
        />
      )}
    </div>
  );
}
