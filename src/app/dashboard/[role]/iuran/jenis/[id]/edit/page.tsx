import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { IuranJenisForm } from "@/components/iuran-jenis-form";
import { FadeIn } from "@/components/motion";
import { getIuranJenisById } from "@/lib/iuran";
import { requireKeuanganManager } from "@/lib/keuangan-access";

export const metadata: Metadata = {
  title: "Edit Jenis Iuran",
};

export default async function EditJenisIuranPage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  const { access } = await requireKeuanganManager(role);
  const jenis = await getIuranJenisById(Number(id), access);

  if (!jenis) notFound();

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href={`/dashboard/${role}/iuran/jenis`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Kembali ke Jenis Iuran
        </Link>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Keuangan & Iuran
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Edit Jenis Iuran
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Perbarui nama, nominal, periode, atau cakupan wilayah jenis iuran.
          </p>
        </div>
      </FadeIn>

      {access.blocked ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Akun Anda belum memiliki wilayah. Hubungi admin agar wilayah RW/RT
            ditetapkan sebelum mengubah jenis iuran.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl">
          <IuranJenisForm
            mode="edit"
            jenis={jenis}
            cancelHref={`/dashboard/${role}/iuran/jenis`}
            scope={{ rw: access.rw, rt: access.rt }}
          />
        </div>
      )}
    </div>
  );
}
