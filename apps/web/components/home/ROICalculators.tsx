"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";

export function ROICalculators() {
  const [tradies, setTradies] = useState(10);
  const [jobsPerMonth, setJobsPerMonth] = useState(3);
  const monthlyEarnings = tradies * jobsPerMonth * 15;

  const [bizSpend, setBizSpend] = useState(500);
  const [bizConvRate, setBizConvRate] = useState(30);
  const unconvertedSpend = Math.round(bizSpend * (1 - bizConvRate / 100));

  const bizPct = `${((bizSpend - 0) / 5000) * 100}%`;
  const bizConvPct = `${((bizConvRate - 5) / (90 - 5)) * 100}%`;
  const tradiesPct = `${((tradies - 1) / (50 - 1)) * 100}%`;
  const jobsPct = `${((jobsPerMonth - 1) / (10 - 1)) * 100}%`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* ── LEFT: BUSINESS SAVINGS ── */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-5 py-5 md:px-8 md:py-7">
          <p className="text-[#FF6600] font-black text-xl uppercase tracking-widest mb-2">For Trade Businesses</p>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-display leading-tight">Know What Your Leads Cost.</h3>
          <p className="text-zinc-400 text-base md:text-lg mt-3 leading-relaxed">
            Estimate how much of your current lead spend is not converting into won work, then compare it with a no-monthly-fee profile.
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
            <p className="text-base font-black text-green-700 uppercase tracking-widest mb-2">Estimated spend not tied to wins</p>
            <p className="text-6xl md:text-7xl font-black text-green-600 leading-none">${unconvertedSpend.toLocaleString()}</p>
            <p className="text-lg text-green-700 mt-3 font-medium">per month, based on your slider inputs</p>
          </div>

          <p className="text-base text-gray-500 leading-relaxed flex-1">
            TradeRefer has no monthly listing fee. Referral lead costs are shown before a business unlocks a lead, and direct profile enquiries are free.
          </p>

          <Link
            href="/register?type=business"
            className="flex items-center justify-center gap-3 w-full bg-[#1A1A1A] hover:bg-zinc-800 text-white font-black text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ minHeight: "64px" }}
          >
            Claim Free Profile <TrendingUp className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* ── RIGHT: REFERRER EARNINGS ── */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#FF6600] px-5 py-5 md:px-8 md:py-7">
          <p className="text-white font-black text-xl uppercase tracking-widest mb-2">For Referrers</p>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-display leading-tight">Recommend Tradies You Trust.</h3>
          <p className="text-white/85 text-base md:text-lg mt-3 leading-relaxed">
            Estimate how referral rewards could add up when you introduce trusted trade businesses to real opportunities.
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
            <p className="text-base font-black text-[#FF6600] uppercase tracking-widest mb-2">Estimated referral rewards</p>
            <p className="text-6xl md:text-7xl font-black text-[#FF6600] leading-none">${monthlyEarnings.toLocaleString()}</p>
            <p className="text-lg text-orange-700 mt-3 font-medium">estimated monthly reward value</p>
          </div>

          {/* spacer to push button to bottom */}
          <div className="flex-1" />

          <Link
            href="/register?type=referrer"
            className="flex items-center justify-center gap-3 w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-black text-xl rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ minHeight: "60px" }}
          >
            Start Referring <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>

    </div>
  );
}
