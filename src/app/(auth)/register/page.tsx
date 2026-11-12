import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/motion";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar",
};

export default function RegisterPage() {
  return (
    <div>
      <FadeIn>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
          Selamat Datang
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Silakan daftar untuk mengakses layanan warga.
        </p>
      </FadeIn>

      <RegisterForm />

      <FadeIn delay={0.35}>
        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah Punya Akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline"
          >
            Masuk di sini.
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
