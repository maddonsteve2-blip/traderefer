import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  MapPin, ArrowRight,
  Megaphone, CheckCircle2, XCircle, ShieldCheck,
  Construction, TrendingUp, Zap, HardHat, Home as HomeIcon,
  Wrench, ChevronRight
} from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/constants";
import { sql } from "@/lib/db";

import { SmartSearch } from "@/components/SmartSearch";
import { ROICalculators } from "@/components/home/ROICalculators";

// Fetch popular city+trade combinations from database
async function getPopularSearches() {
  try {
    const result = await sql`
      SELECT 
        state,
        city,
        trade_category,
        COUNT(*) as business_count
      FROM businesses
      WHERE status = 'active'
        AND city IN ('Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Geelong', 'Gold Coast', 'Newcastle', 'Wollongong', 'Canberra', 'Darwin', 'Sunshine Coast', 'Launceston', 'Ballarat')
        AND trade_category IN ('Plumbing', 'Electrical', 'Painting', 'Building', 'Carpentry', 'Landscaping', 'Roofing', 'Concreting', 'Fencing', 'Air Conditioning & Heating', 'Pest Control', 'Cleaning', 'Handyman', 'Tiling', 'Locksmith', 'Tree Lopping & Removal', 'Demolition')
      GROUP BY state, city, trade_category
      ORDER BY business_count DESC
      LIMIT 20
    `;

    return result.map((row: any) => {
      const citySlug = row.city.toLowerCase().replace(/\s+/g, '-');
      const tradeSlug = row.trade_category.toLowerCase().replace(/\s+&?\s*/g, '-');
      const stateSlug = row.state.toLowerCase();
      
      return {
        label: `${row.trade_category} in ${row.city}`,
        href: `/local/${stateSlug}/${citySlug}/${citySlug}/${tradeSlug}`,
      };
    });
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    // Fallback to a few hardcoded ones if database fails
    return [
      { label: "Plumbers in Sydney", href: "/local/nsw/sydney/sydney/plumbing" },
      { label: "Electricians in Melbourne", href: "/local/vic/melbourne/melbourne/electrical" },
      { label: "Painters in Brisbane", href: "/local/qld/brisbane/brisbane/painting" },
      { label: "Builders in Perth", href: "/local/wa/perth/perth/building" },
    ];
  }
}

export default async function HomePage() {
  const popularSearches = await getPopularSearches();
  return (
    <main className="bg-[#FCFCFC] text-[#1A1A1A] antialiased">

      {/* ── HERO ── */}
      <section className="relative bg-[#FCFCFC] pt-24 pb-16 md:pt-32 md:pb-20 lg:pt-36 lg:pb-28 overflow-hidden border-b border-gray-200">
        {/* Construction site bg with 30% light overlay - optimized for LCP */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-construction.webp"
          alt="Australian construction site"
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchPriority="high"
          loading="eager"
          width="1920"
          height="1080"
        />
        <div className="absolute inset-0 z-0 bg-[#FCFCFC]/75" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold text-[#1A1A1A] mb-4 md:mb-6 leading-[1.1] tracking-tight font-display">
            Australia&apos;s Verified{" "}
            <span className="text-[#FF6600]">Trade Referral</span>{" "}
            Marketplace
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-8 md:mb-16 max-w-3xl mx-auto leading-relaxed">
            Built on Trust, Paid on Success. The smartest way to scale your trade business.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-5xl mx-auto">
            {/* Referrers card */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-xl border-t-8 border-[#FF6600] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center h-full">
              <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-[#FF6600] ring-4 ring-orange-100">
                <Megaphone className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-extrabold mb-3 font-display text-[#1A1A1A]">Referrers</h3>
              <p className="text-gray-600 mb-8 text-center text-xl leading-relaxed flex-grow">
                Monetize your network. Earn gift cards for every trade job you refer — no selling, just connecting.
              </p>
              <SignedOut>
                <Link
                  href="/register?type=referrer"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl shadow-lg transition-all active:scale-95 font-cta text-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Earn Gift Card Rewards <ArrowRight className="w-6 h-6" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard/referrer"
                  className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl shadow-lg transition-all active:scale-95 font-cta text-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
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
              <p className="text-gray-300 mb-8 text-center text-xl leading-relaxed flex-grow z-10">
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
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1A1A1A] font-display leading-tight">
              Built for Everyone<br />Who Wins When Trades Win.
            </h2>
            <p className="mt-5 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Move the sliders to see your real numbers. No sign-up needed to calculate.
            </p>
          </div>

          <ROICalculators />
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
                <p className="font-bold text-green-600 uppercase tracking-widest text-base">● Live Network Active</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <HardHat className="w-12 h-12 text-blue-800" />
              <div>
                <p className="font-extrabold text-xl font-display">Master Builders</p>
                <p className="text-gray-400 font-medium text-base">Association Member</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-yellow-600" />
              <div>
                <p className="font-extrabold text-xl font-display">NECA</p>
                <p className="text-gray-400 font-medium text-base">National Electrical</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <HomeIcon className="w-12 h-12 text-red-700" />
              <div>
                <p className="font-extrabold text-xl font-display">HIA</p>
                <p className="text-gray-400 font-medium text-base">Housing Industry</p>
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
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1A1A1A] mb-4 font-display leading-tight">The Math Behind Success</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-xl leading-relaxed">See exactly why our model puts more money in your pocket.</p>
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
                    <span className="text-gray-500 text-lg leading-relaxed">Paying for the chance to work, even if 5 others are quoting too. High Risk.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Shared leads, no guarantee</strong>
                    <span className="text-gray-500 text-lg leading-relaxed">If you don&apos;t win the job, that money is gone forever.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Sunk marketing cost</strong>
                    <span className="text-gray-500 text-lg leading-relaxed">Burn through budget without securing a single invoice.</span>
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
                    <span className="text-gray-500 text-base leading-relaxed">Join, list your business, and receive exclusive leads completely free.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Only pay 20% fee when you WIN</strong>
                    <span className="text-gray-500 text-base leading-relaxed">We only get paid when money hits your account. Zero risk.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Tax-Deductible — Section 8-1 ITAA 1997</strong>
                    <span className="text-gray-500 text-base leading-relaxed">The 20% success fee qualifies as a Marketing &amp; Promotion expense under Australian tax law.</span>
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
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-gray-400">Rewards powered by</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/prezzee/prezzee-logo.svg"
                  alt="Prezzee"
                  width="80"
                  height="20"
                  className="h-5 w-auto"
                />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-2 font-display">Cash in Your Goodwill</h2>
              <p className="text-gray-600 text-lg">Invite 5 people → earn a $25 Prezzee Smart Card. Spend it at 400+ brands.</p>
            </div>
            <Link
              href="/rewards"
              className="shrink-0 inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-7 py-3 rounded-full transition-colors shadow-lg"
            >
              See all 335 brands <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by Trade */}
      <section className="py-24 bg-[#F2F2F2]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4 font-display tracking-tight leading-tight">Browse by Trade</h2>
            <p className="text-zinc-600 font-medium max-w-2xl mx-auto text-xl leading-relaxed">Find verified local specialists for every home and commercial trade across Australia.</p>
          </div>
          {/* GEO BLUF snippet for AI crawlers */}
          <div className="bg-white border-l-4 border-[#FF6600] rounded-xl px-6 py-4 max-w-3xl mx-auto mb-12">
            <p className="text-[#1A1A1A] text-lg leading-relaxed">
              TradeRefer provides access to 12,000+ verified Australian trades across every state and territory. Our network eliminates upfront lead risk for businesses while rewarding local communities for high-quality introductions.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
            {TRADE_CATEGORIES.filter(t => t !== "Other").slice(0, 30).map((trade) => {
              const slug = trade.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return (
                <Link
                  key={trade}
                  href={`/categories#${slug}`}
                  className="group flex items-center gap-2.5 bg-white border border-zinc-200 rounded-2xl px-4 py-3.5 font-bold text-zinc-700 hover:border-orange-500 hover:text-orange-600 hover:shadow-md transition-all duration-200 text-base"
                >
                  <Wrench className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 shrink-0 transition-colors" />
                  <span className="leading-tight">{trade}</span>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700 transition-colors text-base"
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
            <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4 font-display tracking-tight leading-tight">Browse by State</h2>
            <p className="text-zinc-600 font-medium max-w-2xl mx-auto text-xl leading-relaxed">Local trade directories for every Australian state and territory.</p>
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
                <h3 className="font-black text-zinc-900 group-hover:text-orange-600 transition-colors leading-tight mb-1 text-base">{name}</h3>
                <p className="text-zinc-400 font-medium leading-relaxed text-base">{cities}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Local Searches — SEO internal linking */}
      <section className="py-16 bg-zinc-50 border-t border-zinc-200">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-black text-zinc-900 mb-8 text-center font-display">Popular Local Searches</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-w-6xl mx-auto text-sm">
            {popularSearches.map(({ label, href }) => (
              <Link key={label} href={href} className="px-3 py-2 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-600 hover:border-orange-400 hover:text-orange-600 transition-colors text-center">
                {label}
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/local" className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700 transition-colors">
              View Full Directory <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
