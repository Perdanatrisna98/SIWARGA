import Image from "next/image";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { FadeIn } from "@/components/motion";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect(`/dashboard/${session.role}`);
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <aside className="relative hidden min-h-screen overflow-hidden lg:block">
        <Image
          src="/image/banner_login_register.png"
          alt="Suasana lingkungan perumahan warga"
          fill
          priority
          sizes="50vw"
          className="object-cover object-left"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <FadeIn delay={0.15}>
            <h2 className="max-w-md text-3xl font-semibold tracking-tight text-white xl:text-4xl">
              Layanan Digital Warga
            </h2>
          </FadeIn>
          <FadeIn delay={0.28}>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
              Akses pengurusan surat digital, pemantauan CCTV lingkungan, hingga
              transparansi iuran warga dalam satu genggaman.
            </p>
          </FadeIn>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <FadeIn className="mb-7" y={10}>
            <Logo subtitle={false} large />
          </FadeIn>
          {children}
        </div>
      </main>
    </div>
  );
}
