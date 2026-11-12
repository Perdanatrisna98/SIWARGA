import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { FadeIn } from "@/components/motion";
import { PenggunaForm } from "@/components/pengguna-form";
import { getPenggunaById } from "@/lib/pengguna";
import { requireUserManager } from "@/lib/pengguna-access";
import { formatPenggunaWilayah } from "@/lib/pengguna-types";

export const metadata: Metadata = {
  title: "Edit Pengguna",
};

export default async function EditPenggunaPage({
  params,
}: {
  params: Promise<{ role: string; id: string }>;
}) {
  const { role, id } = await params;
  const session = await requireUserManager(role);

  const penggunaId = Number(id);

  if (!Number.isInteger(penggunaId) || penggunaId <= 0) {
    notFound();
  }

  let pengguna;
  let loadError = false;

  try {
    pengguna = await getPenggunaById(penggunaId);
  } catch (error) {
    console.error("Gagal memuat data pengguna:", error);
    loadError = true;
  }

  if (loadError) {
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
        </FadeIn>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Data pengguna belum dapat dimuat.</p>
          <p className="mt-1 leading-relaxed">
            Pastikan database aktif, lalu jalankan{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px]">
              npm run db:pengguna
            </code>{" "}
            untuk menyiapkan kolom wilayah pada tabel{" "}
            <code className="font-mono">users</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!pengguna) {
    notFound();
  }

  const isSelf = session.id === pengguna.id;

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
            Edit Pengguna
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Memperbarui akun{" "}
            <span className="font-semibold">{pengguna.name}</span> —{" "}
            {formatPenggunaWilayah(
              pengguna.role,
              pengguna.rw,
              pengguna.rt,
            )}
            .
          </p>
        </div>
      </FadeIn>

      <PenggunaForm
        mode="edit"
        pengguna={pengguna}
        cancelHref={`/dashboard/${role}/pengguna`}
        isSelf={isSelf}
      />
    </div>
  );
}
