import type { Metadata } from "next";
import Link from "next/link";
import { GenerateTagihanForm } from "@/components/generate-tagihan-form";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { countEligibleWarga, listIuranJenis } from "@/lib/iuran";
import { requireKeuanganManager } from "@/lib/keuangan-access";

export const metadata: Metadata = {
  title: "Buat Tagihan Iuran",
};

export default async function GenerateTagihanPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const { access } = await requireKeuanganManager(role);

  const jenisList = await listIuranJenis(access, { activeOnly: true });
  const counts = await Promise.all(
    jenisList.map(async (jenis) => ({
      id: jenis.id,
      count: await countEligibleWarga(jenis),
    })),
  );
  const countMap = Object.fromEntries(counts.map((item) => [item.id, item.count]));

  const options = jenisList.map((jenis) => ({
    id: jenis.id,
    name: jenis.name,
    amount: jenis.amount,
    period: jenis.period,
    rw: jenis.rw,
    rt: jenis.rt,
  }));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const defaultDueDate = dueDate.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href={`/dashboard/${role}/iuran`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Kembali ke Iuran
        </Link>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Keuangan & Iuran
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Buat Tagihan Iuran
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Buat tagihan untuk seluruh warga aktif pada cakupan wilayah jenis
            iuran. Tagihan ganda pada periode yang sama otomatis dilewati.
          </p>
        </div>
      </FadeIn>

      {access.blocked ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Akun Anda belum memiliki wilayah. Hubungi admin agar wilayah RW/RT
            ditetapkan sebelum membuat tagihan.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl">
          <GenerateTagihanForm
            options={options}
            counts={countMap}
            cancelHref={`/dashboard/${role}/iuran`}
            jenisHref={`/dashboard/${role}/iuran/jenis`}
            defaultDueDate={defaultDueDate}
          />
        </div>
      )}
    </div>
  );
}
