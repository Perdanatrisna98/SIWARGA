import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Icon, type IconName } from "@/components/icons";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { cancelPaymentAction, deleteTagihanAction } from "@/lib/actions/iuran";
import { getIuranStats, listIuranJenis, listIuranTagihan } from "@/lib/iuran";
import { requireKeuanganManager } from "@/lib/keuangan-access";
import {
  IURAN_PAYMENT_METHOD_LABELS,
  IURAN_STATUSES,
  IURAN_STATUS_LABELS,
  formatIuranDate,
  formatIuranDateTime,
  formatPeriode,
  formatRupiah,
  isIuranStatus,
  isOverdue,
  type IuranStats,
  type IuranTagihanRecord,
} from "@/lib/iuran-types";

export const metadata: Metadata = {
  title: "Kelola Iuran",
};

type SearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
  jenis?: string | string[];
  periode?: string | string[];
  page?: string | string[];
  notice?: string | string[];
  count?: string | string[];
}>;

const NOTICE_META: Record<
  string,
  { message: string; className: string; icon: IconName }
> = {
  generated: {
    message: "Tagihan iuran berhasil dibuat.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "generated-none": {
    message:
      "Tidak ada tagihan baru. Semua warga aktif sudah memiliki tagihan untuk periode ini.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "info",
  },
  verified: {
    message:
      "Pembayaran berhasil diverifikasi. Pemasukan kas dan kuitansi otomatis dibuat.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "already-paid": {
    message: "Tagihan ini sudah berstatus lunas.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "info",
  },
  canceled: {
    message: "Verifikasi pembayaran dibatalkan dan transaksi kas terkait dihapus.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "not-paid": {
    message: "Tagihan ini belum dibayar, tidak ada verifikasi untuk dibatalkan.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "info",
  },
  deleted: {
    message: "Tagihan iuran berhasil dihapus.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "delete-error": {
    message:
      "Tagihan gagal dihapus. Hanya tagihan berstatus belum dibayar yang dapat dihapus.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
  "verify-error": {
    message: "Verifikasi pembayaran gagal. Silakan coba lagi.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
  rejected: {
    message:
      "Pengajuan pembayaran ditolak. Status tagihan kembali menjadi belum dibayar.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "reject-error": {
    message: "Pengajuan pembayaran gagal ditolak. Silakan coba lagi.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
  "cancel-error": {
    message: "Pembatalan verifikasi gagal. Silakan coba lagi.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
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

export default async function IuranPage({
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
  const statusFilter = first(sp.status);
  const status = isIuranStatus(statusFilter) ? statusFilter : "";
  const jenisId = /^\d+$/.test(first(sp.jenis)) ? Number(first(sp.jenis)) : 0;
  const periode = first(sp.periode).slice(0, 10);
  const requestedPage = Math.max(1, Number(first(sp.page)) || 1);
  const noticeKey = first(sp.notice);
  const notice = NOTICE_META[noticeKey];
  const count = Math.max(0, Number(first(sp.count)) || 0);

  let data: {
    rows: IuranTagihanRecord[];
    total: number;
    page: number;
    totalPages: number;
  } | null = null;
  let stats: IuranStats | null = null;
  let jenisList: { id: number; name: string }[] = [];
  let loadError = false;

  try {
    const [list, summary, jenis] = await Promise.all([
      listIuranTagihan({
        q,
        status,
        jenisId,
        periode,
        page: requestedPage,
        access,
      }),
      getIuranStats(access),
      listIuranJenis(access),
    ]);
    data = list;
    stats = summary;
    jenisList = jenis.map((item) => ({ id: item.id, name: item.name }));
  } catch (error) {
    console.error("Gagal memuat data iuran:", error);
    loadError = true;
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasFilter = Boolean(q || status || jenisId || periode);
  const canManage = !access.blocked;
  const baseHref = `/dashboard/${role}/iuran`;
  const filters = {
    q,
    status,
    jenis: jenisId ? String(jenisId) : "",
    periode,
  };
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
      label: "Total tagihan",
      value: String(stats?.total ?? 0),
      icon: "receipt",
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Sudah lunas",
      value: String(stats?.paid ?? 0),
      icon: "check",
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Menunggu verifikasi",
      value: String(stats?.pending ?? 0),
      icon: "clock",
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Belum dibayar",
      value: String(stats?.unpaid ?? 0),
      icon: "clock",
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Tunggakan",
      value: formatRupiah(stats?.unpaidAmount ?? 0),
      icon: "wallet",
      tone: "bg-rose-50 text-rose-600",
    },
  ];

  const noticeMessage =
    noticeKey === "generated" && count > 0
      ? `${count} tagihan iuran berhasil dibuat.`
      : notice?.message;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Keuangan & Iuran
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Kelola Iuran & Verifikasi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Buat tagihan warga, verifikasi pembayaran, dan cetak kuitansi
              iuran secara otomatis.
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <Icon name="building" className="h-3 w-3" />
              {scopeLabel}
            </span>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`${baseHref}/jenis`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                <Icon name="settings" className="h-4 w-4" />
                Jenis Iuran
              </Link>
              <Link
                href={`${baseHref}/generate`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25"
              >
                <Icon name="plus" className="h-4 w-4" />
                Buat Tagihan
              </Link>
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn y={8}>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/${role}/keuangan`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Icon name="wallet" className="h-3.5 w-3.5" />
            Kas
          </Link>
          <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm">
            <Icon name="receipt" className="h-3.5 w-3.5" />
            Iuran & Verifikasi
          </span>
          {canManage && (
            <Link
              href={`${baseHref}/jenis`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Icon name="settings" className="h-3.5 w-3.5" />
              Jenis Iuran
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
              ditetapkan sebelum mengelola iuran.
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
            <span>{noticeMessage}</span>
          </div>
        </FadeIn>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">Data iuran belum dapat dimuat.</p>
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
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
                key={`${q}|${status}|${jenisId}|${periode}`}
                method="get"
                className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]"
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
                    placeholder="Cari nama warga, NIK, atau jenis iuran..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <select
                  name="status"
                  defaultValue={status}
                  aria-label="Filter status"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Semua status</option>
                  {IURAN_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {IURAN_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>

                <select
                  name="jenis"
                  defaultValue={jenisId ? String(jenisId) : ""}
                  aria-label="Filter jenis iuran"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Semua jenis</option>
                  {jenisList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="periode"
                  defaultValue={periode}
                  placeholder="Periode (2026-11)"
                  aria-label="Filter periode"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
                    Daftar Tagihan Iuran
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {total} tagihan ditemukan
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
                    <Icon name="receipt" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">
                    {hasFilter
                      ? "Tidak ada tagihan yang cocok"
                      : "Belum ada tagihan iuran"}
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    {hasFilter
                      ? "Coba ubah kata kunci atau filter yang digunakan."
                      : "Buat tagihan otomatis untuk seluruh warga aktif pada wilayah Anda."}
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
                        href={`${baseHref}/generate`}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <Icon name="plus" className="h-3.5 w-3.5" />
                        Buat tagihan
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Warga</th>
                          <th className="px-4 py-3 font-semibold">Iuran</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Nominal
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Jatuh Tempo
                          </th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((item) => {
                          const overdue = isOverdue(item.due_date, item.status);
                          const paid = item.status === "lunas";
                          const pending = item.status === "menunggu";

                          return (
                            <tr
                              key={item.id}
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              <td className="px-5 py-3.5">
                                <p className="font-semibold text-slate-900">
                                  {item.warga_name}
                                </p>
                                <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                  {item.warga_nik}
                                </p>
                                <p className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  RW {item.rw} / RT {item.rt}
                                </p>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="font-semibold text-slate-800">
                                  {item.jenis_name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  Periode {formatPeriode(item.periode)}
                                </p>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-slate-900">
                                {formatRupiah(item.amount)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">
                                {formatIuranDate(item.due_date)}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                                    paid
                                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                      : pending
                                        ? "bg-sky-50 text-sky-700 ring-sky-200"
                                        : overdue
                                          ? "bg-rose-50 text-rose-700 ring-rose-200"
                                          : "bg-amber-50 text-amber-700 ring-amber-200"
                                  }`}
                                >
                                  {paid
                                    ? "Lunas"
                                    : pending
                                      ? "Menunggu verifikasi"
                                      : overdue
                                        ? "Tunggakan"
                                        : "Belum dibayar"}
                                </span>
                                {paid && item.paid_at && (
                                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                                    {formatIuranDateTime(item.paid_at)}
                                    {item.paid_by_name
                                      ? ` • ${item.paid_by_name}`
                                      : ""}
                                  </p>
                                )}
                                {pending && (
                                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                                    {item.payment_method
                                      ? IURAN_PAYMENT_METHOD_LABELS[
                                          item.payment_method
                                        ]
                                      : "Menunggu metode"}
                                    {item.submitted_at
                                      ? ` • ${formatIuranDateTime(item.submitted_at)}`
                                      : ""}
                                  </p>
                                )}
                                {pending && item.proof_path && (
                                  <a
                                    href={item.proof_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline"
                                  >
                                    <Icon name="file" className="h-3 w-3" />
                                    Lihat bukti
                                  </a>
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center justify-end gap-1.5">
                                  {paid ? (
                                    <>
                                      <Link
                                        href={`${baseHref}/${item.id}/kuitansi`}
                                        aria-label={`Kuitansi ${item.warga_name}`}
                                        title="Kuitansi"
                                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                      >
                                        <Icon
                                          name="receipt"
                                          className="h-4 w-4"
                                        />
                                      </Link>
                                      {canManage && (
                                        <ConfirmActionButton
                                          action={cancelPaymentAction}
                                          id={item.id}
                                          icon="x"
                                          title="Batalkan verifikasi pembayaran?"
                                          description={`Status tagihan ${item.warga_name} akan kembali menjadi belum dibayar dan transaksi kas sebesar ${formatRupiah(item.amount)} akan dihapus.`}
                                          confirmLabel="Batalkan"
                                          triggerLabel="Batalkan verifikasi"
                                        />
                                      )}
                                    </>
                                  ) : pending ? (
                                    canManage && (
                                      <Link
                                        href={`${baseHref}/${item.id}/verifikasi`}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700"
                                      >
                                        <Icon name="eye" className="h-3.5 w-3.5" />
                                        Periksa
                                      </Link>
                                    )
                                  ) : (
                                    canManage && (
                                      <>
                                        <Link
                                          href={`${baseHref}/${item.id}/verifikasi`}
                                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
                                        >
                                          <Icon
                                            name="check"
                                            className="h-3.5 w-3.5"
                                          />
                                          Catat Bayar
                                        </Link>
                                        <ConfirmActionButton
                                          action={deleteTagihanAction}
                                          id={item.id}
                                          title="Hapus tagihan iuran?"
                                          description={`Tagihan ${item.jenis_name} untuk ${item.warga_name} akan dihapus permanen.`}
                                        />
                                      </>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
