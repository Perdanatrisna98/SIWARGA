import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Icon, type IconName } from "@/components/icons";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { getKeuanganStats, listKeuangan } from "@/lib/keuangan";
import { requireKeuanganManager } from "@/lib/keuangan-access";
import { deleteKeuanganAction } from "@/lib/actions/keuangan";
import {
  KATEGORI_KEUANGAN,
  KEUANGAN_TYPES,
  KEUANGAN_TYPE_LABELS,
  formatKeuanganDate,
  formatRupiah,
  isKategoriKeuangan,
  isKeuanganType,
  type KeuanganRecord,
  type KeuanganStats,
  type KeuanganType,
} from "@/lib/keuangan-types";

export const metadata: Metadata = {
  title: "Kelola Keuangan",
};

type SearchParams = Promise<{
  q?: string | string[];
  type?: string | string[];
  category?: string | string[];
  from?: string | string[];
  to?: string | string[];
  page?: string | string[];
  notice?: string | string[];
}>;

const NOTICE_META: Record<
  string,
  { message: string; className: string; icon: IconName }
> = {
  created: {
    message: "Transaksi kas berhasil dicatat.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  updated: {
    message: "Transaksi kas berhasil diperbarui.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  deleted: {
    message: "Transaksi kas berhasil dihapus.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "delete-error": {
    message:
      "Transaksi gagal dihapus. Transaksi yang terhubung dengan pembayaran iuran harus dibatalkan verifikasinya terlebih dahulu.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
};

const TYPE_BADGE: Record<KeuanganType, string> = {
  pemasukan: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pengeluaran: "bg-rose-50 text-rose-700 ring-rose-200",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function buildQuery(filters: Record<string, string>, page: number): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function KeuanganPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: SearchParams;
}) {
  const { role } = await params;
  const { access } = await requireKeuanganManager(role);

  const sp = await searchParams;
  const q = first(sp.q).slice(0, 100);
  const typeFilter = first(sp.type);
  const type = isKeuanganType(typeFilter) ? typeFilter : "";
  const categoryFilter = first(sp.category);
  const category = isKategoriKeuangan(categoryFilter) ? categoryFilter : "";
  const from = first(sp.from);
  const to = first(sp.to);
  const requestedPage = Math.max(1, Number(first(sp.page)) || 1);
  const notice = NOTICE_META[first(sp.notice)];

  let data: {
    rows: KeuanganRecord[];
    total: number;
    page: number;
    totalPages: number;
  } | null = null;
  let stats: KeuanganStats | null = null;
  let loadError = false;

  try {
    const [list, summary] = await Promise.all([
      listKeuangan({
        q,
        type,
        category,
        from,
        to,
        page: requestedPage,
        access,
      }),
      getKeuanganStats(access),
    ]);
    data = list;
    stats = summary;
  } catch (error) {
    console.error("Gagal memuat data keuangan:", error);
    loadError = true;
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasFilter = Boolean(q || type || category || from || to);
  const canManage = !access.blocked;
  const baseHref = `/dashboard/${role}/keuangan`;
  const filters = { q, type, category, from, to };
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
    value: string;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: "Saldo kas",
      value: formatRupiah(stats?.balance ?? 0),
      icon: "wallet",
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total pemasukan",
      value: formatRupiah(stats?.income ?? 0),
      icon: "arrowRight",
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total pengeluaran",
      value: formatRupiah(stats?.expense ?? 0),
      icon: "arrowRight",
      tone: "bg-rose-50 text-rose-600",
    },
    {
      label: "Jumlah transaksi",
      value: String(stats?.count ?? 0),
      icon: "receipt",
      tone: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Keuangan & Iuran
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Kelola Keuangan Kas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Catat pemasukan dan pengeluaran kas, pantau saldo, serta cetak
              kuitansi transaksi.
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
              Catat Kas
            </Link>
          )}
        </div>
      </FadeIn>

      <FadeIn y={8}>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`${baseHref}`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Icon name="wallet" className="h-3.5 w-3.5" />
            Kas
          </Link>
          <Link
            href={`/dashboard/${role}/iuran`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Icon name="receipt" className="h-3.5 w-3.5" />
            Iuran & Verifikasi
          </Link>
        </div>
      </FadeIn>

      {access.blocked && (
        <FadeIn y={8}>
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Akun Anda belum memiliki wilayah. Hubungi admin agar wilayah RW/RT
              ditetapkan sebelum mengelola keuangan.
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
          <p className="font-semibold">Data keuangan belum dapat dimuat.</p>
          <p className="mt-1 leading-relaxed">
            Pastikan database aktif, lalu jalankan{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px]">
              npm run db:keuangan
            </code>{" "}
            untuk membuat tabel keuangan dan iuran.
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
                    <span className="text-right text-sm font-bold tracking-tight text-slate-900 sm:text-base">
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
                key={`${q}|${type}|${category}|${from}|${to}`}
                method="get"
                className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]"
              >
                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    name="q"
                    defaultValue={q}
                    placeholder="Cari keterangan atau kategori..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <select
                  name="type"
                  defaultValue={type}
                  aria-label="Filter jenis transaksi"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Semua jenis</option>
                  {KEUANGAN_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {KEUANGAN_TYPE_LABELS[value]}
                    </option>
                  ))}
                </select>

                <select
                  name="category"
                  defaultValue={category}
                  aria-label="Filter kategori"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Semua kategori</option>
                  {KATEGORI_KEUANGAN.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  name="from"
                  defaultValue={from}
                  aria-label="Dari tanggal"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <input
                  type="date"
                  name="to"
                  defaultValue={to}
                  aria-label="Sampai tanggal"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
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
                    Buku Kas
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {total} transaksi ditemukan
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
                    <Icon name="wallet" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">
                    {hasFilter
                      ? "Tidak ada transaksi yang cocok"
                      : "Belum ada transaksi kas"}
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    {hasFilter
                      ? "Coba ubah kata kunci atau filter yang digunakan."
                      : "Catat pemasukan atau pengeluaran pertama untuk mulai membangun buku kas."}
                  </p>
                  {hasFilter ? (
                    <Link
                      href={baseHref}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      <Icon name="x" className="h-3.5 w-3.5" />
                      Hapus filter
                    </Link>
                  ) : (
                    canManage && (
                      <Link
                        href={`${baseHref}/baru`}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <Icon name="plus" className="h-3.5 w-3.5" />
                        Catat kas
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Tanggal</th>
                          <th className="px-4 py-3 font-semibold">
                            Keterangan
                          </th>
                          <th className="px-4 py-3 font-semibold">Kategori</th>
                          <th className="px-4 py-3 font-semibold">Wilayah</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Nominal
                          </th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((item) => (
                          <tr
                            key={item.id}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                              {formatKeuanganDate(item.transaction_date)}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="font-semibold text-slate-900">
                                  {item.description}
                                </p>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${TYPE_BADGE[item.type]}`}
                                >
                                  {KEUANGAN_TYPE_LABELS[item.type]}
                                </span>
                              </div>
                              {item.created_by_name && (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  Dicatat oleh {item.created_by_name}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              RW {item.rw}
                              {item.rt ? ` / RT ${item.rt}` : ""}
                            </td>
                            <td
                              className={`whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold ${
                                item.type === "pemasukan"
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {item.type === "pemasukan" ? "+" : "−"}
                              {formatRupiah(item.amount)}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`${baseHref}/${item.id}/kuitansi`}
                                  aria-label={`Kuitansi transaksi ${item.description}`}
                                  title="Kuitansi"
                                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                  <Icon name="receipt" className="h-4 w-4" />
                                </Link>
                                {canManage && (
                                  <>
                                    <Link
                                      href={`${baseHref}/${item.id}/edit`}
                                      aria-label={`Edit transaksi ${item.description}`}
                                      title="Edit"
                                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                      <Icon name="pencil" className="h-4 w-4" />
                                    </Link>
                                    <ConfirmActionButton
                                      action={deleteKeuanganAction}
                                      id={item.id}
                                      title="Hapus transaksi kas?"
                                      description={`Transaksi "${item.description}" akan dihapus permanen dan tidak dapat dikembalikan.`}
                                    />
                                  </>
                                )}
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
