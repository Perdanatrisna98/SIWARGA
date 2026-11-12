import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icons";
import {
  FadeIn,
  FloatingBlob,
  PulseDot,
  Stagger,
  StaggerItem,
} from "@/components/motion";
import { requireSession } from "@/lib/auth";
import { isRole, ROLE_META } from "@/lib/roles";

export default async function RoleDashboardPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const session = await requireSession();
  const { role } = await params;

  if (!isRole(role) || role !== session.role) {
    redirect(`/dashboard/${session.role}`);
  }

  const meta = ROLE_META[session.role];
  const firstName = session.name.trim().split(/\s+/)[0] || session.name;
  const initial = session.name.trim().charAt(0).toUpperCase() || "S";
  const wilayahLabel =
    session.role === "admin"
      ? "Semua wilayah"
      : [
          session.rw ? `RW ${session.rw}` : null,
          session.rt ? `RT ${session.rt}` : null,
        ]
          .filter(Boolean)
          .join(" / ") || "Belum diatur";
  const activeModules = meta.modules.filter((module) => module.href).length;
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <FadeIn>
        <section
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${meta.gradient} p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8`}
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <FloatingBlob className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <FloatingBlob
              className="absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-white/5 blur-xl"
              delay={1.4}
              duration={11}
            />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur">
              <Icon name={meta.icon} className="h-3.5 w-3.5" />
              {meta.label}
            </span>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight break-words sm:text-3xl">
              Selamat datang, {firstName}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              {meta.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" className="h-3.5 w-3.5" />
                {today}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
              <span className="inline-flex items-center gap-1.5">
                <Icon name="sparkles" className="h-3.5 w-3.5" />
                {meta.greeting}
              </span>
            </div>
          </div>
        </section>
      </FadeIn>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Modul {meta.label}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Akses cepat ke modul SIWARGA sesuai hak akses Anda.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {activeModules > 0
                ? `${activeModules} modul aktif`
                : "Segera hadir"}
            </span>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2">
            {meta.modules.map((module) => {
              const cardBody = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${meta.soft}`}
                    >
                      <Icon name={module.icon} className="h-5 w-5" />
                    </span>
                    {module.href ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-600">
                        Buka
                        <Icon name="arrowRight" className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Segera
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {module.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {module.description}
                  </p>
                </>
              );

              return (
                <StaggerItem key={module.title} lift className="h-full">
                  {module.href ? (
                    <Link
                      href={module.href}
                      className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15"
                    >
                      {cardBody}
                    </Link>
                  ) : (
                    <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
                      {cardBody}
                    </div>
                  )}
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        <aside className="space-y-5">
          <FadeIn delay={0.08}>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Informasi akun
              </h2>

              <div className="mt-4 flex flex-col items-center border-b border-slate-100 pb-5 text-center">
                <div
                  className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br ${meta.gradient} text-lg font-bold text-white shadow-lg shadow-slate-900/10`}
                >
                  {initial}
                </div>
                <p className="mt-3 max-w-full truncate text-sm font-semibold text-slate-900">
                  {session.name}
                </p>
                <p className="max-w-full truncate text-xs text-slate-500">
                  {session.email}
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${meta.chip}`}
                >
                  <Icon name={meta.icon} className="h-3 w-3" />
                  {meta.label}
                </span>
              </div>

              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Status akun</dt>
                  <dd className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                    <PulseDot className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Aktif
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Hak akses</dt>
                  <dd className="font-semibold text-slate-700">{meta.shortLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Wilayah</dt>
                  <dd className="text-right font-semibold text-slate-700">
                    {wilayahLabel}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Sistem</dt>
                  <dd className="font-semibold text-slate-700">SIWARGA</dd>
                </div>
              </dl>
            </section>
          </FadeIn>

          <FadeIn delay={0.18}>
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-2.5">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    Sesi Anda aman
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">
                    Gunakan tombol <span className="font-semibold">Keluar</span>{" "}
                    setelah selesai agar akun tetap terlindungi.
                  </p>
                </div>
              </div>
            </section>
          </FadeIn>
        </aside>
      </div>

      <FadeIn delay={0.12}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Aktivitas terbaru
            </h2>
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Belum ada data
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
              <Icon name="clock" className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              Belum ada aktivitas
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Ringkasan aktivitas dan data terbaru akan tampil di sini setelah
              modul SIWARGA mulai digunakan.
            </p>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
