"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { deletePenggunaAction } from "@/lib/actions/pengguna";
import { Icon } from "./icons";
import { EASE, PressableButton } from "./motion";

export function DeletePenggunaButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Hapus akun ${name}`}
        title="Hapus"
        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        <Icon name="trash" className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`delete-pengguna-title-${id}`}
              aria-describedby={`delete-pengguna-desc-${id}`}
              initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                  <Icon name="trash" className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id={`delete-pengguna-title-${id}`}
                    className="text-sm font-semibold text-slate-900"
                  >
                    Hapus akun pengguna?
                  </h2>
                  <p
                    id={`delete-pengguna-desc-${id}`}
                    className="mt-1 text-xs leading-relaxed text-slate-500"
                  >
                    Akun{" "}
                    <span className="font-semibold text-slate-700">{name}</span>{" "}
                    akan dihapus permanen dan tidak dapat digunakan lagi untuk
                    masuk.
                  </p>
                </div>
              </div>

              <form
                action={deletePenggunaAction}
                className="mt-5 flex items-center justify-end gap-2"
              >
                <input type="hidden" name="id" value={id} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>
                <PressableButton
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-rose-600/20 transition-colors hover:bg-rose-700"
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                  Hapus
                </PressableButton>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
