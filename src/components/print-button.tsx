"use client";

import { Icon } from "./icons";
import { PressableButton } from "./motion";

export function PrintButton({ label = "Cetak" }: { label?: string }) {
  return (
    <PressableButton
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 print:hidden"
    >
      <Icon name="printer" className="h-4 w-4" />
      {label}
    </PressableButton>
  );
}
