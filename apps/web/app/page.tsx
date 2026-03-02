"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useState } from "react";
import {
  Search, MapPin, ArrowRight, ArrowLeft,
  Megaphone, CheckCircle2, XCircle, ShieldCheck,
  Construction, TrendingUp, Zap, HardHat, Home as HomeIcon,
  Wrench, ShoppingCart, Headphones, Printer, ChevronRight
} from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  const [tradies, setTradies] = useState(10);
  const [jobsPerMonth, setJobsPerMonth] = useState(3);
  const monthlyEarnings = tradies * jobsPerMonth * 15;

  return (
    <main className="bg-[#F2F2F2] text-[#1A1A1A] antialiased">

      {/* ── HERO ── */}
      <section className="relative bg-[#F2F2F2] py-16 lg:py-24 overflow-hidden border-b border-gray-200">
        {/* Background image overlay */}
        <div
          className="absolute inset-0 z-0 opacity-10 bg-cover bg-center mix-blend-multiply"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop')" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1A1A1A] mb-6 leading-tight tracking-tight font-display">
            Australia's Verified{" "}
            <span className="text-[#FF6600]">Trade Referral</span>{" "}
            Marketplace.
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-3xl mx-auto font-light">
            Built on Trust, Paid on Success. The smartest way to scale your trade business.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-5xl mx-auto">
            {/* Referrers card */}
            <div className="bg-white rounded-xl p-8 lg:p-10 shadow-xl border-t-8 border-[#FF6600] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center h-full">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-[#FF6600] ring-4 ring-orange-100">
                <Megaphone className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-extrabold mb-3 font-display text-[#1A1A1A]">Referrers</h3>
              <p className="text-gray-600 mb-8 text-center text-lg flex-grow">
                Monetize your network by referring trusted trades. Earn gift cards for every successful job.
              </p>
              <SignedOut>
                <Link
                  href="/register?type=referrer"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white py-5 rounded-lg shadow-lg transition-all active:scale-95 font-cta text-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Earn Gift Cards <ArrowRight className="w-5 h-5" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard/referrer"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white py-5 rounded-lg shadow-lg transition-all active:scale-95 font-cta text-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  My Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              </SignedIn>
            </div>

            {/* Trades card */}
            <div className="bg-[#1A1A1A] rounded-xl p-8 lg:p-10 shadow-xl border-t-8 border-gray-500 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center h-full text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Construction className="w-32 h-32" />
              </div>
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 text-white ring-4 ring-gray-700 z-10">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-extrabold mb-3 font-display z-10">Trades</h3>
              <p className="text-gray-300 mb-8 text-center text-lg flex-grow z-10">
                Get high-quality, verified leads. Only pay when you win the work. Zero upfront risk.
              </p>
              <SignedOut>
                <Link
                  href="/register?type=business"
                  className="w-full bg-white hover:bg-gray-200 text-[#1A1A1A] py-5 rounded-lg shadow-lg transition-all active:scale-95 font-cta text-xl font-bold uppercase tracking-wider z-10 flex items-center justify-center gap-2"
                >
                  Grow Risk-Free <TrendingUp className="w-5 h-5" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard/business"
                  className="w-full bg-white hover:bg-gray-200 text-[#1A1A1A] py-5 rounded-lg shadow-lg transition-all active:scale-95 font-cta text-xl font-bold uppercase tracking-wider z-10 flex items-center justify-center gap-2"
                >
                  View Leads <TrendingUp className="w-5 h-5" />
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── REFERRER EARNINGS ESTIMATOR ── */}
      <section className="py-16 bg-[#1A1A1A] text-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-orange-500 font-black text-sm uppercase tracking-widest mb-3">For Referrers</p>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display">How Much Could You Earn?</h2>
            <p className="text-zinc-400 mt-3 text-lg">Move the sliders to see your potential monthly gift card earnings.</p>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-8 space-y-8 border border-white/5">
            {/* Slider 1 */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-bold text-zinc-300">Tradies you know</label>
                <span className="text-3xl font-black text-[#FF6600]">{tradies}</span>
              </div>
              <input
                type="range" min={1} max={50} step={1}
                value={tradies}
                onChange={e => setTradies(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#FF6600" }}
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1"><span>1</span><span>50</span></div>
            </div>

            {/* Slider 2 */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-bold text-zinc-300">Est. jobs referred per tradie / month</label>
                <span className="text-3xl font-black text-[#FF6600]">{jobsPerMonth}</span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={jobsPerMonth}
                onChange={e => setJobsPerMonth(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#FF6600" }}
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1"><span>1</span><span>10</span></div>
            </div>

            {/* Result */}
            <div className="bg-[#FF6600]/10 border border-[#FF6600]/30 rounded-xl p-6 text-center">
              <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">You&apos;re leaving on the table</p>
              <p className="text-6xl font-black text-[#FF6600]">${monthlyEarnings.toLocaleString()}</p>
              <p className="text-zinc-400 mt-1">per month in gift cards</p>
            </div>

            <Link
              href="/register?type=referrer"
              className="flex items-center justify-center gap-3 w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-black text-xl py-5 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Start Earning Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-white border-b border-gray-200 py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 font-display">Trusted by Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0">
            <div className="flex items-center gap-3 group">
              <ShieldCheck className="w-9 h-9 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-xl font-display">ABN Verified</span>
            </div>
            <div className="flex items-center gap-3 group">
              <HardHat className="w-9 h-9 text-blue-800 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-xl font-display">Master Builders</span>
            </div>
            <div className="flex items-center gap-3 group">
              <Zap className="w-9 h-9 text-yellow-600 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-xl font-display">NECA Member</span>
            </div>
            <div className="flex items-center gap-3 group">
              <HomeIcon className="w-9 h-9 text-red-700 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-xl font-display">HIA</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── NATIONAL SEARCH ── */}
      <section className="py-20 bg-[#1A1A1A] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(#FF6600 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-10 font-display">
            Search Our National Network of <span className="text-[#FF6600]">Verified Trades</span>.
          </h2>
          <div className="bg-white p-2 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none rounded-lg font-sans text-lg"
                placeholder="What trade do you need? (e.g. Electrician)"
                type="text"
              />
            </div>
            <div className="relative md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none rounded-lg font-sans text-lg"
                placeholder="Postcode or Suburb"
                type="text"
              />
            </div>
            <Link
              href="/local"
              className="bg-[#FF6600] hover:bg-[#E65C00] text-white px-10 py-4 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 md:w-auto w-full font-cta text-xl uppercase tracking-wide flex items-center justify-center"
            >
              Search
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-gray-400 font-sans">
            <span className="text-gray-500">Popular:</span>
            <Link className="hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/local?category=Plumbing">Plumbers in Sydney</Link>
            <Link className="hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/local?category=Electrical">Electricians in Melbourne</Link>
            <Link className="hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/local?category=Building">Builders in Brisbane</Link>
            <Link className="hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/local?category=Painting">Painters in Perth</Link>
          </div>
        </div>
      </section>

      {/* ── THE MATH BEHIND SUCCESS ── */}
      <section className="py-20 bg-[#F2F2F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-4 font-display">The Math Behind Success</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">See exactly why our model puts more money in your pocket.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-5xl mx-auto">
            {/* Old way */}
            <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-200 opacity-80 hover:opacity-100 transition-opacity flex flex-col relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">The Old Way</div>
              <h3 className="text-xl font-bold text-gray-500 mb-6 uppercase font-display text-center">Traditional Lead Sites</h3>
              <ul className="space-y-6 text-gray-600 mb-8 flex-grow">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-lg mb-1">Pay $21+ per lead just to quote</strong>
                    <span className="text-sm">Paying for the *chance* to work, even if 5 others are quoting too.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-lg mb-1">No guarantee of work</strong>
                    <span className="text-sm">If you don't win the job, that money is gone forever.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-lg mb-1">Sunk marketing cost</strong>
                    <span className="text-sm">Burn through budget without securing a single invoice.</span>
                  </div>
                </li>
              </ul>
              <div className="border-t border-gray-100 pt-6 text-center">
                <span className="text-red-500 font-bold font-display text-lg">High Risk, Unknown Reward</span>
              </div>
            </div>

            {/* TradeRefer way */}
            <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-2xl border-2 border-[#FF6600] relative transform md:scale-105 z-10 flex flex-col">
              <div className="absolute -top-5 right-0 left-0 mx-auto w-max bg-[#FF6600] text-white text-sm font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-md">Recommended Choice</div>
              <h3 className="text-xl font-bold text-[#FF6600] mb-6 uppercase font-display text-center">Pay-For-Success Model</h3>
              <ul className="space-y-6 text-gray-700 mb-8 flex-grow">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-lg mb-1">$0 Upfront Cost</strong>
                    <span className="text-sm">Join, list your business, and receive leads completely free.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-lg mb-1">Only pay a 20% fee when you WIN</strong>
                    <span className="text-sm">We only get paid when money hits your bank account. Fair and square.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-lg mb-1">Fully Tax-Deductible</strong>
                    <span className="text-sm">The success fee is a 100% legitimate business promotion expense.</span>
                  </div>
                </li>
              </ul>
              <div className="border-t border-gray-100 pt-6 text-center">
                <span className="text-green-600 font-bold font-display text-lg">Zero Risk, Infinite Upside</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REWARDS CAROUSEL ── */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-2 font-display">Cash in Your Goodwill</h2>
              <p className="text-gray-600 text-lg">Turn your professional network into tangible rewards from Australia's top retailers.</p>
            </div>
            <div className="flex gap-3">
              <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors text-[#1A1A1A]" aria-label="Previous">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full bg-[#FF6600] text-white flex items-center justify-center hover:bg-[#E65C00] transition-colors shadow-lg" aria-label="Next">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 snap-x" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {/* Bunnings */}
            <div className="min-w-[300px] md:min-w-[340px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 snap-center group cursor-pointer hover:shadow-xl transition-all flex-shrink-0">
              <div className="h-44 bg-green-700 group-hover:bg-green-600 flex items-center justify-center p-6 transition-colors relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20"><Wrench className="w-32 h-32 text-white" /></div>
                <h4 className="text-white text-4xl font-black font-display tracking-tighter z-10">Bunnings</h4>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-xl mb-2 font-display">Bunnings Gift Card</h4>
                <p className="text-gray-500 text-sm mb-6 h-10">Perfect for tools, timber, and the weekend sausage sizzle.</p>
                <span className="text-[#FF6600] font-bold text-sm uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                  Redeem Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Coles */}
            <div className="min-w-[300px] md:min-w-[340px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 snap-center group cursor-pointer hover:shadow-xl transition-all flex-shrink-0">
              <div className="h-44 bg-red-600 group-hover:bg-red-500 flex items-center justify-center p-6 transition-colors relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20"><ShoppingCart className="w-32 h-32 text-white" /></div>
                <h4 className="text-white text-4xl font-black font-display tracking-tighter z-10">Coles</h4>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-xl mb-2 font-display">Coles Group Card</h4>
                <p className="text-gray-500 text-sm mb-6 h-10">Groceries, liquor, and fuel discounts for your family.</p>
                <span className="text-[#FF6600] font-bold text-sm uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                  Redeem Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* JB Hi-Fi */}
            <div className="min-w-[300px] md:min-w-[340px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 snap-center group cursor-pointer hover:shadow-xl transition-all flex-shrink-0">
              <div className="h-44 bg-yellow-400 group-hover:bg-yellow-300 flex items-center justify-center p-6 transition-colors relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20"><Headphones className="w-32 h-32 text-black" /></div>
                <h4 className="text-black text-4xl font-black font-display tracking-tighter z-10">JB Hi-Fi</h4>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-xl mb-2 font-display">JB Hi-Fi Voucher</h4>
                <p className="text-gray-500 text-sm mb-6 h-10">Get the latest tech, cameras, and home entertainment.</p>
                <span className="text-[#FF6600] font-bold text-sm uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                  Redeem Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Officeworks */}
            <div className="min-w-[300px] md:min-w-[340px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 snap-center group cursor-pointer hover:shadow-xl transition-all flex-shrink-0">
              <div className="h-44 bg-blue-600 group-hover:bg-blue-500 flex items-center justify-center p-6 transition-colors relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20"><Printer className="w-32 h-32 text-white" /></div>
                <h4 className="text-white text-3xl font-black font-display tracking-tighter z-10">Officeworks</h4>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-xl mb-2 font-display">Officeworks Credit</h4>
                <p className="text-gray-500 text-sm mb-6 h-10">Upgrade your office supplies and admin setup.</p>
                <span className="text-[#FF6600] font-bold text-sm uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                  Redeem Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Trade */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-zinc-900 mb-4 font-display tracking-tight">Browse by Trade</h2>
            <p className="text-xl text-zinc-600 font-medium max-w-2xl mx-auto">Find verified local specialists for every home and commercial trade across Australia.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
            {TRADE_CATEGORIES.filter(t => t !== "Other").slice(0, 30).map((trade) => (
              <Link
                key={trade}
                href={`/local?category=${encodeURIComponent(trade)}`}
                className="group flex items-center gap-2.5 bg-white border border-zinc-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-zinc-700 hover:border-orange-500 hover:text-orange-600 hover:shadow-md transition-all duration-200"
              >
                <Wrench className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 shrink-0 transition-colors" />
                <span className="leading-tight">{trade}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/local"
              className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Browse All Trades <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by State */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-zinc-900 mb-4 font-display tracking-tight">Browse by State</h2>
            <p className="text-xl text-zinc-600 font-medium max-w-2xl mx-auto">Local trade directories for every Australian state and territory.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Victoria", slug: "vic", cities: "Geelong, Melbourne, Ballarat" },
              { name: "New South Wales", slug: "nsw", cities: "Sydney, Newcastle, Wollongong" },
              { name: "Queensland", slug: "qld", cities: "Brisbane, Gold Coast, Sunshine Coast" },
              { name: "Western Australia", slug: "wa", cities: "Perth, Fremantle, Mandurah" },
              { name: "South Australia", slug: "sa", cities: "Adelaide, Mount Gambier" },
              { name: "Tasmania", slug: "tas", cities: "Hobart, Launceston" },
              { name: "ACT", slug: "act", cities: "Canberra" },
              { name: "Northern Territory", slug: "nt", cities: "Darwin" },
            ].map(({ name, slug, cities }) => (
              <Link
                key={slug}
                href={`/local/${slug}`}
                className="group bg-zinc-50 border border-zinc-200 rounded-2xl p-5 hover:border-orange-500 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors leading-tight mb-1">{name}</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">{cities}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
