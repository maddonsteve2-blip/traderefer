import { Button } from "@/components/ui/button";
import { Shield, Bell, Handshake, ChevronRight, TrendingUp, Users, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";


export default function Home() {
  return (
    <main className="flex-1 pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-20 lg:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 font-display">
              The smartest way to scale your <span className="text-orange-500">trade business</span>
            </h1>
            <p className="text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Get verified, high-quality referrals from trusted sources. No upfront fees—you only pay when you decide to unlock a lead.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignedOut>
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 py-6 h-auto text-lg w-full sm:w-auto">
                  <Link href="/register?type=business">List My Business — Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 py-6 h-auto text-lg w-full sm:w-auto border-zinc-200 hover:bg-zinc-50">
                  <Link href="/register?type=referrer">Earn By Referring</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-12 py-6 h-auto text-lg w-full sm:w-auto">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-orange-100/30 blur-3xl -z-10 rounded-full" />
      </section>

      {/* Stats Bar */}
      <section className="bg-zinc-900 py-8 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-700">
            <div className="py-4 md:py-0">
              <div className="text-3xl font-bold text-orange-400 mb-1">$73B</div>
              <div className="text-sm text-zinc-400">Residential trades market in AU</div>
            </div>
            <div className="py-4 md:py-0">
              <div className="text-3xl font-bold text-orange-400 mb-1">250,000+</div>
              <div className="text-sm text-zinc-400">Trade businesses in Australia</div>
            </div>
            <div className="py-4 md:py-0">
              <div className="text-3xl font-bold text-orange-400 mb-1">70%</div>
              <div className="text-sm text-zinc-400">Say word-of-mouth is their best source</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">How It Works</h2>
            <div className="w-20 h-1 bg-orange-500 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="text-orange-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Share Your Link</h3>
              <p className="text-zinc-600">
                Someone who knows your work shares your personal link with their network.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bell className="text-orange-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Notified</h3>
              <p className="text-zinc-600">
                A verified lead arrives instantly with their contact details and job description.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Handshake className="text-orange-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Confirm & Win</h3>
              <p className="text-zinc-600">
                You meet, use our PIN system to confirm the visit, and you both win.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Referrer Section */}
      <section className="py-24 bg-white overflow-hidden relative">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-6">
              Turn your tradie recommendations into cash
            </h2>
            <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
              Know a good plumber? An electrician everyone should use?
              Share your personal link. Earn $2.10–$14 every time your lead gets unlocked.
            </p>
            <Button asChild size="lg" className="bg-zinc-900 hover:bg-black text-white rounded-full px-8 py-6 h-auto text-lg mb-6">
              <Link href="/register?type=referrer">Start Earning — It's Free</Link>
            </Button>
            <div className="flex items-center gap-2 text-orange-600 font-medium italic">
              <TrendingUp className="w-4 h-4" />
              Top referrers earn $200–$600/month
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="bg-zinc-100 rounded-3xl p-4 rotate-3 shadow-xl">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10">
                    <Logo size="sm" showText={false} />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 line-clamp-1">Wallet Balance</div>
                    <div className="text-base text-zinc-500 uppercase tracking-wider font-bold">Available to withdraw</div>
                  </div>
                  <div className="ml-auto text-2xl font-black text-orange-600 font-display">$428.50</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-sm font-medium text-zinc-700">Bob's Plumbing Referral</div>
                    <div className="text-sm font-bold text-green-600">+$12.50</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-sm font-medium text-zinc-700">Jane's Electrical Referral</div>
                    <div className="text-sm font-bold text-green-600">+$8.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
