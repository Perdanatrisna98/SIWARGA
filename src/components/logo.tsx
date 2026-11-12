import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  compact?: boolean;
  subtitle?: boolean;
  large?: boolean;
};

export function Logo({
  href = "/",
  compact = false,
  subtitle = true,
  large = false,
}: LogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <span className="flex items-center gap-2.5">
        <Image
          src="/image/logo.png"
          alt="Logo SIWARGA"
          width={36}
          height={36}
          priority
          className="h-9 w-9 shrink-0 object-contain"
        />
        <span className="min-w-0">
          <span
            className={
              large
                ? "block text-4xl font-bold leading-none tracking-tight text-blue-600"
                : "block text-[15px] font-bold leading-none tracking-[0.16em] text-slate-900"
            }
          >
            SIWARGA
          </span>
          {!compact && subtitle && (
            <span className="mt-1 block truncate text-[10px] font-medium leading-none text-slate-500">
              Sistem Informasi Administrasi Warga
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

export function LogoLight({
  compact = false,
  subtitle = true,
}: {
  compact?: boolean;
  subtitle?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white p-1.5 shadow-sm">
        <Image
          src="/image/logo.png"
          alt="Logo SIWARGA"
          width={32}
          height={32}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-none tracking-[0.16em] text-white">
          SIWARGA
        </span>
        {!compact && subtitle && (
          <span className="mt-1 block truncate text-[10px] font-medium leading-none text-slate-400">
            Sistem Informasi Administrasi Warga
          </span>
        )}
      </span>
    </span>
  );
}
