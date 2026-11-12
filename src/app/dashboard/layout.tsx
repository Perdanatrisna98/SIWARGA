import { logoutAction } from "@/lib/actions/auth";
import { requireSession } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { Logo, LogoLight } from "@/components/logo";
import { FadeIn, PressableButton } from "@/components/motion";
import { NavLink } from "@/components/nav-link";
import { ROLE_META } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const meta = ROLE_META[session.role];
  const initial = session.name.trim().charAt(0).toUpperCase() || "S";
  const dashboardHref = `/dashboard/${session.role}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-slate-950 px-4 py-6 lg:flex">
        <div className="px-1">
          <FadeIn y={8}>
            <LogoLight />
          </FadeIn>
        </div>

        <FadeIn className="mt-8 flex-1" delay={0.08}>
          <nav className="h-full space-y-1 overflow-y-auto pr-1">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Menu utama
            </p>

            <NavLink
              href={dashboardHref}
              exact
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              activeClassName="bg-white/10 text-white ring-1 ring-white/10"
            >
              <Icon name="grid" className="h-4 w-4 text-emerald-300" />
              Dashboard
            </NavLink>

            {meta.modules.map((module) =>
              module.href ? (
                <NavLink
                  key={module.title}
                  href={module.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                  activeClassName="bg-white/10 text-white ring-1 ring-white/10"
                >
                  <Icon
                    name={module.icon}
                    className="h-4 w-4 shrink-0 text-slate-500"
                  />
                  <span className="truncate">{module.title}</span>
                  <Icon
                    name="arrowRight"
                    className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-500"
                  />
                </NavLink>
              ) : (
                <div
                  key={module.title}
                  aria-disabled="true"
                  title="Segera hadir"
                  className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400"
                >
                  <Icon
                    name={module.icon}
                    className="h-4 w-4 shrink-0 text-slate-500"
                  />
                  <span className="truncate">{module.title}</span>
                  <span className="ml-auto rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                    Segera
                  </span>
                </div>
              ),
            )}
          </nav>
        </FadeIn>

        <FadeIn className="mt-4" delay={0.18}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${meta.gradient} text-sm font-bold text-white`}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {session.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {session.email}
                </p>
                {session.role !== "admin" && session.rw && (
                  <p className="truncate text-[10px] font-medium text-emerald-300/90">
                    {session.rt
                      ? `RW ${session.rw} / RT ${session.rt}`
                      : `RW ${session.rw}`}
                  </p>
                )}
              </div>
            </div>

            <form action={logoutAction} className="mt-3">
              <PressableButton
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Icon name="logout" className="h-3.5 w-3.5" />
                Keluar
              </PressableButton>
            </form>
          </div>
        </FadeIn>
      </aside>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden"
      >
        <FadeIn
          className="mx-auto flex w-full max-w-2xl items-stretch justify-around gap-0.5 px-2 pt-1.5 pb-[calc(0.375rem_+_env(safe-area-inset-bottom))]"
          y={16}
          duration={0.35}
        >
          <NavLink
            href={dashboardHref}
            exact
            className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-semibold text-slate-500 transition-colors"
            activeClassName="bg-blue-50 text-blue-600"
          >
            <Icon name="grid" className="h-5 w-5" />
            <span className="w-full truncate text-center">Dashboard</span>
          </NavLink>

          {meta.modules.map((module) =>
            module.href ? (
              <NavLink
                key={module.title}
                href={module.href}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-semibold text-slate-500 transition-colors"
                activeClassName="bg-blue-50 text-blue-600"
              >
                <Icon name={module.icon} className="h-5 w-5" />
                <span className="w-full truncate text-center">
                  {module.short}
                </span>
              </NavLink>
            ) : (
              <div
                key={module.title}
                aria-disabled="true"
                title={`${module.title} — segera hadir`}
                className="flex flex-1 cursor-default flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-medium text-slate-400"
              >
                <Icon name={module.icon} className="h-5 w-5" />
                <span className="w-full truncate text-center">
                  {module.short}
                </span>
              </div>
            ),
          )}

          <form action={logoutAction} className="flex flex-1">
            <PressableButton
              type="submit"
              className="flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Icon name="logout" className="h-5 w-5" />
              <span className="w-full truncate text-center">Keluar</span>
            </PressableButton>
          </form>
        </FadeIn>
      </nav>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <FadeIn
            className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
            y={-8}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <Logo href={dashboardHref} compact subtitle={false} />
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Dashboard
                </p>
                <p className="truncate text-sm font-semibold text-slate-800">
                  {meta.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span
                className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 md:inline-flex ${meta.chip}`}
              >
                <Icon name={meta.icon} className="h-3 w-3" />
                {meta.shortLabel}
              </span>

              <div className="hidden items-center gap-2 sm:flex">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${meta.gradient} text-xs font-bold text-white`}
                >
                  {initial}
                </div>
                <div className="hidden max-w-[160px] leading-tight xl:block">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {session.name}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {session.email}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
