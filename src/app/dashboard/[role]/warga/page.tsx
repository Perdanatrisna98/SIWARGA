import type { Metadata } from "next";
import Link from "next/link";
import { DeleteWargaButton } from "@/components/delete-warga-button";
import { Icon, type IconName } from "@/components/icons";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { getWargaStats, listWarga } from "@/lib/warga";
import { requireWargaManager } from "@/lib/warga-access";
import {
  GENDER_LABELS,
  WARGA_STATUSES,
  WARGA_STATUS_LABELS,
  calculateAge,
  formatWargaDate,
  isWargaStatus,
  type WargaRecord,
  type WargaStats,
  type WargaStatus,
} from "@/lib/warga-types";

export const metadata: Metadata = {
  title: "Data Warga",
};

type SearchParams = Promise<{
  q?: string | string[];
  rt?: string | string[];
  rw?: string | string[];
  status?: string | string[];
  page?: string | string[];
  notice?: string | string[];
}>;

const NOTICE_META: Record<
  string,
  { message: string; className: string; icon: IconName }
> = {
  created: {
    message: "Data warga berhasil ditambahkan.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  updated: {
    message: "Data warga berhasil diperbarui.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  deleted: {
    message: "Data warga berhasil dihapus.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "delete-error": {
    message: "Data warga gagal dihapus. Silakan coba lagi.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
};

const STATUS_BADGE: Record<WargaStatus, string> = {
  aktif: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pindah: "bg-amber-50 text-amber-700 ring-amber-200",
  meninggal: "bg-slate-100 text-slate-600 ring-slate-200",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function buildQuery(
  filters: Record<string, string>,
  page: number,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function WargaPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: SearchParams;
}) {
  const { role } = await params;
  const { access } = await requireWargaManager(role);

  const sp = await searchParams;
  const q = first(sp.q).slice(0, 100);
  const rawRt = /^\d{1,3}$/.test(first(sp.rt))
    ? first(sp.rt).padStart(3, "0")
    : "";
  const rawRw = /^\d{1,3}$/.test(first(sp.rw))
    ? first(sp.rw).padStart(3, "0")
    : "";
  const rt = access.rt ? "" : rawRt;
  const rw = access.rw ? "" : rawRw;
  const statusFilter = first(sp.status);
  const status = isWargaStatus(statusFilter) ? statusFilter : "";
  const requestedPage = Math.max(1, Number(first(sp.page)) || 1);
  const notice = NOTICE_META[first(sp.notice)];

  let data: {
    rows: WargaRecord[];
    total: number;
    page: number;
    totalPages: number;
  } | null = null;
  let stats: WargaStats | null = null;
  let loadError = false;

  try {
    const [list, summary] = await Promise.all([
      listWarga({ q, rt, rw, status, page: requestedPage, access }),
      getWargaStats(access),
    ]);
    data = list;
    stats = summary;
  } catch (error) {
    console.error("Gagal memuat data warga:", error);
    loadError = true;
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasFilter = Boolean(q || rt || rw || status);
  const canManage = !access.blocked;
  const baseHref = `/dashboard/${role}/warga`;
  const filters = { q, rt, rw, status };
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

  const statItems: {
    label: string;
    value: number;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: "Total warga",
      value: stats?.total ?? 0,
      icon: "users",
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Kartu keluarga",
      value: stats?.households ?? 0,
      icon: "home",
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Laki-laki",
      value: stats?.male ?? 0,
      icon: "user",
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Perempuan",
      value: stats?.female ?? 0,
      icon: "user",
      tone: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Data Warga
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Kelola Data Warga
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola data kependudukan warga, mulai dari identitas hingga status
              domisili.
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <Icon name="building" className="h-3 w-3" />
              {scopeLabel}
            </span>
          </div>

          {canManage && (
            <Link
              href={`${baseHref}/baru`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25"
            >
              <Icon name="plus" className="h-4 w-4" />
              Tambah Warga
            </Link>
          )}
        </div>
      </FadeIn>

      {access.blocked && (
        <FadeIn y={8}>
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Akun Anda belum memiliki wilayah. Hubungi admin agar wilayah RW/RT
              ditetapkan sebelum mengelola data warga.
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
          <p className="font-semibold">Data warga belum dapat dimuat.</p>
          <p className="mt-1 leading-relaxed">
            Pastikan database aktif, lalu jalankan{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px]">
              npm run db:warga
            </code>{" "}
            untuk membuat tabel <code className="font-mono">warga</code>.
          </p>
        </div>
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statItems.map((item) => (
              <StaggerItem key={item.label}>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl ${item.tone}`}
                    >
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                      {item.value}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-slate-500">
                    {item.label}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.08}>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <form
                key={`${q}|${rt}|${rw}|${status}`}
                method="get"
                className="flex flex-col gap-3 lg:flex-row lg:items-center"
              >
                <div className="relative flex-1">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    name="q"
                    defaultValue={q}
                    placeholder="Cari nama, NIK, KK, atau nomor HP..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
                  {access.rt ? (
                    <span className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-1">
                      <Icon name="building" className="h-3.5 w-3.5" />
                      RW {access.rw} / RT {access.rt}
                    </span>
                  ) : (
                    <>
                      <input
                        name="rt"
                        defaultValue={rt}
                        inputMode="numeric"
                        maxLength={3}
                        placeholder="RT"
                        aria-label="Filter RT"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 lg:w-20"
                      />
                      {access.rw ? (
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600">
                          <Icon name="building" className="h-3.5 w-3.5" />
                          RW {access.rw}
                        </span>
                      ) : (
                        <input
                          name="rw"
                          defaultValue={rw}
                          inputMode="numeric"
                          maxLength={3}
                          placeholder="RW"
                          aria-label="Filter RW"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 lg:w-20"
                        />
                      )}
                    </>
                  )}
                  <select
                    name="status"
                    defaultValue={status}
                    aria-label="Filter status"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">Semua status</option>
                    {WARGA_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {WARGA_STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
                  >
                    Filter
                  </button>

                  {hasFilter && (
                    <Link
                      href={baseHref}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Reset
                    </Link>
                  )}
                </div>
              </form>
            </section>
          </FadeIn>

          <FadeIn delay={0.14}>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Daftar Warga
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {total} data ditemukan
                    {hasFilter ? " sesuai filter" : ""}.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {scopeLabel}
                </span>
              </div>

              {rows.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                    <Icon name="users" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">
                    {hasFilter
                      ? "Tidak ada data yang cocok"
                      : "Belum ada data warga"}
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    {hasFilter
                      ? "Coba ubah kata kunci atau filter yang digunakan."
                      : "Tambahkan data warga pertama untuk mulai mengelola kependudukan."}
                  </p>
                  {hasFilter && (
                    <Link
                      href={baseHref}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Icon name="x" className="h-3.5 w-3.5" />
                      Hapus filter
                    </Link>
                  )}
                  {!hasFilter && canManage && (
                    <Link
                      href={`${baseHref}/baru`}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Icon name="plus" className="h-3.5 w-3.5" />
                      Tambah warga
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Nama / NIK</th>
                          <th className="px-4 py-3 font-semibold">RT / RW</th>
                          <th className="px-4 py-3 font-semibold">
                            Jenis Kelamin
                          </th>
                          <th className="px-4 py-3 font-semibold">Usia</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((warga) => (
                          <tr
                            key={warga.id}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="font-semibold text-slate-900">
                                  {warga.name}
                                </p>
                                {warga.edit_requested_at && (
                                  <span
                                    title={`Permintaan perubahan diajukan pada ${formatWargaDate(
                                      warga.edit_requested_at,
                                    )}`}
                                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200"
                                  >
                                    <Icon
                                      name="pencil"
                                      className="h-2.5 w-2.5"
                                    />
                                    Minta perubahan
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                {warga.nik}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                RT {warga.rt} / RW {warga.rw}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              {GENDER_LABELS[warga.gender]}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              {calculateAge(warga.birth_date)} th
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${STATUS_BADGE[warga.status]}`}
                              >
                                {WARGA_STATUS_LABELS[warga.status]}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`${baseHref}/${warga.id}/edit`}
                                  aria-label={`Edit data ${warga.name}`}
                                  title="Edit"
                                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                  <Icon name="pencil" className="h-4 w-4" />
                                </Link>
                                <DeleteWargaButton
                                  id={warga.id}
                                  name={warga.name}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                    <p>
                      Halaman {page} dari {totalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`${baseHref}${buildQuery(filters, page - 1)}`}
                        aria-disabled={page <= 1}
                        className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition-colors hover:bg-slate-50 ${
                          page <= 1
                            ? "pointer-events-none opacity-40"
                            : "text-slate-600"
                        }`}
                      >
                        <Icon name="chevronLeft" className="h-3.5 w-3.5" />
                        Sebelumnya
                      </Link>
                      <Link
                        href={`${baseHref}${buildQuery(filters, page + 1)}`}
                        aria-disabled={page >= totalPages}
                        className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition-colors hover:bg-slate-50 ${
                          page >= totalPages
                            ? "pointer-events-none opacity-40"
                            : "text-slate-600"
                        }`}
                      >
                        Berikutnya
                        <Icon name="chevronRight" className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </section>
          </FadeIn>
        </>
      )}
    </div>
  );
}
