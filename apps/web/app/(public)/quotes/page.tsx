import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { PublicMultiQuoteForm } from "@/components/PublicMultiQuoteForm";

interface QuotesPageProps {
    searchParams: Promise<{
        trade?: string;
        state?: string;
        city?: string;
        suburb?: string;
        source?: string;
    }>;
}

export const metadata: Metadata = {
    title: "Get 3 Free Quotes | Compare Local Tradies | TradeRefer",
    description: "Request up to 3 free quotes from verified local tradies. Tell us about your job and TradeRefer will match you with suitable businesses.",
    alternates: { canonical: "https://traderefer.au/quotes" },
    openGraph: {
        title: "Get 3 Free Quotes | TradeRefer",
        description: "Request up to 3 free quotes from verified local tradies near you.",
        url: "https://traderefer.au/quotes",
        type: "website",
    },
};

function titleize(value: string) {
    return value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
    const params = await searchParams;
    const trade = params.trade ? titleize(decodeURIComponent(params.trade)) : "";
    const state = params.state ? decodeURIComponent(params.state).toUpperCase() : "";
    const city = params.city ? titleize(decodeURIComponent(params.city)) : "";
    const suburb = params.suburb ? titleize(decodeURIComponent(params.suburb)) : "";
    const source = params.source ? decodeURIComponent(params.source) : "/quotes";

    const locationLabel = suburb || city || state || "your area";
    const headingSuffix = trade ? ` for ${trade}` : "";

    return (
        <main className="min-h-screen bg-[#FCFCFC]">
            <div className="bg-gray-100 border-b border-gray-200" style={{ paddingTop: "108px", paddingBottom: "12px" }}>
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-2 font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: "16px" }}>
                        <Link href="/" className="hover:text-[#FF6600] transition-colors">Home</Link>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-[#FF6600]">Get 3 Quotes</span>
                    </nav>
                </div>
            </div>

            <section className="border-b border-zinc-200 bg-gradient-to-b from-orange-50 via-[#FCFCFC] to-[#FCFCFC]">
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm">
                                <Sparkles className="w-4 h-4" />
                                Free website quote matching
                            </div>

                            <div className="space-y-5">
                                <h1 className="text-[42px] md:text-7xl lg:text-[80px] font-black leading-[1.05] text-[#1A1A1A] font-display">
                                    Get up to <span className="text-[#FF6600]">3 free quotes</span>{headingSuffix}
                                </h1>
                                <p className="text-gray-600 max-w-2xl" style={{ fontSize: "20px", lineHeight: 1.7 }}>
                                    Tell us about your job in {locationLabel} and TradeRefer will send your request to up to 3 verified local businesses.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-sm">
                                    <CheckCircle2 className="w-6 h-6 text-orange-500 mb-3" />
                                    <p className="font-black text-zinc-900 mb-1" style={{ fontSize: "18px" }}>Free to request</p>
                                    <p className="text-zinc-500" style={{ fontSize: "16px", lineHeight: 1.6 }}>No charge to send your quote request.</p>
                                </div>
                                <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-sm">
                                    <ShieldCheck className="w-6 h-6 text-green-500 mb-3" />
                                    <p className="font-black text-zinc-900 mb-1" style={{ fontSize: "18px" }}>Verified businesses</p>
                                    <p className="text-zinc-500" style={{ fontSize: "16px", lineHeight: 1.6 }}>ABN-checked businesses already listed on TradeRefer.</p>
                                </div>
                                <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-sm">
                                    <MapPin className="w-6 h-6 text-blue-500 mb-3" />
                                    <p className="font-black text-zinc-900 mb-1" style={{ fontSize: "18px" }}>Local matching</p>
                                    <p className="text-zinc-500" style={{ fontSize: "16px", lineHeight: 1.6 }}>We aim to match you with nearby tradies first.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
                                <h2 className="font-black text-[#1A1A1A] mb-4 font-display" style={{ fontSize: "28px" }}>How it works</h2>
                                <div className="space-y-4">
                                    {[
                                        "Tell us what job you need done and where the work is located.",
                                        "We match your request with up to 3 suitable local businesses.",
                                        "You compare replies and decide who you want to speak with.",
                                    ].map((step, index) => (
                                        <div key={step} className="flex gap-4 items-start">
                                            <div className="w-9 h-9 rounded-2xl bg-[#FF6600] text-white flex items-center justify-center font-black shrink-0" style={{ fontSize: "16px" }}>
                                                {index + 1}
                                            </div>
                                            <p className="text-zinc-600 font-medium" style={{ fontSize: "17px", lineHeight: 1.7 }}>{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-zinc-200 p-6 md:p-8 shadow-xl shadow-zinc-200/60">
                            <PublicMultiQuoteForm
                                initialTradeCategory={trade}
                                initialState={state}
                                initialSuburb={suburb}
                                initialCity={city}
                                initialSourcePage={source}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
