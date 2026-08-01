import Link from "next/link";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import {
  MapPin, ArrowRight, Search,
  Megaphone, CheckCircle2, XCircle, ShieldCheck,
  TrendingUp, Home as HomeIcon,
  Wrench, ChevronRight
} from "lucide-react";
import { TRADE_CATEGORIES } from "@/lib/constants";
import { sql } from "@/lib/db";
import { buildOgImageUrl } from "@/lib/og-image";
import { getCanonicalSuburbSlug } from "@/lib/postcodes";

const SmartSearch = dynamic(() => import("@/components/SmartSearch").then((m) => m.SmartSearch), {
  loading: () => <div className="h-14 rounded-xl bg-white/10 animate-pulse" />,
});

const homeOgImage = buildOgImageUrl({
  template: "home",
  title: "Find trusted local tradies",
  subtitle: "Compare ABN-checked trade businesses, request free quotes and reward trusted referrals across Australia.",
  eyebrow: "Trade referral marketplace",
  badge: "Australia-wide",
  stat1: "ABN-checked",
  stat2: "Free quotes",
  stat3: "Referral rewards",
});

export const metadata: Metadata = {
  title: "TradeRefer | Local Tradies & Free Quotes",
  description: "Find ABN-checked Australian tradies, request free quotes, or earn rewards by referring trade businesses you trust. Browse TradeRefer free.",
  openGraph: {
    title: "TradeRefer | Find Trusted Local Tradies & Get Free Quotes",
    description: "Find ABN-checked Australian tradies, request free quotes, or earn rewards by referring trade businesses you trust.",
    url: "https://traderefer.au",
    siteName: "TradeRefer",
    type: "website",
    images: [{ url: homeOgImage, width: 1200, height: 630, alt: "TradeRefer - Find trusted local tradies, request quotes, and reward trusted referrals." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeRefer | Find Trusted Local Tradies & Get Free Quotes",
    description: "Find ABN-checked Australian tradies, request free quotes, or earn rewards by referring trade businesses you trust.",
    images: [homeOgImage],
  },
};

type PopularSearchRow = {
  state: string;
  city: string;
  trade_category: string;
  business_count: string | number;
  sample_address: string | null;
};

type NetworkStats = {
  businessCount: number;
  tradeCount: number;
  stateCount: number;
};

const ROICalculators = dynamic(() => import("@/components/home/ROICalculators").then((mod) => mod.ROICalculators), {
  loading: () => <div className="min-h-[720px] rounded-2xl bg-white border border-gray-200 animate-pulse" />,
});

const PrezzeeCarousel = dynamic(() => import("@/components/home/PrezzeeCarousel").then((mod) => mod.PrezzeeCarousel), {
  loading: () => <div className="min-h-[360px] rounded-2xl bg-[#F8F8F8] border border-gray-200 animate-pulse" />,
});

async function getPopularSearches() {
  try {
    const result = await sql<PopularSearchRow[]>`
      SELECT state, city, trade_category, business_count, sample_address FROM (
        SELECT 
          state,
          city,
          trade_category,
          COUNT(*) as business_count,
          MAX(address) as sample_address,
          ROW_NUMBER() OVER (PARTITION BY city ORDER BY COUNT(*) DESC) as rn
        FROM businesses
        WHERE status = 'active'
          AND city IN ('Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Geelong', 'Gold Coast', 'Newcastle', 'Wollongong', 'Canberra', 'Darwin', 'Sunshine Coast', 'Launceston', 'Ballarat')
          AND trade_category IN ('Plumbing', 'Electrical', 'Painting', 'Building', 'Carpentry', 'Landscaping', 'Roofing', 'Concreting', 'Fencing', 'Air Conditioning & Heating', 'Pest Control', 'Cleaning', 'Handyman', 'Tiling', 'Locksmith', 'Tree Lopping & Removal', 'Demolition')
        GROUP BY state, city, trade_category
      ) ranked
      WHERE rn <= 2
      ORDER BY business_count DESC
      LIMIT 20
    `;

    return result.map((row) => {
      const citySlug = row.city.toLowerCase().replace(/\s+/g, '-');
      const tradeSlug = row.trade_category.toLowerCase().replace(/\s+&?\s*/g, '-');
      const stateSlug = row.state.toLowerCase();
      const cityWithPostcode = getCanonicalSuburbSlug(citySlug, stateSlug);
      
      return {
        label: `${row.trade_category} in ${row.city}`,
        href: `/local/${stateSlug}/${citySlug}/${cityWithPostcode}/${tradeSlug}`,
      };
    });
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    return [
      { label: "Plumbers in Sydney", href: "/local/nsw/sydney/sydney-2000/plumbing" },
      { label: "Electricians in Melbourne", href: "/local/vic/melbourne/melbourne-3000/electrical" },
      { label: "Painters in Brisbane", href: "/local/qld/brisbane/brisbane-4000/painting" },
      { label: "Builders in Perth", href: "/local/wa/perth/perth-6000/building" },
      { label: "Electricians in Adelaide", href: "/local/sa/adelaide/adelaide-5000/electrical" },
      { label: "Plumbers in Canberra", href: "/local/act/canberra/canberra-2601/plumbing" },
      { label: "Roofers in Gold Coast", href: "/local/qld/gold-coast/gold-coast-4217/roofing" },
      { label: "Builders in Hobart", href: "/local/tas/hobart/hobart-7000/building" },
    ];
  }
}

async function getNetworkStats(): Promise<NetworkStats> {
  try {
    const [row] = await sql<{
      business_count: string | number;
      trade_count: string | number;
      state_count: string | number;
    }[]>`
      SELECT
        COUNT(*) AS business_count,
        COUNT(DISTINCT trade_category) AS trade_count,
        COUNT(DISTINCT state) AS state_count
      FROM businesses
      WHERE status = 'active'
        AND (listing_visibility = 'public' OR listing_visibility IS NULL)
        AND business_name IS NOT NULL
        AND business_name != ''
    `;

    return {
      businessCount: Number(row?.business_count ?? 0),
      tradeCount: Number(row?.trade_count ?? 0),
      stateCount: Number(row?.state_count ?? 0),
    };
  } catch {
    return { businessCount: 0, tradeCount: 0, stateCount: 0 };
  }
}

export default async function HomePage() {
  const [popularSearches, networkStats] = await Promise.all([
    getPopularSearches(),
    getNetworkStats(),
  ]);

  const stats = [
    { value: networkStats.businessCount ? networkStats.businessCount.toLocaleString() : "30,000+", label: "public trade profiles" },
    { value: networkStats.tradeCount ? networkStats.tradeCount.toLocaleString() : "50+", label: "trade categories" },
    { value: networkStats.stateCount ? networkStats.stateCount.toLocaleString() : "8", label: "states and territories" },
  ];

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#FF6600]">
              <ShieldCheck className="w-4 h-4" />
              ABN-checked Australian trade directory
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1A1A1A] leading-[1.05] tracking-tight font-display">
              Find trusted local tradies, get free quotes, and reward good referrals.
            </h1>
            <p className="mt-6 text-lg md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              TradeRefer helps Australians compare local trade businesses, send quote requests, and back the tradies they already trust.
            </p>
            <form action="/businesses" className="mt-8 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-xl shadow-gray-900/10 sm:flex-row">
              <label htmlFor="home-business-search" className="sr-only">Search for a business by name, trade or suburb</label>
              <div className="flex min-h-[56px] flex-1 items-center gap-3 px-4">
                <Search className="h-5 w-5 shrink-0 text-[#FF6600]" />
                <input
                  id="home-business-search"
                  name="q"
                  type="search"
                  placeholder="Search business name, trade or suburb"
                  className="w-full bg-transparent text-base font-semibold text-[#1A1A1A] outline-none placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-md bg-[#1A1A1A] px-6 py-3 text-base font-black text-white transition-colors hover:bg-[#FF6600]"
              >
                Search Businesses <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Link
                href="/quotes"
                prefetch={false}
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-lg bg-[#FF6600] px-7 py-4 text-lg font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-[#E65C00]"
              >
                Get Free Quotes <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/businesses"
                prefetch={false}
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-white px-7 py-4 text-lg font-black text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A] hover:text-white"
              >
                Browse Tradies
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-gray-200 bg-white/90 px-5 py-4 text-center shadow-sm">
                <p className="text-3xl font-black text-[#1A1A1A] font-display">{stat.value}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <HomeIcon className="w-8 h-8 text-[#FF6600] mb-4" />
              <h2 className="text-2xl font-extrabold text-[#1A1A1A] font-display">Need a job done?</h2>
              <p className="mt-3 text-gray-600 leading-relaxed">Tell us the trade and suburb. We send your request to suitable local businesses so you can compare replies.</p>
              <Link href="/quotes" prefetch={false} className="mt-5 inline-flex items-center gap-2 font-black text-[#FF6600]">
                Request quotes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-lg border border-gray-900 bg-[#1A1A1A] p-6 text-white shadow-sm">
              <TrendingUp className="w-8 h-8 text-[#FF6600] mb-4" />
              <h2 className="text-2xl font-extrabold font-display">Run a trade business?</h2>
              <p className="mt-3 text-gray-300 leading-relaxed">Claim your profile, show services and locations, and receive direct enquiries without a monthly listing fee.</p>
              <Link href="/register?type=business" prefetch={false} className="mt-5 inline-flex items-center gap-2 font-black text-[#FF6600]">
                Claim your profile <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Megaphone className="w-8 h-8 text-[#FF6600] mb-4" />
              <h2 className="text-2xl font-extrabold text-[#1A1A1A] font-display">Know good tradies?</h2>
              <p className="mt-3 text-gray-600 leading-relaxed">Refer businesses you trust and earn rewards when your introductions create real opportunities.</p>
              <Link href="/register?type=referrer" prefetch={false} className="mt-5 inline-flex items-center gap-2 font-black text-[#FF6600]">
                Start referring <ArrowRight className="w-4 h-4" />
              </Link>
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
          <p className="text-base font-black text-gray-400 uppercase tracking-widest mb-10 text-center font-display">What TradeRefer Checks</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-5">
              <ShieldCheck className="w-8 h-8 text-green-600 mb-3" />
              <p className="font-black text-xl text-[#1A1A1A] font-display">Business identity</p>
              <p className="mt-2 text-gray-600 leading-relaxed">Profiles are matched to public business details such as ABN, location and trade category where available.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
              <Wrench className="w-8 h-8 text-[#FF6600] mb-3" />
              <p className="font-black text-xl text-[#1A1A1A] font-display">Trade fit</p>
              <p className="mt-2 text-gray-600 leading-relaxed">Pages surface services, suburbs and job types before a customer sends an enquiry.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
              <MapPin className="w-8 h-8 text-blue-600 mb-3" />
              <p className="font-black text-xl text-[#1A1A1A] font-display">Local coverage</p>
              <p className="mt-2 text-gray-600 leading-relaxed">Directory and quote flows prioritise nearby businesses before broader matches.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
              <CheckCircle2 className="w-8 h-8 text-green-600 mb-3" />
              <p className="font-black text-xl text-[#1A1A1A] font-display">Clear next steps</p>
              <p className="mt-2 text-gray-600 leading-relaxed">Customers can browse, request quotes or contact businesses directly from profile pages.</p>
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
            <h2 className="text-3xl md:text-5xl font-extrabold font-display mb-3 text-white">
              Find <span className="text-[#FF6600]">Verified Trades</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Search thousands of verified Australian tradespeople
            </p>
          </div>
          
          <SmartSearch variant="landing" />
          
          <div className="mt-6 flex flex-wrap justify-center gap-2 md:gap-3 text-gray-400">
            <span className="text-gray-500 text-sm hidden sm:inline">Popular:</span>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Plumbing" prefetch={false}>Plumbers</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Electrical" prefetch={false}>Electricians</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Building" prefetch={false}>Builders</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Painting" prefetch={false}>Painters</Link>
            <Link className="text-sm hover:text-[#FF6600] underline decoration-[#FF6600] decoration-2 underline-offset-4 transition-all" href="/businesses?category=Landscaping" prefetch={false}>Landscapers</Link>
          </div>
        </div>
      </section>

      {/* ── THE MATH BEHIND SUCCESS ── */}
      <section className="py-20 bg-[#F2F2F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1A1A1A] mb-4 font-display leading-tight">Compare Lead Models</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-xl leading-relaxed">See how upfront lead spend compares with TradeRefer&apos;s profile and referral flow.</p>
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
              <div className="absolute -top-5 right-0 left-0 mx-auto w-max bg-[#FF6600] text-white text-sm font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-md">TradeRefer Model</div>
              <h3 className="text-xl font-bold text-[#FF6600] mb-6 uppercase font-display text-center">Profile Plus Referral Flow</h3>
              <ul className="space-y-6 text-gray-700 mb-8 flex-grow">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">$0 monthly listing fee</strong>
                    <span className="text-gray-500 text-base leading-relaxed">Join, list your business, and receive direct profile enquiries without a monthly subscription.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Success fee on won referral work</strong>
                    <span className="text-gray-500 text-base leading-relaxed">Referral lead terms are shown clearly, so your business can decide before committing.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="block text-[#1A1A1A] text-xl mb-1">Clear success-fee model</strong>
                    <span className="text-gray-500 text-base leading-relaxed">Costs are connected to won work, with terms shown before a business commits.</span>
                  </div>
                </li>
              </ul>
              <div className="border-t border-gray-100 pt-6 text-center">
                <span className="text-green-600 font-bold font-display text-lg">Clear terms, controlled spend</span>
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
              <p className="text-gray-600 text-lg">Invite 5 people → earn a $25 Prezzee Smart Card. Spend it at 335+ brands.</p>
            </div>
            <Link
              href="/rewards"
              prefetch={false}
              className="shrink-0 inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E65C00] text-white font-black px-7 py-3 rounded-full transition-colors shadow-lg"
            >
              See all 335+ brands <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <PrezzeeCarousel />
        </div>
      </section>

      {/* Browse by Trade */}
      <section className="py-24 bg-[#F2F2F2]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4 font-display tracking-tight leading-tight">Browse by Trade</h2>
            <p className="text-zinc-600 font-medium max-w-2xl mx-auto text-xl leading-relaxed">Find local specialists for home and commercial trades across Australia.</p>
          </div>
          {/* GEO BLUF snippet for AI crawlers */}
          <div className="bg-white border-l-4 border-[#FF6600] rounded-xl px-6 py-4 max-w-3xl mx-auto mb-12">
            <p className="text-[#1A1A1A] text-lg leading-relaxed">
              TradeRefer helps Australians compare public trade profiles across every state and territory, request quotes, and reward trusted local introductions when referral terms are accepted.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
            {TRADE_CATEGORIES.filter(t => t !== "Other").slice(0, 30).map((trade) => {
              return (
                <Link
                  key={trade}
                  href={`/businesses?category=${encodeURIComponent(trade)}`}
                  prefetch={false}
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
              prefetch={false}
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
                prefetch={false}
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
              <Link key={label} href={href} prefetch={false} className="px-3 py-2 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-600 hover:border-orange-400 hover:text-orange-600 transition-colors text-center">
                {label}
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/local" prefetch={false} className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700 transition-colors">
              View Full Directory <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
