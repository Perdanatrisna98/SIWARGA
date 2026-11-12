"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
  exact?: boolean;
};

export function NavLink({
  href,
  className = "",
  activeClassName = "",
  children,
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : ""}`.trim()}
    >
      {children}
    </Link>
  );
}
