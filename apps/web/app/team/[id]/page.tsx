import { Shield, Star, MapPin, Users, Award, Zap, Crown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { notFound } from "next/navigation";

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    starter: { label: "Starter", color: "text-zinc-500", bg: "bg-zinc-100" },
    pro: { label: "Pro", color: "text-blue-600", bg: "bg-blue-100" },
    elite: { label: "Elite", color: "text-purple-600", bg: "bg-purple-100" },
    ambassador: { label: "Ambassador", color: "text-amber-600", bg: "bg-amber-100" },
};

async function getTeam(id: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/referrer/${id}/team`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function MyTeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getTeam(id);
    if (!data) notFound();

    const tier = TIER_CONFIG[data.tier] || TIER_CONFIG.starter;

    // Group by trade category
    const byCategory = new Map<string, any[]>();
    data.team.forEach((biz: any) => {
        const cat = biz.trade_category || "Other";
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(biz);
    });

    return (
        <main className="min-h-screen bg-zinc-50">
            <header className="bg-white border-b border-zinc-100 p-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/">
                        <Logo size="sm" />
                    </Link>
                    <Link href="/businesses" className="text-sm font-bold text-orange-500 hover:underline">
                        Browse All Businesses
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto py-10 px-4">
                {/* Header */}
                <div className="bg-white rounded-3xl border border-zinc-200 p-8 mb-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 mb-1">{data.referrer_name}&apos;s Team</h1>
                    <p className="text-zinc-500 mb-3">My trusted tradies in {data.region}</p>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${tier.bg} ${tier.color}`}>
                        {tier.label} Referrer
                    </span>
                    <p className="text-sm text-zinc-400 mt-4">
                        I&apos;ve personally worked with and recommend every tradie on this list.
                    </p>
                </div>

                {/* Team Grid by Category */}
                {data.team.length === 0 ? (
                    <div className="text-center py-16 text-zinc-400">
                        <p className="font-bold">This referrer hasn&apos;t added any businesses to their team yet.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Array.from(byCategory.entries()).map(([category, businesses]) => (
                            <div key={category}>
                                <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">
                                    {category}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {businesses.map((biz: any) => (
                                        <Link key={biz.slug} href={`/b/${biz.slug}?ref=${biz.link_code}`} className="block group">
                                            <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-lg hover:border-orange-200 transition-all">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {biz.logo_url ? (
                                                        <img src={biz.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-black">
                                                            {biz.business_name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-zinc-900 group-hover:text-orange-600 transition-colors truncate">
                                                            {biz.business_name}
                                                        </div>
                                                        <div className="text-sm text-zinc-400 flex items-center gap-2">
                                                            <MapPin className="w-3 h-3" /> {biz.suburb}, {biz.state}
                                                        </div>
                                                    </div>
                                                    {biz.is_verified && (
                                                        <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                                                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                        {(biz.trust_score / 20).toFixed(1)}/5.0
                                                    </div>
                                                    <span className="text-xs font-bold text-orange-500 flex items-center gap-1 group-hover:underline">
                                                        Get a Quote <ChevronRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer CTA */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-zinc-400 mb-4">Want to earn money recommending tradies like {data.referrer_name}?</p>
                    <Link href="/onboarding/referrer" className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-colors">
                        Become a Referrer <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </main>
    );
}
