"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { isAnonymousSeoPath } from "@/lib/public-routes";

const AuthenticatedRuntimeShell = dynamic(
  () => import("@/components/AuthenticatedRuntimeShell").then((m) => m.AuthenticatedRuntimeShell),
);

function PublicSeoHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = [
    { href: "/businesses", label: "Browse Businesses" },
    { href: "/categories", label: "Trade Guides" },
    { href: "/support", label: "Support" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 z-50 h-[72px] w-full border-b border-gray-100 bg-white/90 backdrop-blur-md md:h-[100px]">
      <div className="container mx-auto flex h-full items-center justify-between gap-4 px-4">
        <Link href="/" prefetch={false} className="flex shrink-0 items-center gap-2">
          <Logo size="lg" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="px-3 py-2 text-base font-bold text-zinc-700 transition-colors hover:text-orange-600"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            prefetch={false}
            className="ml-2 px-3 py-2 text-base font-bold text-zinc-700 transition-colors hover:text-zinc-900"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            prefetch={false}
            className="rounded-full bg-orange-600 px-6 py-2.5 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-700"
          >
            Sign Up
          </Link>
        </nav>

        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors hover:bg-zinc-100 md:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[45] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[85vw] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-zinc-100 px-5">
              <Link href="/" prefetch={false} onClick={() => setMobileMenuOpen(false)}>
                <Logo size="sm" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
              {[...links, { href: "/local", label: "Directory" }].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex rounded-xl px-4 py-4 text-lg font-bold text-zinc-700 transition-colors hover:bg-orange-50 hover:text-[#FF6600]"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="shrink-0 space-y-2 border-t border-zinc-100 p-4">
              <Link
                href="/login"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl border-2 border-zinc-200 text-[17px] font-black text-zinc-700 transition-colors hover:border-zinc-300"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#FF6600] text-[17px] font-black text-white transition-colors hover:bg-[#E65C00]"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function RuntimeShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isSeoRoute = isAnonymousSeoPath(pathname);
  if (isSeoRoute) {
    return (
      <>
        <PublicSeoHeader />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        {footer}
      </>
    );
  }

  return <AuthenticatedRuntimeShell footer={footer}>{children}</AuthenticatedRuntimeShell>;
}
