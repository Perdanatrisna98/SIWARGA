"use client";

import { useActionState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { Icon } from "@/components/icons";
import { PasswordInput } from "@/components/password-input";
import {
  PressableButton,
  Spinner,
  fadeUp,
  staggerContainer,
} from "@/components/motion";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  const reduce = useReducedMotion();

  return (
    <motion.form
      action={formAction}
      className="mt-7 space-y-4"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={staggerContainer(0.07, 0.08)}
    >
      <AnimatePresence initial={false}>
        {state.error && (
          <motion.div
            key="error"
            role="alert"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp}>
        <label
          htmlFor="name"
          className="mb-1.5 block text-[13px] font-semibold text-slate-700"
        >
          Nama Lengkap
        </label>
        <div className="relative">
          <Icon
            name="user"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={100}
            autoComplete="name"
            placeholder="Masukkan Nama Lengkap"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <label
          htmlFor="email"
          className="mb-1.5 block text-[13px] font-semibold text-slate-700"
        >
          Email
        </label>
        <div className="relative">
          <Icon
            name="mail"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Masukkan Email"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <PasswordInput autoComplete="new-password" minLength={6} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <PressableButton
          type="submit"
          disabled={pending}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
              Mendaftarkan...
            </>
          ) : (
            <>
              Daftar Sekarang
              <Icon
                name="arrowRight"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </PressableButton>
      </motion.div>
    </motion.form>
  );
}
