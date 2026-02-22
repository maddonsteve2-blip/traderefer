import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, ShieldCheck, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

async function getBusinesses() {
    try {
        const businesses = await sql`
      SELECT * FROM businesses 
      WHERE status = 'active'
      ORDER BY listing_rank DESC, created_at DESC
    `;
        return businesses;
    } catch (error) {
        console.error("Database error:", error);
        return [];
    }
}

export default async function BusinessDirectory() {
    const businesses = await getBusinesses();

    return (
        <main className="flex-1 pt-24 pb-12 bg-zinc-50 min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2 font-display">Business Directory</h1>
                        <p className="text-zinc-600">Find the best local trades recommended by people you trust.</p>
                    </div>

                    <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by trade or suburb..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg">
                                Search
                            </Button>
                        </div>
                        <Button asChild variant="outline" className="rounded-lg border-zinc-200 hover:bg-zinc-50 font-bold whitespace-nowrap">
                            <Link href="/register?type=business">List Business</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {businesses.map((biz: any) => (
                        <div key={biz.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100 shadow-inner">
                                            {biz.logo_url ? (
                                                <Image src={biz.logo_url} alt={biz.business_name} width={48} height={48} className="object-cover" />
                                            ) : (
                                                <div className="text-xl font-bold text-zinc-300">
                                                    {biz.business_name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                                {biz.business_name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                                                <span className="text-orange-600">{biz.trade_category}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {biz.suburb}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {biz.is_verified && (
                                        <div className="bg-orange-100 text-orange-600 p-1.5 rounded-full" title="Verified Business">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-0.5 text-orange-500">
                                            <Star className="w-4 h-4 fill-current" />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-900">{biz.connection_rate}% connection rate</span>
                                        <span className="text-xs text-zinc-400">• {biz.total_confirmed} verified leads</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed h-10">
                                        {biz.description || `Expert ${biz.trade_category} serving the ${biz.suburb} area. High quality workmanship and reliable service.`}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                                    <div>
                                        <div className="text-base text-zinc-400 font-bold uppercase tracking-wider">Unlock Fee</div>
                                        <div className="text-lg font-black text-zinc-900 font-display">${(biz.unlock_fee_cents / 100).toFixed(2)}</div>
                                    </div>
                                    <Button asChild className="bg-zinc-900 hover:bg-black text-white rounded-full px-5 group/btn h-10">
                                        <Link href={`/b/${biz.slug}`}>
                                            View & Refer <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {businesses.length === 0 && (
                    <div className="bg-white rounded-3xl border border-zinc-200 p-16 text-center max-w-2xl mx-auto shadow-sm">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-zinc-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">No businesses listed yet</h2>
                        <p className="text-zinc-600 mb-8">
                            We're currently onboarding top trades in your area. Check back soon!
                        </p>
                        <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
}
