import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Icon, type IconName } from "@/components/icons";
import { IuranJenisForm } from "@/components/iuran-jenis-form";
import { FadeIn } from "@/components/motion";
import {
  deleteIuranJenisAction,
  toggleIuranJenisAction,
} from "@/lib/actions/iuran";
import { listIuranJenis } from "@/lib/iuran";
import { requireKeuanganManager } from "@/lib/keuangan-access";
import {
  IURAN_PERIOD_LABELS,
  formatRupiah,
} from "@/lib/iuran-types";

export const metadata: Metadata = {
  title: "Jenis Iuran",
};

type SearchParams = Promise<{ notice?: string | string[] }>;

const NOTICE_META: Record<
  string,
  { message: string; className: string; icon: IconName }
> = {
  created: {
    message: "Jenis iuran berhasil ditambahkan.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  updated: {
    message: "Jenis iuran berhasil diperbarui.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  deleted: {
    message: "Jenis iuran berhasil dihapus.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "update-error": {
    message: "Status jenis iuran gagal diubah. Silakan coba lagi.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
  "delete-error": {
    message:
      "Jenis iuran gagal dihapus. Jenis yang sudah memiliki tagihan tidak dapat dihapus; nonaktifkan saja.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function IuranJenisPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: SearchParams;
}) {
  const { role } = await params;
  const { access } = await requireKeuanganManager(role);
  const sp = await searchParams;
  const notice = NOTICE_META[first(sp.notice)];

  let jenisList: Awaited<ReturnType<typeof listIuranJenis>> = [];
  let loadError = false;

  try {
    jenisList = await listIuranJenis(access);
  } catch (error) {
    console.error("Gagal memuat jenis iuran:", error);
    loadError = true;
  }

  const baseHref = `/dashboard/${role}/iuran/jenis`;
  const scopeLabel = access.isAdmin
    ? "Semua wilayah"
    : access.blocked
      ? "Wilayah belum diatur"
      : [
          access.rw ? `RW ${access.rw}` : null,
          access.rt ? `RT ${access.rt}` : null,
        ]
          .filter(Boolean)
          .join(" / ");

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
            Jenis Iuran
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Atur jenis dan nominal iuran yang berlaku di wilayah{" "}
            <span className="font-semibold text-slate-700">{scopeLabel}</span>.
          </p>
        </div>
      </FadeIn>

      {access.blocked && (
        <FadeIn y={8}>
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Akun Anda belum memiliki wilayah. Hubungi admin agar wilayah RW/RT
              ditetapkan sebelum mengelola jenis iuran.
            </p>
          </div>
        </FadeIn>
      )}

      {notice && (
        <FadeIn y={8}>
          <div
            role="status"
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${notice.className}`}
          >
            <Icon name={notice.icon} className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice.message}</span>
          </div>
        </FadeIn>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Data jenis iuran belum dapat dimuat.</p>
          <p className="mt-1 leading-relaxed">
            Pastikan database aktif, lalu jalankan{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px]">
              npm run db:keuangan
            </code>{" "}
            untuk membuat tabel iuran.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
          <div>
            {access.blocked ? null : (
              <IuranJenisForm
                mode="create"
                cancelHref={`/dashboard/${role}/iuran`}
                scope={{ rw: access.rw, rt: access.rt }}
              />
            )}
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Daftar Jenis Iuran
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {jenisList.length} jenis iuran terdaftar.
                </p>
              </div>
              <Link
                href={`/dashboard/${role}/iuran/generate`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                Buat Tagihan
              </Link>
            </div>

            {jenisList.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                  <Icon name="settings" className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">
                  Belum ada jenis iuran
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                  Tambahkan jenis iuran melalui formulir di samping agar tagihan
                  warga dapat dibuat otomatis.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {jenisList.map((jenis) => (
                  <li
                    key={jenis.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {jenis.name}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${
                            jenis.active
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-500 ring-slate-200"
                          }`}
                        >
                          {jenis.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatRupiah(jenis.amount)} •{" "}
                        {IURAN_PERIOD_LABELS[jenis.period]} • RW {jenis.rw}
                        {jenis.rt ? ` / RT ${jenis.rt}` : " (semua RT)"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <form action={toggleIuranJenisAction}>
                        <input type="hidden" name="id" value={jenis.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={jenis.active ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                            jenis.active
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {jenis.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                      <Link
                        href={`${baseHref}/${jenis.id}/edit`}
                        aria-label={`Edit ${jenis.name}`}
                        title="Edit"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Icon name="pencil" className="h-4 w-4" />
                      </Link>
                      <ConfirmActionButton
                        action={deleteIuranJenisAction}
                        id={jenis.id}
                        title="Hapus jenis iuran?"
                        description={`Jenis iuran ${jenis.name} akan dihapus permanen. Jenis yang sudah memiliki tagihan tidak dapat dihapus.`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
