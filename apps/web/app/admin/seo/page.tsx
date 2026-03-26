export const dynamic = "force-dynamic";

import { Search, TrendingUp, TrendingDown, Eye, MousePointer, BarChart3, AlertTriangle, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";

const GSC_API = process.env.GSC_API_URL || "https://disciplined-truth-production-5cd7.up.railway.app";

type LatestResponse = {
    pulledAt?: string;
    summary?: {
        clicks_28d?: number;
        impressions_28d?: number;
        ctr_28d?: number;
        position_28d?: number;
    };
};

type OpportunityItem = {
    page?: string;
    score?: number;
    reasons?: string[];
    metrics?: {
        clicks?: number;
        impressions?: number;
        position?: number;
    };
};

type OpportunitiesResponse = {
    top20?: OpportunityItem[];
};

type PositionChangeItem = {
    direction?: "improved" | "declined";
    page?: string;
    change?: number;
    position_28d?: number;
    position_90d?: number;
};

type PositionChangesResponse = {
    improved?: number;
    declined?: number;
    changes?: PositionChangeItem[];
};

type ZeroClickPage = {
    page?: string;
    impressions?: number;
    position?: number;
};

type ZeroClickResponse = {
    pages?: ZeroClickPage[];
};

type KeywordGapItem = {
    keyword?: string;
    searchVolume?: number;
    firstDomainRank?: number;
    firstDomainUrl?: string;
    secondDomainRank?: number;
    secondDomainUrl?: string;
};

type KeywordGapResponse = {
    target?: string;
    exclude?: string;
    keywords?: KeywordGapItem[];
    freshness?: {
        updatedAt?: string;
    };
};

type BacklinkGapItem = {
    domain?: string;
    domainRank?: number;
    backlinksCount?: number;
    firstSeen?: string;
};

type BacklinkGapResponse = {
    available?: boolean;
    reason?: string;
    activateAt?: string;
    targets?: string[];
    exclude?: string;
    domains?: BacklinkGapItem[];
    freshness?: {
        updatedAt?: string;
    };
};

type SerpRankingItem = {
    keyword?: string;
    searchVolume?: number;
    competitorRank?: number;
    competitorUrl?: string;
    tradereferRank?: number;
    tradereferUrl?: string;
    rankGap?: number;
    status?: string;
};

type SerpRankingsResponse = {
    competitorDomain?: string;
    tradereferDomain?: string;
    rankings?: SerpRankingItem[];
    summary?: {
        competitorOnly?: number;
        tradereferRanked?: number;
        sharedKeywords?: number;
    };
    freshness?: {
        updatedAt?: string;
    };
};

async function fetchGSC<T>(endpoint: string): Promise<T | null> {
    try {
        const res = await fetch(`${GSC_API}${endpoint}`, { cache: "no-store" });
        if (!res.ok) return null;
        return res.json() as Promise<T>;
    } catch {
        return null;
    }
}

export default async function SEOPage() {
    const [latest, opportunities, positionChanges, zeroClick, keywordGap, backlinkGap, serpRankings] = await Promise.all([
        fetchGSC<LatestResponse>("/api/gsc/latest"),
        fetchGSC<OpportunitiesResponse>("/api/gsc/top-opportunities"),
        fetchGSC<PositionChangesResponse>("/api/gsc/position-changes"),
        fetchGSC<ZeroClickResponse>("/api/gsc/zero-click?min_impressions=50"),
        fetchGSC<KeywordGapResponse>("/api/competitors/keyword-gap"),
        fetchGSC<BacklinkGapResponse>("/api/competitors/backlink-gap"),
        fetchGSC<SerpRankingsResponse>("/api/serp/rankings"),
    ]);

    const summary = latest?.summary || {};

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Search className="w-6 h-6 text-green-600" /> SEO & Analytics
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Google Search Console data · Last updated: {latest?.pulledAt ? new Date(latest.pulledAt).toLocaleDateString("en-AU") : "—"}
                    </p>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Clicks (28d)", value: summary.clicks_28d ?? "—", icon: MousePointer, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Impressions (28d)", value: summary.impressions_28d ?? "—", icon: Eye, color: "text-violet-600", bg: "bg-violet-50" },
                        { label: "Avg CTR", value: summary.ctr_28d ? `${(summary.ctr_28d * 100).toFixed(1)}%` : "—", icon: BarChart3, color: "text-green-600", bg: "bg-green-50" },
                        { label: "Avg Position", value: summary.position_28d ? Number(summary.position_28d).toFixed(1) : "—", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-zinc-900">
                                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                            </div>
                            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SEO Opportunities */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" /> Top SEO Opportunities
                        </h2>
                        {opportunities?.top20 && opportunities.top20.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {opportunities.top20.slice(0, 10).map((opp, i) => (
                                    <div key={i} className="border-b border-zinc-50 pb-3 last:border-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-zinc-800 truncate">{opp.page?.replace("https://traderefer.au", "")}</p>
                                                <div className="flex gap-3 mt-1 text-[11px] text-zinc-500">
                                                    <span>{opp.metrics?.clicks} clicks</span>
                                                    <span>{opp.metrics?.impressions?.toLocaleString()} imp</span>
                                                    <span>pos {opp.metrics?.position?.toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full shrink-0">
                                                Score {opp.score}
                                            </span>
                                        </div>
                                        <div className="mt-1.5">
                                            {opp.reasons?.map((r, ri) => (
                                                <p key={ri} className="text-[11px] text-zinc-500">{r}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-4">No opportunities found or GSC API not connected</p>
                        )}
                    </div>

                    {/* Position Changes */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" /> Position Changes (28d vs 90d)
                        </h2>
                        {positionChanges?.changes && positionChanges.changes.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                <div className="flex gap-4 mb-3 text-xs font-bold text-zinc-400">
                                    <span className="text-green-600">{positionChanges.improved} improved</span>
                                    <span className="text-red-600">{positionChanges.declined} declined</span>
                                </div>
                                {positionChanges.changes.slice(0, 15).map((c, i) => (
                                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-zinc-50 last:border-0">
                                        {c.direction === "improved" ? (
                                            <ArrowUp className="w-4 h-4 text-green-500 shrink-0" />
                                        ) : (
                                            <ArrowDown className="w-4 h-4 text-red-500 shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-zinc-800 truncate">{c.page?.replace("https://traderefer.au", "")}</p>
                                        </div>
                                        <span className={`text-xs font-black ${c.direction === "improved" ? "text-green-600" : "text-red-600"}`}>
                                            {c.direction === "improved" ? "+" : ""}{c.change?.toFixed(1)}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 w-16 text-right">
                                            {c.position_28d?.toFixed(1)} → {c.position_90d?.toFixed(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-4">No position changes found or GSC API not connected</p>
                        )}
                    </div>

                    {/* Zero Click Pages */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm lg:col-span-2">
                        <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <Eye className="w-4 h-4 text-violet-500" /> Zero Click Pages
                            <span className="text-xs font-normal text-zinc-400">(impressions but no clicks — needs title/description optimization)</span>
                        </h2>
                        {zeroClick?.pages && zeroClick.pages.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                            <th className="text-left p-2">Page</th>
                                            <th className="text-right p-2">Impressions</th>
                                            <th className="text-right p-2">Position</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {zeroClick.pages.slice(0, 20).map((p, i) => (
                                            <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50">
                                                <td className="p-2">
                                                    <a href={p.page} target="_blank" rel="noopener" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[500px]">
                                                        {p.page?.replace("https://traderefer.au", "")}
                                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                                    </a>
                                                </td>
                                                <td className="p-2 text-right text-xs font-bold text-zinc-700">{p.impressions?.toLocaleString()}</td>
                                                <td className="p-2 text-right text-xs text-zinc-500">{p.position?.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-4">No zero-click pages found or GSC API not connected</p>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-orange-500" /> Competitor Keyword Gap
                            </h2>
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                {keywordGap?.target || "competitor"} vs {keywordGap?.exclude || "traderefer.au"}
                            </p>
                        </div>
                        {keywordGap?.keywords && keywordGap.keywords.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                                            <th className="text-left p-2">Keyword</th>
                                            <th className="text-right p-2">Volume</th>
                                            <th className="text-right p-2">Competitor</th>
                                            <th className="text-right p-2">TradeRefer</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {keywordGap.keywords.slice(0, 20).map((item, i) => (
                                            <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50">
                                                <td className="p-2 text-xs font-bold text-zinc-800">{item.keyword || "—"}</td>
                                                <td className="p-2 text-right text-xs text-zinc-600">{item.searchVolume?.toLocaleString() || "—"}</td>
                                                <td className="p-2 text-right text-xs text-zinc-600">{item.firstDomainRank ?? "—"}</td>
                                                <td className="p-2 text-right text-xs font-bold text-zinc-900">{item.secondDomainRank ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-4">No keyword gap data available</p>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-500" /> Backlink Gap
                        </h2>
                        {backlinkGap?.available === false ? (
                            <div className="space-y-3">
                                <p className="text-sm text-zinc-500">{backlinkGap.reason || "Backlink gap data is unavailable."}</p>
                                {backlinkGap.activateAt ? (
                                    <a href={backlinkGap.activateAt} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
                                        Activate subscription <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                ) : null}
                            </div>
                        ) : backlinkGap?.domains && backlinkGap.domains.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {backlinkGap.domains.slice(0, 20).map((domain, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-zinc-800 truncate">{domain.domain || "—"}</p>
                                        </div>
                                        <span className="text-[11px] text-zinc-500">DR {domain.domainRank ?? "—"}</span>
                                        <span className="text-[11px] font-bold text-zinc-700">{domain.backlinksCount?.toLocaleString() || "—"} links</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-4">No backlink gap data available</p>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-violet-500" /> SERP Rankings Gap
                            </h2>
                            <div className="flex gap-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                <span>{serpRankings?.summary?.competitorOnly ?? 0} competitor only</span>
                                <span>{serpRankings?.summary?.sharedKeywords ?? 0} shared</span>
                            </div>
                        </div>
                        {serpRankings?.rankings && serpRankings.rankings.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {serpRankings.rankings.slice(0, 20).map((item, i) => (
                                    <div key={i} className="border-b border-zinc-50 pb-3 last:border-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-zinc-800 truncate">{item.keyword || "—"}</p>
                                                <p className="text-[11px] text-zinc-500 mt-1">Volume {item.searchVolume?.toLocaleString() || "—"}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${item.status === "competitor_only" ? "bg-red-50 text-red-600" : item.status === "behind" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
                                                {item.status || "unknown"}
                                            </span>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] text-zinc-600">
                                            <div>Competitor rank: <span className="font-bold text-zinc-900">{item.competitorRank ?? "—"}</span></div>
                                            <div>TradeRefer rank: <span className="font-bold text-zinc-900">{item.tradereferRank ?? "—"}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 text-center py-4">No SERP rankings data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
