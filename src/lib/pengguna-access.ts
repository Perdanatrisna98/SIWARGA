import { redirect } from "next/navigation";
import { requireSession } from "./auth";

/** Manajemen pengguna hanya untuk Administrator. */
export async function requireUserManager(roleParam: string) {
  const session = await requireSession();

  if (session.role !== "admin" || roleParam !== "admin") {
    redirect(`/dashboard/${session.role}`);
  }

  return session;
}
