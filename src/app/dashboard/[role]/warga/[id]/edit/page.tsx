import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { WargaForm } from "@/components/warga-form";
import { getWargaById } from "@/lib/warga";
import {
  isWargaInScope,
  requireWargaManager,
} from "@/lib/warga-access";

export const metadata: Metadata = {
  title: "Edit Data Warga",
};

export default async function EditWargaPage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  const { access } = await requireWargaManager(role);

  const wargaId = Number(id);

  if (!Number.isInteger(wargaId) || wargaId <= 0) {
    notFound();
  }

  let warga;
  let loadError = false;

  try {
    warga = await getWargaById(wargaId);
  } catch (error) {
    console.error("Gagal memuat data warga:", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <FadeIn>
          <Link
            href={`/dashboard/${role}/warga`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
            Kembali ke Data Warga
          </Link>
        </FadeIn>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Data warga belum dapat dimuat.</p>
          <p className="mt-1 leading-relaxed">
            Pastikan database aktif, lalu jalankan{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px]">
              npm run db:warga
            </code>{" "}
            untuk membuat tabel <code className="font-mono">warga</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!warga || !isWargaInScope(warga, access)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href={`/dashboard/${role}/warga`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Kembali ke Data Warga
        </Link>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Data Warga
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Edit Data Warga
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Memperbarui data <span className="font-semibold">{warga.name}</span>{" "}
            — NIK {warga.nik}.
          </p>
        </div>
      </FadeIn>

      <WargaForm
        mode="edit"
        warga={warga}
        cancelHref={`/dashboard/${role}/warga`}
        scope={{ rw: access.rw, rt: access.rt }}
      />
    </div>
  );
}
