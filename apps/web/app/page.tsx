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

import { SmartSearch } from "@/components/SmartSearch";

export default function HomePage() {
  const [tradies, setTradies] = useState(10);
  const [jobsPerMonth, setJobsPerMonth] = useState(3);
  const monthlyEarnings = tradies * jobsPerMonth * 15;

  const [bizSpend, setBizSpend] = useState(500);
  const [bizConvRate, setBizConvRate] = useState(30);
  const bizSaved = Math.round(bizSpend * (1 - bizConvRate / 100));

  const bizPct = `${((bizSpend - 0) / 5000) * 100}%`;
  const bizConvPct = `${((bizConvRate - 5) / (90 - 5)) * 100}%`;
  const tradiesPct = `${((tradies - 1) / (50 - 1)) * 100}%`;
  const jobsPct = `${((jobsPerMonth - 1) / (10 - 1)) * 100}%`;

  return (
    <main className="bg-[#FCFCFC] text-[#1A1A1A] antialiased">

      {/* ── HERO ── */}
      <section className="relative bg-[#FCFCFC] pt-24 pb-16 md:pt-32 md:pb-20 lg:pt-36 lg:pb-28 overflow-hidden border-b border-gray-200">
        {/* Construction site bg with 30% light overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2670&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 z-0 bg-[#FCFCFC]/75" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-[36px] sm:text-[48px] md:text-7xl lg:text-[80px] font-extrabold text-[#1A1A1A] mb-4 md:mb-6 leading-[1.1] tracking-tight font-display">
            Australia&apos;s Verified{" "}
            <span className="text-[#FF6600]">Trade Referral</span>{" "}
            Marketplace.
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-8 md:mb-16 max-w-3xl mx-auto leading-relaxed" style={{ lineHeight: 1.7 }}>
            Built on Trust, Paid on Success. The smartest way to scale your trade business.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-5xl mx-auto">
            {/* Referrers card */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-xl border-t-8 border-[#FF6600] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center h-full">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-[#FF6600] ring-4 ring-orange-100">
                <Megaphone className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-extrabold mb-3 font-display text-[#1A1A1A]">Referrers</h3>
              <p className="text-gray-600 mb-8 text-center text-xl leading-relaxed flex-grow" style={{ lineHeight: 1.7 }}>
                Monetize your network. Earn gift cards for every trade job you refer — no selling, just connecting.
              </p>
              <SignedOut>
                <Link
                  href="/register?type=referrer"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl shadow-lg transition-all active:scale-95 font-cta text-[22px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  style={{ minHeight: "64px" }}
                >
                  Earn Gift Card Rewards <ArrowRight className="w-6 h-6" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard/referrer"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl shadow-lg transition-all active:scale-95 font-cta text-[22px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  style={{ minHeight: "64px" }}
                >
                  My Dashboard <ArrowRight className="w-6 h-6" />
                </Link>
              </SignedIn>
            </div>

            {/* Trades card */}
            <div className="bg-[#1A1A1A] rounded-2xl p-8 lg:p-10 shadow-xl border-t-8 border-[#FF6600] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center h-full text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Construction className="w-36 h-36" />
              </div>
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 text-white ring-4 ring-gray-700 z-10">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-extrabold mb-3 font-display z-10">Trade Businesses</h3>
              <p className="text-gray-300 mb-8 text-center text-xl leading-relaxed flex-grow z-10" style={{ lineHeight: 1.7 }}>
                Get exclusive, verified leads. Zero upfront cost — only pay a 20% fee when you win the job.
              </p>
              <SignedOut>
                <Link
                  href="/register?type=business"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl shadow-lg transition-all active:scale-95 font-cta text-[22px] font-bold uppercase tracking-wider z-10 flex items-center justify-center gap-2"
                  style={{ minHeight: "64px" }}
                >
                  Grow Your Network <TrendingUp className="w-6 h-6" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard/business"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl shadow-lg transition-all active:scale-95 font-cta text-[22px] font-bold uppercase tracking-wider z-10 flex items-center justify-center gap-2"
                  style={{ minHeight: "64px" }}
                >
                  View My Leads <TrendingUp className="w-6 h-6" />
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI HUB: THE POWER OF THE NETWORK ── */}
      <section className="py-12 md:py-20 bg-[#FCFCFC] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-14">
            <p className="text-[#FF6600] font-black text-lg uppercase tracking-widest mb-4">The Power of the Network</p>
            <h2 className="text-[32px] md:text-[52px] font-extrabold text-[#1A1A1A] font-display leading-tight">
              Built for Everyone<br />Who Wins When Trades Win.
            </h2>
            <p className="mt-5 text-xl text-gray-600 max-w-2xl mx-auto" style={{ lineHeight: 1.7, fontSize: '20px' }}>
              Move the sliders to see your real numbers. No sign-up needed to calculate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── LEFT: BUSINESS SAVINGS ── */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-[#1A1A1A] px-5 py-5 md:px-8 md:py-7">
                <p className="text-[#FF6600] font-black text-xl uppercase tracking-widest mb-2">For Trade Businesses</p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-display leading-tight">Protect Your Profit.</h3>
                <p className="text-zinc-400 text-base md:text-lg mt-3 leading-relaxed">
                  Stop paying $21+ per lead just to quote. See what you&apos;d save by switching to pay-on-success.
                </p>
              </div>
              {/* Body — flex-1 so button stays at bottom */}
              <div className="p-5 md:p-8 flex flex-col flex-1 gap-5 md:gap-7">
                {/* Slider 1 — Monthly Spend */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-bold text-[#1A1A1A]">Average monthly lead spend</label>
                    <span className="text-4xl font-black text-[#1A1A1A]">${bizSpend}</span>
                  </div>
                  <input
                    type="range" min={0} max={5000} step={50}
                    value={bizSpend}
                    onChange={e => setBizSpend(Number(e.target.value))}
                    className="slider-dark w-full"
                    style={{ "--val": bizPct } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-base text-gray-500 mt-3 font-medium">
                    <span>$0/mo</span><span>$5,000/mo</span>
                  </div>
                </div>

                {/* Slider 2 — Conversion Rate */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-bold text-[#1A1A1A]">Current lead conversion rate</label>
                    <span className="text-4xl font-black text-[#1A1A1A]">{bizConvRate}%</span>
                  </div>
                  <input
                    type="range" min={5} max={90} step={5}
                    value={bizConvRate}
                    onChange={e => setBizConvRate(Number(e.target.value))}
                    className="slider-dark w-full"
                    style={{ "--val": bizConvPct } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-base text-gray-500 mt-3 font-medium">
                    <span>5% win rate</span><span>90% win rate</span>
                  </div>
                </div>

                {/* Result */}
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                  <p className="text-base font-black text-green-700 uppercase tracking-widest mb-2">Total Marketing Waste Eliminated</p>
                  <p className="text-6xl md:text-7xl font-black text-green-600 leading-none">${bizSaved.toLocaleString()}</p>
                  <p className="text-lg text-green-700 mt-3 font-medium">per month — saved with $0 upfront</p>
                </div>

                <p className="text-base text-gray-500 leading-relaxed flex-1" style={{ fontSize: '17px', lineHeight: 1.7 }}>
                  TradeRefer charges $0 upfront. The 20% success fee on won jobs qualifies as a marketing &amp; promotion expense deductible under <strong>Section 8-1 of the ITAA 1997</strong>.
                </p>

                <Link
                  href="/register?type=business"
                  className="flex items-center justify-center gap-3 w-full bg-[#1A1A1A] hover:bg-zinc-800 text-white font-black text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{ minHeight: "64px" }}
                >
                  Grow Risk-Free <TrendingUp className="w-6 h-6" />
                </Link>
              </div>
            </div>

            {/* ── RIGHT: REFERRER EARNINGS ── */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-[#FF6600] px-5 py-5 md:px-8 md:py-7">
                <p className="text-white font-black text-xl uppercase tracking-widest mb-2">For Referrers</p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-display leading-tight">Earn Your Worth.</h3>
                <p className="text-white/85 text-base md:text-lg mt-3 leading-relaxed">
                  Know a tradie? That&apos;s money. See what your network is worth in gift cards every month.
                </p>
              </div>
              {/* Body — flex-1 so button stays at bottom */}
              <div className="p-5 md:p-8 flex flex-col flex-1 gap-5 md:gap-7">
                {/* Slider 1 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-bold text-[#1A1A1A]">Tradie contacts you know</label>
                    <span className="text-4xl font-black text-[#FF6600]">{tradies}</span>
                  </div>
                  <input
                    type="range" min={1} max={50} step={1}
                    value={tradies}
                    onChange={e => setTradies(Number(e.target.value))}
                    className="slider-orange w-full"
                    style={{ "--val": tradiesPct } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-base text-gray-500 mt-3 font-medium">
                    <span>1 contact</span><span>50 contacts</span>
                  </div>
                </div>

                {/* Slider 2 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-bold text-[#1A1A1A]">Est. jobs referred per tradie / month</label>
                    <span className="text-4xl font-black text-[#FF6600]">{jobsPerMonth}</span>
                  </div>
                  <input
                    type="range" min={1} max={10} step={1}
                    value={jobsPerMonth}
                    onChange={e => setJobsPerMonth(Number(e.target.value))}
                    className="slider-orange w-full"
                    style={{ "--val": jobsPct } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-base text-gray-500 mt-3 font-medium">
                    <span>1 job</span><span>10 jobs</span>
                  </div>
                </div>

                {/* Result */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 text-center">
                  <p className="text-base font-black text-[#FF6600] uppercase tracking-widest mb-2">Monthly Gift Card Potential</p>
                  <p className="text-6xl md:text-7xl font-black text-[#FF6600] leading-none">${monthlyEarnings.toLocaleString()}</p>
                  <p className="text-lg text-orange-700 mt-3 font-medium">per month in tax-deductible gift cards</p>
                </div>

                {/* spacer to push button to bottom */}
                <div className="flex-1" />

                <Link
                  href="/register?type=referrer"
                  className="flex items-center justify-center gap-3 w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-black text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{ minHeight: "60px" }}
                >
                  Start Earning Now <ArrowRight className="w-6 h-6" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-white border-b border-gray-200 py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-base font-black text-gray-400 uppercase tracking-widest mb-10 text-center font-display">Trusted by Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">

            {/* Pulsing ABN Live badge */}
            <div className="flex items-center gap-4 bg-green-50 border-2 border-green-200 rounded-2xl px-6 py-4">
              <div className="relative">
                <ShieldCheck className="w-12 h-12 text-green-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 animate-ping" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="font-black text-xl text-[#1A1A1A] font-display">ABN &amp; License Verified</p>
                <p className="font-bold text-green-600 uppercase tracking-widest" style={{ fontSize: '16px' }}>● Live Network Active</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <HardHat className="w-12 h-12 text-blue-800" />
              <div>
                <p className="font-extrabold text-xl font-display">Master Builders</p>
                <p className="text-gray-400 font-medium" style={{ fontSize: '16px' }}>Association Member</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-yellow-600" />
              <div>
                <p className="font-extrabold text-xl font-display">NECA</p>
                <p className="text-gray-400 font-medium" style={{ fontSize: '16px' }}>National Electrical</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <HomeIcon className="w-12 h-12 text-red-700" />
              <div>
                <p className="font-extrabold text-xl font-display">HIA</p>
                <p className="text-gray-400 font-medium" style={{ fontSize: '16px' }}>Housing Industry</p>
              </div>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-extrabold font-display mb-3">
              Find <span className="text-[#FF6600]">Verified Trades</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Search thousands of verified Australian tradespeople
            </p>
          </div>
          
          <SmartSearch variant="landing" />
          
          <div className="mt-6 flex flex-wrap justify-center gap-2 md:gap-3 text-gray-400">
            <span className="text-gray-500 text-sm hidden sm:inline">Popular:</span>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Plumbing">Plumbers</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Electrical">Electricians</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Building">Builders</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Painting">Painters</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Landscaping">Landscapers</Link>
          </div>
        </div>
      </section>

      {/* ── THE MATH BEHIND SUCCESS ── */}
      <section className="py-20 bg-[#F2F2F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[52px] font-extrabold text-[#1A1A1A] mb-4 font-display leading-tight">The Math Behind Success</h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>See exactly why our model puts more money in your pocket.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-5xl mx-auto">
            {/* Old way */}
            <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-200 opacity-80 hover:opacity-100 transition-opacity flex flex-col relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">The Old Way</div>
              <h3 className="text-xl font-bold text-gray-500 mb-6 uppercase font-display text-center">Traditional Lead Sites</h3>
              <ul className="space-y-6 text-gray-600 mb-8 flex-grow">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Pay $21+ per lead just to quote</strong>
                    <span style={{ fontSize: '17px', lineHeight: 1.7 }} className="text-gray-500">Paying for the chance to work, even if 5 others are quoting too. High Risk.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Shared leads, no guarantee</strong>
                    <span style={{ fontSize: '17px', lineHeight: 1.7 }} className="text-gray-500">If you don&apos;t win the job, that money is gone forever.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Sunk marketing cost</strong>
                    <span style={{ fontSize: '17px', lineHeight: 1.7 }} className="text-gray-500">Burn through budget without securing a single invoice.</span>
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
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">$0 Upfront Cost — Exclusive Leads</strong>
                    <span style={{ fontSize: '17px', lineHeight: 1.7 }} className="text-gray-500">Join, list your business, and receive exclusive leads completely free.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Only pay 20% fee when you WIN</strong>
                    <span style={{ fontSize: '17px', lineHeight: 1.7 }} className="text-gray-500">We only get paid when money hits your account. Zero risk.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Tax-Deductible — Section 8-1 ITAA 1997</strong>
                    <span style={{ fontSize: '17px', lineHeight: 1.7 }} className="text-gray-500">The 20% success fee qualifies as a Marketing &amp; Promotion expense under Australian tax law.</span>
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
                <p className="text-gray-500 mb-4" style={{ fontSize: '16px' }}>Perfect for tools, timber, and the weekend sausage sizzle.</p>
                <span className="text-[#FF6600] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all" style={{ fontSize: '16px' }}>
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
                <p className="text-gray-500 mb-4" style={{ fontSize: '16px' }}>Groceries, liquor, and fuel discounts for your family.</p>
                <span className="text-[#FF6600] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all" style={{ fontSize: '16px' }}>
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
                <p className="text-gray-500 mb-4" style={{ fontSize: '16px' }}>Get the latest tech, cameras, and home entertainment.</p>
                <span className="text-[#FF6600] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all" style={{ fontSize: '16px' }}>
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
                <p className="text-gray-500 mb-4" style={{ fontSize: '16px' }}>Upgrade your office supplies and admin setup.</p>
                <span className="text-[#FF6600] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all" style={{ fontSize: '16px' }}>
                  Redeem Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Trade */}
      <section className="py-24 bg-[#F2F2F2]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-[32px] md:text-[52px] font-black text-zinc-900 mb-4 font-display tracking-tight leading-tight">Browse by Trade</h2>
            <p className="text-zinc-600 font-medium max-w-2xl mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>Find verified local specialists for every home and commercial trade across Australia.</p>
          </div>
          {/* GEO BLUF snippet for AI crawlers */}
          <div className="bg-white border-l-4 border-[#FF6600] rounded-xl px-6 py-4 max-w-3xl mx-auto mb-12">
            <p className="text-[#1A1A1A]" style={{ fontSize: '18px', lineHeight: 1.7 }}>
              TradeRefer provides access to 12,000+ verified Australian trades across every state and territory. Our network eliminates upfront lead risk for businesses while rewarding local communities for high-quality introductions.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
            {TRADE_CATEGORIES.filter(t => t !== "Other").slice(0, 30).map((trade) => (
              <Link
                key={trade}
                href={`/local?category=${encodeURIComponent(trade)}`}
                className="group flex items-center gap-2.5 bg-white border border-zinc-200 rounded-2xl px-4 py-3.5 font-bold text-zinc-700 hover:border-orange-500 hover:text-orange-600 hover:shadow-md transition-all duration-200" style={{ fontSize: '16px' }}
              >
                <Wrench className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 shrink-0 transition-colors" />
                <span className="leading-tight">{trade}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/local"
              className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700 transition-colors" style={{ fontSize: '16px' }}
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
            <h2 className="text-[32px] md:text-[52px] font-black text-zinc-900 mb-4 font-display tracking-tight leading-tight">Browse by State</h2>
            <p className="text-zinc-600 font-medium max-w-2xl mx-auto" style={{ fontSize: '20px', lineHeight: 1.7 }}>Local trade directories for every Australian state and territory.</p>
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
                <h3 className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors leading-tight mb-1" style={{ fontSize: '16px' }}>{name}</h3>
                <p className="text-zinc-400 font-medium leading-relaxed" style={{ fontSize: '16px' }}>{cities}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
