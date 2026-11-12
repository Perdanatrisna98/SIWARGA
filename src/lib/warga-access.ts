import { redirect } from "next/navigation";
import { requireSession } from "./auth";
import type { Session } from "./session";

export type WargaAccess = {
  isAdmin: boolean;
  rw: string | null;
  rt: string | null;
  blocked: boolean;
};

/**
 * Menentukan batas wilayah yang boleh diakses berdasarkan role.
 * - Admin: seluruh wilayah.
 * - RW: hanya RW miliknya (semua RT di dalamnya).
 * - RT: hanya RT/RW miliknya.
 */
export function getWargaAccess(session: Session): WargaAccess {
  if (session.role === "admin") {
    return { isAdmin: true, rw: null, rt: null, blocked: false };
  }

  if (session.role === "rw") {
    return {
      isAdmin: false,
      rw: session.rw ? session.rw.padStart(3, "0") : null,
      rt: null,
      blocked: !session.rw,
    };
  }

  if (session.role === "rt") {
    return {
      isAdmin: false,
      rw: session.rw ? session.rw.padStart(3, "0") : null,
      rt: session.rt ? session.rt.padStart(3, "0") : null,
      blocked: !session.rw || !session.rt,
    };
  }

  return { isAdmin: false, rw: null, rt: null, blocked: true };
}

export function isWargaInScope(
  warga: { rw: string; rt: string },
  access: WargaAccess,
): boolean {
  if (access.blocked) return false;
  if (access.rw && warga.rw !== access.rw) return false;
  if (access.rt && warga.rt !== access.rt) return false;
  return true;
}

/**
 * Memastikan pengguna sudah login, role pada URL sesuai dengan sesi, dan
 * bukan warga biasa. Warga diarahkan ke dashboard profilnya.
 */
export async function requireWargaManager(roleParam: string) {
  const session = await requireSession();

  if (session.role !== roleParam) {
    redirect(`/dashboard/${session.role}`);
  }

  if (session.role === "warga") {
    redirect("/dashboard/warga");
  }

  return { session, access: getWargaAccess(session) };
}
