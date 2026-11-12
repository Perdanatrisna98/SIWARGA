import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/motion";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <div>
      <FadeIn>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
          Selamat Datang
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Silakan masuk untuk mengakses layanan warga.
        </p>
      </FadeIn>

      <LoginForm />

      <FadeIn delay={0.35}>
        <p className="mt-6 text-center text-sm text-slate-500">
          Belum Punya Akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline"
          >
            Daftar di sini.
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
