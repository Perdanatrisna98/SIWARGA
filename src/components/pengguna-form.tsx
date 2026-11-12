"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  createPenggunaAction,
  updatePenggunaAction,
  type PenggunaFormState,
} from "@/lib/actions/pengguna";
import type { PenggunaRecord } from "@/lib/pengguna-types";
import { ROLE_META, ROLES, type Role } from "@/lib/roles";
import { Icon } from "./icons";
import {
  PressableButton,
  Spinner,
  fadeUp,
  staggerContainer,
} from "./motion";
import { PasswordInput } from "./password-input";

type PenggunaFormProps = {
  mode: "create" | "edit";
  pengguna?: PenggunaRecord;
  cancelHref: string;
  isSelf?: boolean;
};

const initialState: PenggunaFormState = {};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass =
  "mb-1.5 block text-[13px] font-semibold text-slate-700";
const hintClass = "mt-1 text-[11px] text-slate-400";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </motion.section>
  );
}

export function PenggunaForm({
  mode,
  pengguna,
  cancelHref,
  isSelf = false,
}: PenggunaFormProps) {
  const action =
    mode === "create" ? createPenggunaAction : updatePenggunaAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const reduce = useReducedMotion();
  const [role, setRole] = useState<Role>(pengguna?.role ?? "warga");

  return (
    <motion.form
      action={formAction}
      className="space-y-5"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer(0.06, 0.02)}
    >
      {mode === "edit" && pengguna && (
        <input type="hidden" name="id" value={pengguna.id} />
      )}

      <AnimatePresence initial={false}>
        {state.error && (
          <motion.div
            key="error"
            role="alert"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <FormSection
        title="Informasi Akun"
        description="Data utama untuk masuk ke SIWARGA dan hak akses pengguna."
      >
        <div>
          <label htmlFor="name" className={labelClass}>
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={100}
            autoComplete="name"
            defaultValue={pengguna?.name ?? ""}
            placeholder="Contoh: Ahmad Fauzi"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={150}
            autoComplete="email"
            defaultValue={pengguna?.email ?? ""}
            placeholder="nama@siwarga.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="role" className={labelClass}>
            Role <span className="text-rose-500">*</span>
          </label>
          <select
            id="role"
            name={isSelf ? undefined : "role"}
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            disabled={isSelf}
            className={`${inputClass} ${
              isSelf
                ? "cursor-not-allowed bg-slate-50 text-slate-500"
                : ""
            }`}
          >
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_META[value].label}
              </option>
            ))}
          </select>
          {isSelf && (
            <>
              <input type="hidden" name="role" value={role} />
              <p className={hintClass}>
                Role akun sendiri tidak dapat diubah.
              </p>
            </>
          )}
        </div>

        <div>
          <PasswordInput
            id="password"
            name="password"
            label={
              mode === "create"
                ? "Password"
                : "Password Baru (Opsional)"
            }
            placeholder={
              mode === "create"
                ? "Minimal 6 karakter"
                : "Kosongkan jika tidak diubah"
            }
            autoComplete="new-password"
            minLength={6}
            required={mode === "create"}
          />
          <p className={hintClass}>
            {mode === "create"
              ? "Minimal 6 karakter."
              : "Isi hanya jika ingin mengganti password."}
          </p>
        </div>
      </FormSection>

      {role === "admin" ? (
        <motion.div
          variants={fadeUp}
          className="flex items-start gap-2.5 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-800"
        >
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Administrator memiliki akses ke seluruh wilayah, sehingga tidak
            memerlukan pengaturan RW/RT.
          </p>
        </motion.div>
      ) : (
        <FormSection
          title="Wilayah"
          description="Wilayah menentukan data warga yang dapat diakses oleh akun ini."
        >
          <div>
            <label htmlFor="rw" className={labelClass}>
              RW{" "}
              {role === "rw" || role === "rt" ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-[11px] font-normal text-slate-400">
                  (opsional)
                </span>
              )}
            </label>
            <input
              id="rw"
              name="rw"
              type="text"
              required={role === "rw" || role === "rt"}
              inputMode="numeric"
              pattern="\d{1,3}"
              maxLength={3}
              defaultValue={pengguna?.rw ?? ""}
              placeholder="001"
              className={inputClass}
            />
          </div>

          {role !== "rw" && (
            <div>
              <label htmlFor="rt" className={labelClass}>
                RT{" "}
                {role === "rt" ? (
                  <span className="text-rose-500">*</span>
                ) : (
                  <span className="text-[11px] font-normal text-slate-400">
                    (opsional)
                  </span>
                )}
              </label>
              <input
                id="rt"
                name="rt"
                type="text"
                required={role === "rt"}
                inputMode="numeric"
                pattern="\d{1,3}"
                maxLength={3}
                defaultValue={pengguna?.rt ?? ""}
                placeholder="001"
                className={inputClass}
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <p className={hintClass}>
              {role === "rt"
                ? "Pengurus RT hanya dapat mengakses data warga pada RT/RW ini."
                : role === "rw"
                  ? "Pengurus RW dapat mengakses seluruh RT di RW ini."
                  : "Wilayah warga bersifat opsional dan dapat diisi kemudian."}
            </p>
          </div>
        </FormSection>
      )}

      <motion.div
        variants={fadeUp}
        className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
      >
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
        >
          Batal
        </Link>
        <PressableButton
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
              Menyimpan...
            </>
          ) : (
            <>
              <Icon name="check" className="h-4 w-4" />
              {mode === "create" ? "Simpan Pengguna" : "Simpan Perubahan"}
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
