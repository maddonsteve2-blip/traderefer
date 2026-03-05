import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Gift, Mail, Smartphone, Clock3, Star, Users, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Earn Prezzee Gift Cards | TradeRefer Rewards",
    description: "Invite 5 people to TradeRefer and automatically earn a $25 Prezzee Smart Card — spend it at Woolworths, Bunnings, Uber, Netflix, Coles and 400+ more brands.",
};

const PREZZEE_LOGO = "https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg";

const BASE = "https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7";

const PREZZEE_SMART_GIF = `${BASE}/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif`;

const CARDS = [
    { name: "Prezzee Smart Card", url: PREZZEE_SMART_GIF },
    { name: "Groceries", url: `${BASE}/e1ffa9be-102f-427c-b96d-4bcfe883f1e3/AU_Prezzee_Groceries_SKU_452_280.png` },
    { name: "Luxury", url: `${BASE}/9513c78c-2e6e-48a3-8db4-8f18fe3541ad/Prezzee_Luxury_Category_SKU_Updated_29725_452_280.png` },
    { name: "Ampol", url: `${BASE}/70ecca42-5ca9-45b3-9bb4-69f3413d95bf/ampol_gc_452_280.jpg` },
    { name: "lululemon", url: `${BASE}/dca3aea1-015e-4cbc-96a8-6aa6c69b018b/lululemon__AU__Gift_Card_Image_452_280.jpg` },
    { name: "PUMA", url: `${BASE}/961b313f-07e1-4321-9495-b19a687ba1b5/PUMA__AU__Gift_Card_Image_452_280.jpg` },
    { name: "Ripcurl", url: `${BASE}/8350baaa-0544-4aab-a8f4-8c3d8c8a7def/Ripcurl_AU_Gift_Card_Image_452_280.jpg` },
    { name: "Stinger Golf", url: `${BASE}/90a8c864-a3d9-41fa-b8e0-ab42b2ad01a2/Stinger_Golf_AU_GC_Image_2025_452_280.jpg` },
    { name: "Lunar New Year", url: `${BASE}/a3c3e7e5-e48d-44f3-8617-cf0907a7cad7/20260109-campaign-lunarnewyear-sku-01-452x280px_452_280.gif` },
    { name: "Lantern Festival", url: `${BASE}/e3d83c90-e427-4113-8c09-da51da024a61/20260109-campaign-lunarnewyear-sku-02-452x280px_452_280.gif` },
    { name: "Let's Party", url: `${BASE}/48bba655-b822-4fb9-a179-e689e416852d/Cheers_to_us_%282%29_452_280.png` },
    { name: "New Adventures", url: `${BASE}/c606d0f8-3219-49b0-b477-45321f342ab6/Let_s_get_lost_%281%29_452_280.png` },
    { name: "Self Care", url: `${BASE}/cd3dea17-a65d-472a-bdcc-d536a6ab5b80/Self_care_%281%29_452_280.png` },
    { name: "Happy Birthday", url: `${BASE}/cdd5a783-03c4-4dc1-99bb-d38611f4beea/Happy_Birthday_-_452x280_452_280.png` },
    { name: "Wedding", url: `${BASE}/74d68461-0fc9-44d9-b8c6-eca8a6c81e4a/wedding_prezzee_001_452_280.png` },
    { name: "For Her", url: `${BASE}/3ee8ccc0-24cc-4de1-a17d-3d9e98aa2cf7/NZ_Prezzee_Her_Category_SKU_452_280.png` },
    { name: "For Him", url: `${BASE}/24b8f9e1-d3e4-4a6d-a76f-15c9eaa8b623/Prezzee_for_Him_SKU_2026_452_280.png` },
    { name: "For Kids", url: `${BASE}/755871ce-bc4c-4509-a571-4e4f8992422c/Prezzee_Kids_452_280.png` },
    { name: "Foodie", url: `${BASE}/18ceb08f-a6ea-4676-80e0-a4044a0647c0/AU_Prezzee_Foodie_452_280.png` },
    { name: "Fuel", url: `${BASE}/8375906a-b45f-4acc-8c1e-019a2df55842/Prezzee_Fuel_Category_452_280.png` },
    { name: "Entertainment", url: `${BASE}/91f8ddc2-9f41-47dd-b657-aef3dadb89f6/Prezzee_Entertainment_SKU_452_280.png` },
    { name: "Travel", url: `${BASE}/0517fd0a-e366-41f1-9a10-567eb7b4e698/Prezzee_Travel_SKU_452_280.png` },
    { name: "Well Done!", url: `${BASE}/e4b8ace6-5f59-4dff-9ea8-61f8b95d9d24/Well_done_SKU_452_280.png` },
    { name: "World's Best Teacher", url: `${BASE}/dfccf25a-6508-4bb8-9374-0a5d7f0ff9e9/20240805-worldteacherday-SKU_452_280.png` },
    { name: "School Graduation", url: `${BASE}/aa8599a4-308f-4831-a9f6-3e4e041ea231/Primary_School_Graduation_SKU_(1)_452_280.png` },
];

const STEPS = [
    {
        number: "01",
        title: "Refer a tradie",
        desc: "Share your unique referral link with someone who needs a tradie. When the business wins the job, the lead is confirmed.",
    },
    {
        number: "02",
        title: "Job confirmed",
        desc: "Once both sides confirm the job was hired and completed, your reward is automatically calculated — no chasing required.",
    },
    {
        number: "03",
        title: "Card hits your inbox",
        desc: "Your Prezzee Smart Card arrives by email or SMS. Open it, pick your brands, and spend — it's that simple.",
    },
];

const TRUST = [
    { icon: Clock3, label: "Valid 3 years", sub: "No rush to spend" },
    { icon: Mail, label: "Instant delivery", sub: "Email or SMS" },
    { icon: Smartphone, label: "Prezzee Wallet app", sub: "Apple Wallet compatible" },
    { icon: Star, label: "400+ brands", sub: "One card, your choice" },
];

export default function RewardsPage() {
    return (
        <main className="min-h-screen bg-white">

            {/* ── HERO ── */}
            <section className="bg-[#EAF4FF] pt-32 pb-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Powered by Prezzee badge */}
                        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-blue-100 mb-8">
                            <span className="text-zinc-400 font-bold text-sm">Rewards powered by</span>
                            <Image
                                src={PREZZEE_LOGO}
                                alt="Prezzee"
                                width={72}
                                height={24}
                                className="h-5 w-auto"
                                unoptimized
                            />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 leading-[1.05] tracking-tight font-display">
                            One Card.<br />
                            <span className="text-[#FF6600]">400+ Places</span> to Spend It.
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                            Earn a <strong className="text-zinc-900">$25 Prezzee Smart Card</strong> every time you invite 5 people who join TradeRefer. Spend it anywhere — Woolworths, Bunnings, Uber, Netflix and hundreds more.
                        </p>
                        {/* Prezzee Smart Card animated GIF */}
                        <div className="relative inline-block mb-8">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={PREZZEE_SMART_GIF}
                                alt="Prezzee Smart eGift Card"
                                className="w-64 md:w-80 rounded-2xl shadow-2xl mx-auto"
                            />
                        </div>

                        {/* $25 earn callout */}
                        <div className="inline-flex items-center gap-4 bg-white rounded-3xl px-8 py-5 shadow-xl border border-orange-100 mb-10">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Gift className="w-7 h-7 text-[#FF6600]" />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-zinc-900 text-xl leading-tight">Invite 5 → earn $25</p>
                                <p className="text-zinc-500 font-medium text-sm mt-0.5">Automatically issued when your 5th invitee becomes active</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/onboarding/referrer" className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55A00] text-white font-black px-10 py-4 rounded-full text-lg shadow-xl shadow-orange-200 transition-all hover:-translate-y-0.5">
                                Join as Referrer <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/onboarding/business" className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white font-black px-10 py-4 rounded-full text-lg transition-all hover:-translate-y-0.5">
                                Join as Business <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display">How it works</h2>
                            <p className="text-xl text-zinc-500 font-medium">Three steps from referral to reward.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {STEPS.map((step) => (
                                <div key={step.number} className="relative">
                                    <div className="text-6xl font-black text-zinc-100 font-display mb-4 leading-none">{step.number}</div>
                                    <h3 className="text-xl font-black text-zinc-900 mb-3 font-display">{step.title}</h3>
                                    <p className="text-zinc-500 leading-relaxed font-medium">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SMART CARD EXPLAINER ── */}
            <section className="py-20 bg-[#EAF4FF]">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 mb-6">
                                    <span className="text-zinc-500 font-bold text-sm">Rewards by</span>
                                    <Image src={PREZZEE_LOGO} alt="Prezzee" width={72} height={24} className="h-5 w-auto" unoptimized />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display leading-tight">
                                    One card.<br />Endless choice.
                                </h2>
                                <p className="text-lg text-zinc-600 leading-relaxed mb-8 font-medium">
                                    The Prezzee Smart Card is the ultimate swap card. You receive one gift card — then choose which brands to spend it at. Split the balance however you like.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { amount: "$40", brand: "Woolworths", color: "#00703E" },
                                        { amount: "$25", brand: "Uber", color: "#000000" },
                                        { amount: "$15", brand: "Netflix", color: "#E50914" },
                                    ].map(({ amount, brand, color }) => (
                                        <div key={brand} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-blue-50">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ backgroundColor: color }}>
                                                {brand[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-zinc-900">{brand}</p>
                                            </div>
                                            <span className="font-black text-zinc-900 text-lg">{amount}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between bg-zinc-50 rounded-2xl px-5 py-3 border border-zinc-100">
                                        <span className="font-bold text-zinc-400 text-sm">Total from one $80 card</span>
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <Clock3 className="w-5 h-5 text-[#FF6600]" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 text-lg">Valid for 3 years</h3>
                                    </div>
                                    <p className="text-zinc-500 leading-relaxed">No pressure to spend immediately. Your Prezzee Smart Card stays active for 3 full years from the issue date.</p>
                                </div>
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-[#FF6600]" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 text-lg">Instant delivery</h3>
                                    </div>
                                    <p className="text-zinc-500 leading-relaxed">Card arrives in your email inbox automatically — no waiting, no claiming, no paperwork.</p>
                                </div>
                                <div className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <Smartphone className="w-5 h-5 text-[#FF6600]" />
                                        </div>
                                        <h3 className="font-black text-zinc-900 text-lg">Prezzee Wallet + Apple Wallet</h3>
                                    </div>
                                    <p className="text-zinc-500 leading-relaxed">Store your card in the Prezzee app or add to Apple Wallet for one-tap access whenever you need it.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── BRAND GRID ── */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-4">
                            <div className="inline-flex items-center gap-2 mb-6">
                                <span className="text-zinc-400 font-bold text-sm">Spend your rewards at</span>
                                <Image src={PREZZEE_LOGO} alt="Prezzee" width={72} height={24} className="h-5 w-auto" unoptimized />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 font-display">Where you can spend</h2>
                            <p className="text-xl text-zinc-500 font-medium max-w-2xl mx-auto">
                                Your Prezzee Smart Card unlocks 400+ brands. Here&apos;s just a taste of where you can spend it.
                            </p>
                        </div>

                        {/* Invite CTA above grid */}
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 my-10 max-w-3xl mx-auto">
                            <div className="flex items-center gap-3">
                                <Gift className="w-6 h-6 text-[#FF6600] shrink-0" />
                                <p className="font-bold text-zinc-900">Invite 5 people who join → earn a <span className="text-[#FF6600]">$25 Smart Card</span>, automatically.</p>
                            </div>
                            <Link href="/onboarding/referrer" className="shrink-0 inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#E55A00] text-white font-black px-6 py-3 rounded-full text-sm transition-colors whitespace-nowrap">
                                Start earning <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Card image grid — matches Prezzee store page layout, 452x280 aspect ratio */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {CARDS.map((card) => (
                                <Link
                                    key={card.name}
                                    href="/onboarding/referrer"
                                    className="group relative rounded-2xl overflow-hidden aspect-[452/280] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 bg-zinc-100"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={card.url}
                                        alt={card.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-3">
                                        <span className="text-white font-black text-sm text-center leading-tight">Start earning</span>
                                        <span className="text-[#FF6600] font-black text-xs flex items-center gap-1">
                                            Join free <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </Link>
                            ))}

                            {/* "+307 more brands" tile */}
                            <Link
                                href="/onboarding/referrer"
                                className="group relative rounded-2xl overflow-hidden aspect-[452/280] flex flex-col items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                            >
                                <span className="text-white font-black text-2xl">+307</span>
                                <span className="text-zinc-400 font-bold text-xs text-center px-3 leading-tight">more brands</span>
                                <span className="text-[#FF6600] font-black text-xs flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                                    Join free <ArrowRight className="w-3 h-3" />
                                </span>
                            </Link>
                        </div>

                        <p className="text-center text-zinc-400 font-medium text-sm mt-8">
                            Available brands may vary. Full catalogue at{" "}
                            <a href="https://prezzee.com.au/en-au/au/store" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors">
                                prezzee.com.au
                            </a>
                        </p>
                    </div>
                </div>
            </section>

            {/* ── TRUST BADGES ── */}
            <section className="py-16 bg-zinc-50 border-y border-zinc-100">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                        {TRUST.map(({ icon: Icon, label, sub }) => (
                            <div key={label} className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100">
                                    <Icon className="w-6 h-6 text-[#FF6600]" />
                                </div>
                                <div>
                                    <p className="font-black text-zinc-900 text-sm">{label}</p>
                                    <p className="text-zinc-400 font-medium text-xs mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── INVITE MILESTONE ── */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <Users className="w-8 h-8 text-[#FF6600]" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display">
                            Invite 5. Earn $25.
                        </h2>
                        <p className="text-xl text-zinc-500 leading-relaxed mb-4 font-medium">
                            Every time you invite 5 people — referrers or businesses — who become active on TradeRefer, we automatically send you a <strong className="text-zinc-900">$25 Prezzee Smart Card</strong>.
                        </p>
                        <p className="text-lg text-zinc-400 leading-relaxed mb-12">
                            No minimum spend. No claiming. No waiting. The card arrives in your inbox as soon as your 5th invitee becomes active.
                        </p>
                        {/* Progress illustration */}
                        <div className="flex items-center justify-center gap-3 mb-12">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs font-black text-zinc-400">Invite {n}</span>
                                </div>
                            ))}
                            <div className="flex flex-col items-center gap-2 ml-2">
                                <ChevronRight className="w-5 h-5 text-zinc-300 mb-5" />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center shadow-lg">
                                    <Gift className="w-6 h-6 text-[#FF6600]" />
                                </div>
                                <span className="text-xs font-black text-[#FF6600]">$25 Card</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/onboarding/referrer" className="inline-flex items-center justify-center gap-2 bg-[#FF6600] hover:bg-[#E55A00] text-white font-black px-10 py-4 rounded-full text-lg shadow-xl shadow-orange-200 transition-all hover:-translate-y-0.5">
                                Join as Referrer — it&apos;s free <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/dashboard/referrer" className="inline-flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-black px-10 py-4 rounded-full text-lg transition-all">
                                Already a member
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
