import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Mail, Search, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Request Listing Removal | TradeRefer",
  description:
    "Request review or removal of a TradeRefer business listing. Business owners can verify ownership, request changes, or ask for a listing to be removed.",
  alternates: { canonical: "https://traderefer.au/remove" },
  robots: { index: false, follow: true },
};

export default function RemoveListingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 pt-24 pb-16 md:pt-32">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black uppercase tracking-widest text-orange-700">
            <ShieldCheck className="h-4 w-4" />
            Listing review
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 md:text-6xl">
            Request a business listing removal
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-zinc-600">
            If your business appears on TradeRefer and you want it updated, claimed, hidden, or removed, use the options below. We verify requests before changing listings so customers are not misled.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-10 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-zinc-950">Find your listing</h2>
          <p className="mt-3 text-base font-medium leading-relaxed text-zinc-600">
            Search the directory and open your business profile. Profile pages include a request removal action tied to the exact listing.
          </p>
          <Link
            href="/businesses"
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-zinc-950 px-5 font-black text-white transition-colors hover:bg-zinc-800"
          >
            Search directory <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-zinc-950">Claim or verify</h2>
          <p className="mt-3 text-base font-medium leading-relaxed text-zinc-600">
            If you own the business, claiming the profile is usually faster than removal because our team can verify and update the listing.
          </p>
          <Link
            href="/claim"
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-zinc-200 px-5 font-black text-zinc-800 transition-colors hover:border-orange-300 hover:text-orange-600"
          >
            Claim profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-zinc-950">Manual help</h2>
          <p className="mt-3 text-base font-medium leading-relaxed text-zinc-600">
            If you cannot find the profile, contact support with the business name, suburb, state, website, and why it should be removed.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-zinc-200 px-5 font-black text-zinc-800 transition-colors hover:border-orange-300 hover:text-orange-600"
          >
            Contact support <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
