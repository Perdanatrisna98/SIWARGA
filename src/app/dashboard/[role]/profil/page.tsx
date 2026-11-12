import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { FadeIn, PressableButton, Stagger, StaggerItem } from "@/components/motion";
import { WargaForm } from "@/components/warga-form";
import { requestWargaEditAction, submitWargaProfileAction } from "@/lib/actions/warga-profile";
import { requireSession } from "@/lib/auth";
import { getWargaByUserId } from "@/lib/warga";
import {
  FAMILY_RELATION_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  WARGA_STATUS_LABELS,
  calculateAge,
  formatWargaDate,
  type WargaRecord,
} from "@/lib/warga-types";

export const metadata: Metadata = {
  title: "Profil Saya",
};

type SearchParams = Promise<{
  notice?: string | string[];
}>;

const NOTICE_META: Record<
  string,
  { message: string; className: string; icon: IconName }
> = {
  saved: {
    message:
      "Data Anda berhasil disimpan dan sekarang terkunci. Jika ada kesalahan, ajukan permintaan perubahan agar RT/RW dapat meninjaunya.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "check",
  },
  requested: {
    message:
      "Permintaan perubahan sudah dikirim. RT/RW akan meninjau dan memperbarui data Anda jika diperlukan.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "clock",
  },
  "request-error": {
    message:
      "Permintaan perubahan gagal dikirim. Silakan coba lagi atau hubungi RT/RW secara langsung.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "info",
  },
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function Detail({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">
        {value || "-"}
      </dd>
    </div>
  );
}

export default async function ProfilWargaPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: SearchParams;
}) {
  const { role } = await params;
  const session = await requireSession();

  if (session.role !== "warga" || role !== "warga") {
    redirect(`/dashboard/${session.role}`);
  }

  const sp = await searchParams;
  const notice = NOTICE_META[first(sp.notice)];

  let warga: WargaRecord | null = null;
  let loadError = false;

  try {
    warga = await getWargaByUserId(session.id);
  } catch (error) {
    console.error("Gagal memuat profil warga:", error);
    loadError = true;
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Profil Saya
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Data Kependudukan Saya
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Lengkapi data diri Anda sekali saja. Setelah tersimpan, data akan
              dikunci dan perubahan hanya dapat dilakukan oleh RT/RW.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
              warga
                ? "bg-slate-100 text-slate-600 ring-slate-200"
                : "bg-blue-50 text-blue-700 ring-blue-200"
            }`}
          >
            <Icon
              name={warga ? "lock" : "pencil"}
              className="h-3.5 w-3.5"
            />
            {warga ? "Data terkunci" : "Sekali isi"}
          </span>
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
          <p className="font-semibold">Profil belum dapat dimuat.</p>
          <p className="mt-1 leading-relaxed">
            Pastikan database aktif, lalu jalankan{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px]">
              npm run db:warga
            </code>{" "}
            untuk menyiapkan kolom profil warga.
          </p>
        </div>
      ) : warga ? (
        <>
          <FadeIn y={8}>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                <Icon name="lock" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Data Anda sudah tersimpan dan terkunci
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Warga hanya dapat mengisi data satu kali. Jika ada data yang
                  salah, ajukan permintaan perubahan atau hubungi RT/RW wilayah
                  Anda untuk mengeditnya.
                </p>
              </div>
            </div>
          </FadeIn>

          <Stagger className="grid gap-5 lg:grid-cols-2">
            <StaggerItem>
              <section className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon name="user" className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Identitas
                  </h2>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail
                    label="Nama Lengkap"
                    value={warga.name}
                    className="sm:col-span-2"
                  />
                  <Detail label="NIK" value={warga.nik} />
                  <Detail label="Nomor KK" value={warga.kk} />
                  <Detail
                    label="Jenis Kelamin"
                    value={GENDER_LABELS[warga.gender]}
                  />
                  <Detail
                    label="Tempat, Tanggal Lahir"
                    value={`${warga.birth_place}, ${formatWargaDate(
                      warga.birth_date,
                    )}`}
                  />
                  <Detail
                    label="Usia"
                    value={`${calculateAge(warga.birth_date)} tahun`}
                  />
                  <Detail label="Agama" value={warga.religion} />
                  <Detail
                    label="Status Perkawinan"
                    value={MARITAL_STATUS_LABELS[warga.marital_status]}
                  />
                  <Detail
                    label="Hubungan Keluarga"
                    value={FAMILY_RELATION_LABELS[warga.family_relation]}
                  />
                </dl>
              </section>
            </StaggerItem>

            <StaggerItem>
              <section className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon name="home" className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Domisili & Kontak
                  </h2>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail
                    label="Alamat Lengkap"
                    value={warga.address}
                    className="sm:col-span-2"
                  />
                  <Detail label="RT" value={warga.rt} />
                  <Detail label="RW" value={warga.rw} />
                  <Detail label="Nomor HP" value={warga.phone} />
                  <Detail label="Pendidikan" value={warga.education} />
                  <Detail
                    label="Pekerjaan"
                    value={warga.occupation}
                    className="sm:col-span-2"
                  />
                  <Detail
                    label="Status Kependudukan"
                    value={
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                        {WARGA_STATUS_LABELS[warga.status]}
                      </span>
                    }
                  />
                </dl>
              </section>
            </StaggerItem>
          </Stagger>

          <FadeIn delay={0.12}>
            {warga.edit_requested_at ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">
                    Permintaan perubahan sudah dikirim
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Diajukan pada{" "}
                    {formatWargaDate(warga.edit_requested_at)}. RT/RW akan
                    meninjau data Anda dan melakukan perubahan jika diperlukan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Ada data yang perlu diperbaiki?
                  </p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                    Kirim permintaan perubahan agar RT/RW dapat meninjau dan
                    mengedit data Anda. Warga tidak dapat mengedit data sendiri
                    setelah pengisian pertama.
                  </p>
                </div>
                <form action={requestWargaEditAction} className="shrink-0">
                  <PressableButton
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 sm:w-auto"
                  >
                    <Icon name="pencil" className="h-4 w-4" />
                    Minta Perubahan Data
                  </PressableButton>
                </form>
              </div>
            )}
          </FadeIn>
        </>
      ) : (
        <>
          <FadeIn y={8}>
            <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Isi data dengan teliti</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Data hanya dapat diisi satu kali. Pastikan NIK, tanggal lahir,
                  alamat, dan RT/RW sudah benar sebelum menyimpan. Setelah
                  tersimpan, perubahan hanya dapat dilakukan oleh RT/RW.
                </p>
              </div>
            </div>
          </FadeIn>

          <WargaForm
            mode="create"
            actionOverride={submitWargaProfileAction}
            showStatus={false}
            submitLabel="Simpan Data Saya"
          />
        </>
      )}
    </div>
  );
}
