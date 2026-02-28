import { Button } from "@/components/ui/button";
import { Shield, Bell, Handshake, ChevronRight, TrendingUp, Users, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";


export default function Home() {
  return (
    <main className="flex-1 pt-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-24 lg:py-40">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-zinc-900 mb-10 font-display leading-[0.95]">
              The smartest way to scale your <span className="text-orange-500">trade business</span>
            </h1>
            <p className="text-2xl md:text-3xl text-zinc-600 mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
              Get verified, high-quality referrals from trusted sources. No upfront fees—you only pay when you decide to unlock a lead.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <SignedOut>
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-12 py-8 h-auto text-2xl w-full sm:w-auto font-black shadow-2xl shadow-orange-500/20">
                  <Link href="/register?type=business">List My Business — Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-12 py-8 h-auto text-2xl w-full sm:w-auto border-zinc-200 hover:bg-zinc-50 font-black">
                  <Link href="/register?type=referrer">Earn By Referring</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-16 py-8 h-auto text-2xl w-full sm:w-auto font-black shadow-2xl shadow-orange-500/20">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-6xl max-h-6xl bg-orange-100/30 blur-[120px] -z-10 rounded-full" />
      </section>

      {/* Stats Bar */}
      <section className="bg-zinc-900 py-12 text-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-700">
            <div className="py-8 md:py-0 scale-110">
              <div className="text-5xl font-black text-orange-400 mb-3">$73B</div>
              <div className="text-base text-zinc-300 font-bold uppercase tracking-widest">Residential Market in AU</div>
            </div>
            <div className="py-8 md:py-0 scale-110">
              <div className="text-5xl font-black text-orange-400 mb-3">250,000+</div>
              <div className="text-base text-zinc-300 font-bold uppercase tracking-widest">Trade Businesses in AU</div>
            </div>
            <div className="py-8 md:py-0 scale-110">
              <div className="text-5xl font-black text-orange-400 mb-3">70%</div>
              <div className="text-base text-zinc-300 font-bold uppercase tracking-widest">Word-of-Mouth Revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-zinc-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-zinc-900 mb-6 font-display tracking-tight">How It Works</h2>
            <div className="w-32 h-2 bg-orange-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Users, title: "Share Your Link", desc: "Someone who knows your work shares your personal link with their network." },
              { icon: Bell, title: "Get Notified", desc: "A verified lead arrives instantly with their contact details and job description." },
              { icon: Handshake, title: "Confirm & Win", desc: "You meet, use our PIN system to confirm the visit, and you both win." },
            ].map((step, i) => (
              <div key={i} className="bg-white p-12 rounded-[40px] border-2 border-zinc-100 shadow-sm text-center group hover:border-orange-500 hover:shadow-2xl transition-all duration-500">
                <div className="w-24 h-24 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-10 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                  <step.icon className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black mb-6 text-zinc-900">{step.title}</h3>
                <p className="text-xl text-zinc-600 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referrer Section */}
      <section className="py-40 bg-white overflow-hidden relative">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1">
            <h2 className="text-5xl md:text-7xl font-black text-zinc-900 mb-10 font-display leading-[1.05] tracking-tight">
              Turn your tradie recommendations into cash
            </h2>
            <p className="text-2xl text-zinc-600 mb-12 leading-relaxed font-medium max-w-2xl">
              Know a good plumber? An electrician everyone should use?
              Share your link. Earn <span className="text-orange-600 font-black">$2.10–$14.00</span> every time your lead is unlocked.
            </p>
            <Button asChild size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-12 py-8 h-auto text-2xl mb-10 font-black shadow-2xl shadow-zinc-900/10">
              <Link href="/register?type=referrer">Start Earning — It's Free</Link>
            </Button>
            <div className="flex items-center gap-3 text-orange-600 font-bold text-xl italic bg-orange-50 w-fit px-8 py-4 rounded-2xl border-2 border-orange-100">
              <TrendingUp className="w-6 h-6" />
              Top referrers earn $200–$600 per month
            </div>
          </div>

          <div className="flex-1 relative scale-110">
            <div className="bg-zinc-100 rounded-[48px] p-6 rotate-3 shadow-2xl border-4 border-zinc-200">
              <div className="bg-white rounded-[40px] p-10 shadow-sm border-2 border-white">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-16 h-16">
                    <Logo size="lg" showText={false} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-zinc-900 leading-none mb-1">Wallet Balance</div>
                    <div className="text-sm text-zinc-400 uppercase tracking-[0.2em] font-black">Available to withdraw</div>
                  </div>
                  <div className="ml-auto text-4xl font-black text-green-600 font-display">$428.50</div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Bob's Plumbing Referral", amount: "+$12.50" },
                    { name: "Jane's Electrical Referral", amount: "+$8.00" },
                    { name: "Mike's Landscaping", amount: "+$24.00" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border-2 border-zinc-100">
                      <div className="text-lg font-bold text-zinc-800">{item.name}</div>
                      <div className="text-lg font-black text-green-600">{item.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
