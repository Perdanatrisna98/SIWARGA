"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "./icons";

type PasswordInputProps = {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
};

export function PasswordInput({
  id = "password",
  name = "password",
  label = "Password",
  placeholder = "Masukkan password Anda",
  autoComplete = "current-password",
  minLength,
  required = true,
}: PasswordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const reduce = useReducedMotion();

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // 1. Update state React (untuk ikon)
    setShowPassword((value) => !value);

    // 2. Langsung ubah type elemen lewat ref (pastikan berfungsi meski state gagal)
    const input = inputRef.current;
    if (input) {
      input.type = input.type === "password" ? "text" : "password";
      input.focus();
    }
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <Icon
          name="lock"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />

        <motion.button
          type="button"
          onClick={toggle}
          aria-label={
            showPassword ? "Sembunyikan password" : "Tampilkan password"
          }
          aria-pressed={showPassword}
          aria-controls={id}
          title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          whileTap={reduce ? undefined : { scale: 0.88 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={showPassword ? "eye-off" : "eye"}
              initial={reduce ? false : { opacity: 0, scale: 0.6, rotate: -25 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.6, rotate: 25 }}
              transition={{ duration: 0.16 }}
              className="grid place-items-center"
            >
              <Icon
                name={showPassword ? "eyeOff" : "eye"}
                className="h-4 w-4"
              />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}