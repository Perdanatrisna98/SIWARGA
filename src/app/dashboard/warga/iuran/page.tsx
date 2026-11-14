import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Icon, type IconName } from "@/components/icons";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { cancelSubmissionAction } from "@/lib/actions/iuran";
import { requireSession } from "@/lib/auth";
import {
  getWargaIuranStats,
  listIuranTagihanForWarga,
} from "@/lib/iuran";
import { getWargaByUserId } from "@/lib/warga";
import {
  IURAN_PAYMENT_METHOD_LABELS,
  formatIuranDate,
  formatIuranDateTime,
  formatPeriode,
  formatRupiah,
  isOverdue,
  isIuranStatus,
  type IuranStatus,
  type IuranTagihanRecord,
} from "@/lib/iuran-types";

export const metadata: Metadata = {
  title: "Iuran Saya",
};

type SearchParams = Promise<{
  status?: string | string[];
  page?: string | string[];
  notice?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function buildQuery(status: string, page: number): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

const STATUS_BADGE: Record<IuranStatus, string> = {
  lunas: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  menunggu: "bg-sky-50 text-sky-700 ring-sky-200",
  belum: "bg-amber-50 text-amber-700 ring-amber-200",
};

const NOTICE_META: Record<
  string,
  { message: string; className: string; icon: IconName }
> = {
  submitted: {
    message:
      "Pembayaran berhasil diajukan. Pengurus RT/RW akan memverifikasi bukti pembayaran Anda.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "submitted-canceled": {
    message: "Pengajuan pembayaran dibatalkan. Anda dapat memilih metode lain.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  "submit-cancel-error": {
    message:
      "Pengajuan tidak dapat dibatalkan karena sudah diverifikasi pengurus.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
  "already-submitted": {
    message:
      "Pembayaran untuk tagihan ini sudah diajukan dan sedang menunggu verifikasi.",
    className: "border-sky-200 bg-sky-50 text-sky-800",
    icon: "clock",
  },
};

export default async function WargaIuranPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession();

  if (session.role !== "warga") {
    redirect(`/dashboard/${session.role}`);
  }

  const sp = await searchParams;
  const statusFilter = first(sp.status);
  const status = isIuranStatus(statusFilter) ? statusFilter : "";
  const requestedPage = Math.max(1, Number(first(sp.page)) || 1);
  const notice = NOTICE_META[first(sp.notice)];

  const warga = await getWargaByUserId(session.id);
  const baseHref = "/dashboard/warga/iuran";

  if (!warga) {
    return (
      <div className="space-y-6">
        <FadeIn>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
              Iuran Saya
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Tagihan Iuran
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Lengkapi profil kependudukan Anda agar tagihan iuran dapat
              ditampilkan.
            </p>
          </div>
        </FadeIn>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <div className="flex items-start gap-2.5">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Profil warga belum terhubung.</p>
              <p className="mt-1 leading-relaxed">
                Lengkapi data kependudukan melalui menu Profil Saya. Setelah
                tersimpan, tagihan iuran dari pengurus RT/RW akan muncul di sini.
              </p>
              <Link
                href="/dashboard/warga/profil"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
              >
                <Icon name="user" className="h-3.5 w-3.5" />
                Isi Profil Saya
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let data: {
    rows: IuranTagihanRecord[];
    total: number;
    page: number;
    totalPages: number;
  } | null = null;
  let stats: Awaited<ReturnType<typeof getWargaIuranStats>> | null = null;
  let loadError = false;

  try {
    const [list, summary] = await Promise.all([
      listIuranTagihanForWarga(warga.id, { status, page: requestedPage }),
      getWargaIuranStats(warga.id),
    ]);
    data = list;
    stats = summary;
  } catch (error) {
    console.error("Gagal memuat iuran warga:", error);
    loadError = true;
  }

  const rows = data?.rows ?? [];
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const statItems = [
    {
      label: "Total tagihan",
      value: String(stats?.total ?? 0),
      icon: "receipt" as const,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Sudah dibayar",
      value: String(stats?.paid ?? 0),
      icon: "check" as const,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Menunggu verifikasi",
      value: String(stats?.pending ?? 0),
      icon: "clock" as const,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Belum dibayar",
      value: String(stats?.unpaid ?? 0),
      icon: "clock" as const,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total tunggakan",
      value: formatRupiah(stats?.unpaidAmount ?? 0),
      icon: "wallet" as const,
      tone: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
              Iuran Saya
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Tagihan & Kuitansi Iuran
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Bayar iuran dengan tunai, transfer, atau QRIS. Setelah pengurus
              memverifikasi, kuitansi dapat diunduh di sini.
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <Icon name="home" className="h-3 w-3" />
              RW {warga.rw} / RT {warga.rt}
            </span>
          </div>

          <Link
            href="/dashboard/warga/profil"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Icon name="user" className="h-4 w-4" />
            Profil Saya
          </Link>
        </div>
      </FadeIn>

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
          <p className="font-semibold">Data iuran belum dapat dimuat.</p>
          <p className="mt-1 leading-relaxed">
            Pastikan database aktif dan tabel iuran sudah dibuat oleh pengurus.
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

          <FadeIn y={8}>
            <div className="flex flex-wrap gap-2">
              <Link
                href={baseHref}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  status === ""
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Semua
              </Link>
              <Link
                href={`${baseHref}?status=belum`}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  status === "belum"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Belum dibayar
              </Link>
              <Link
                href={`${baseHref}?status=menunggu`}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  status === "menunggu"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Menunggu verifikasi
              </Link>
              <Link
                href={`${baseHref}?status=lunas`}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  status === "lunas"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Lunas
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Daftar Tagihan
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {total} tagihan untuk {warga.name}.
                  </p>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200">
                    <Icon name="receipt" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">
                    Belum ada tagihan
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    Tagihan iuran akan muncul di sini setelah pengurus RT/RW
                    membuatnya untuk wilayah Anda.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Iuran</th>
                          <th className="px-4 py-3 font-semibold">Periode</th>
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
                          const pending = item.status === "menunggu";

                          return (
                            <tr
                              key={item.id}
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              <td className="px-5 py-3.5">
                                <p className="font-semibold text-slate-900">
                                  {item.jenis_name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {item.jenis_period === "bulanan"
                                    ? "Iuran bulanan"
                                    : "Iuran sekali"}
                                </p>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-600">
                                {formatPeriode(item.periode)}
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
                                    item.status === "lunas"
                                      ? STATUS_BADGE.lunas
                                      : pending
                                        ? STATUS_BADGE.menunggu
                                        : overdue
                                          ? "bg-rose-50 text-rose-700 ring-rose-200"
                                          : STATUS_BADGE.belum
                                  }`}
                                >
                                  {item.status === "lunas"
                                    ? "Lunas"
                                    : pending
                                      ? "Menunggu verifikasi"
                                      : overdue
                                        ? "Tunggakan"
                                        : "Belum dibayar"}
                                </span>
                                {item.status === "lunas" && item.paid_at && (
                                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                                    {formatIuranDateTime(item.paid_at)}
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
                              <td className="px-5 py-3.5 text-right">
                                {item.status === "lunas" ? (
                                  <Link
                                    href={`${baseHref}/${item.id}/kuitansi`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                  >
                                    <Icon
                                      name="receipt"
                                      className="h-3.5 w-3.5"
                                    />
                                    Kuitansi
                                  </Link>
                                ) : pending ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="text-[11px] font-medium text-sky-600">
                                      Menunggu
                                    </span>
                                    <ConfirmActionButton
                                      action={cancelSubmissionAction}
                                      id={item.id}
                                      icon="x"
                                      title="Batalkan pengajuan pembayaran?"
                                      description={`Pengajuan ${IURAN_PAYMENT_METHOD_LABELS[item.payment_method ?? "cash"]} untuk ${item.jenis_name} akan dibatalkan dan bukti pembayaran dihapus.`}
                                      confirmLabel="Batalkan"
                                      triggerLabel="Batalkan pengajuan"
                                    />
                                  </div>
                                ) : (
                                  <Link
                                    href={`${baseHref}/${item.id}/bayar`}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-amber-500/20 transition-colors hover:bg-amber-600"
                                  >
                                    <Icon name="wallet" className="h-3.5 w-3.5" />
                                    Bayar
                                  </Link>
                                )}
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
                        href={`${baseHref}${buildQuery(status, page - 1)}`}
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
                        href={`${baseHref}${buildQuery(status, page + 1)}`}
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
