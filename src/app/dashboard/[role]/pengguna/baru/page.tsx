import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { PenggunaForm } from "@/components/pengguna-form";
import { requireUserManager } from "@/lib/pengguna-access";

export const metadata: Metadata = {
  title: "Tambah Pengguna",
};

export default async function TambahPenggunaPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  await requireUserManager(role);

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href={`/dashboard/${role}/pengguna`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Kembali ke Manajemen Pengguna
        </Link>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Manajemen Pengguna
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Tambah Pengguna
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Buat akun baru dan tentukan role serta wilayah aksesnya. Kolom
            bertanda <span className="text-rose-500">*</span> wajib diisi.
          </p>
        </div>
      </FadeIn>

      <PenggunaForm
        mode="create"
        cancelHref={`/dashboard/${role}/pengguna`}
      />
    </div>
  );
}
