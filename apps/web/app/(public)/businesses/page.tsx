import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, ShieldCheck, ChevronRight, DollarSign, Gift, Zap } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/BusinessLogo";
import { BusinessDirectoryFilters } from "@/components/BusinessDirectoryFilters";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BackToDashboard } from "@/components/BackToDashboard";

export const dynamic = "force-dynamic";

async function getBusinesses(category?: string, suburb?: string, search?: string) {
    try {
        let query = `SELECT b.*, (SELECT COUNT(*) FROM deals d WHERE d.business_id = b.id AND d.is_active = true AND (d.expires_at IS NULL OR d.expires_at > now())) as deal_count FROM businesses b WHERE b.status = 'active' AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)`;
        const params: string[] = [];

        if (category) {
            params.push(category);
            query += ` AND trade_category = $${params.length}`;
        }
        if (suburb) {
            params.push(suburb);
            query += ` AND suburb ILIKE $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (business_name ILIKE $${params.length} OR trade_category ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        query += ` ORDER BY b.listing_rank DESC, b.created_at DESC`;

        const businesses = await sql.unsafe(query, params);
        return businesses;
    } catch (error) {
        console.error("Database error:", error);
        return [];
    }
}

export default async function BusinessDirectory({
    searchParams
}: {
    searchParams: Promise<{ category?: string; suburb?: string; q?: string }>
}) {
    const { category, suburb, q } = await searchParams;
    const businesses = await getBusinesses(category, suburb, q);

    return (
        <main className="flex-1 pt-24 pb-12 bg-zinc-50 min-h-screen">
            <div className="container mx-auto px-4">
                <BackToDashboard />
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2 font-display">Business Directory</h1>
                        <p className="text-zinc-600">Find the best local trades recommended by people you trust.</p>
                    </div>
                    <Button asChild variant="outline" className="rounded-lg border-zinc-200 hover:bg-zinc-50 font-bold whitespace-nowrap">
                        <Link href="/register?type=business">List Your Business</Link>
                    </Button>
                </div>

                <div className="mb-8">
                    <Suspense fallback={null}>
                        <BusinessDirectoryFilters />
                    </Suspense>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {businesses.map((biz: any) => (
                        <div key={biz.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100 shadow-inner">
                                            <BusinessLogo logoUrl={biz.logo_url} name={biz.business_name} />
                                        </div>
                                        <div>
                                            <Link href={`/b/${biz.slug}`} className="hover:underline">
                                                <h3 className="font-bold text-lg text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                                    {biz.business_name}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-500 font-medium">
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
                                        <span className="text-sm font-bold text-zinc-900">{biz.connection_rate}% connection rate</span>
                                        <span className="text-sm text-zinc-400">• {biz.total_confirmed} verified leads</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed h-10">
                                        {biz.description || `Expert ${biz.trade_category} serving the ${biz.suburb} area. High quality workmanship and reliable service.`}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
                                            <DollarSign className="w-3 h-3" />
                                            ${((biz.referral_fee_cents || 1000) / 100).toFixed(0)} per lead
                                        </div>
                                        {Number(biz.deal_count) > 0 && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-bold border border-orange-100">
                                                <Gift className="w-3 h-3" />
                                                {biz.deal_count} {Number(biz.deal_count) === 1 ? 'deal' : 'deals'}
                                            </div>
                                        )}
                                        {biz.avg_response_minutes != null && biz.avg_response_minutes <= 120 && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
                                                <Zap className="w-3 h-3" />
                                                {biz.avg_response_minutes < 60 ? `< ${biz.avg_response_minutes}m` : `< ${Math.ceil(biz.avg_response_minutes / 60)}h`} response
                                            </div>
                                        )}
                                    </div>
                                    <Button asChild className="bg-zinc-900 hover:bg-black text-white rounded-full px-5 group/btn h-10">
                                        <Link href={`/b/${biz.slug}/refer`}>
                                            Start Referring <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
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
