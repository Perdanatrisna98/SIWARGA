import { redirect } from "next/navigation";
import { requireSession } from "./auth";
import { getWargaAccess, type WargaAccess } from "./warga-access";
import type { Session } from "./session";

export type KeuanganAccess = WargaAccess;

/**
 * Memastikan pengguna login, role pada URL sesuai, dan bukan warga.
 * Warga tidak memiliki akses ke pengelolaan keuangan/iuran internal.
 */
export async function requireKeuanganManager(roleParam: string): Promise<{
  session: Session;
  access: KeuanganAccess;
}> {
  const session = await requireSession();

  if (session.role !== roleParam) {
    redirect(`/dashboard/${session.role}`);
  }

  if (session.role === "warga") {
    redirect("/dashboard/warga/iuran");
  }

  return { session, access: getWargaAccess(session) };
}
