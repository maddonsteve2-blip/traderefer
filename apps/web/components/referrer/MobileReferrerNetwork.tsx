"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Info, UserPlus, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

interface Business {
    id: string;
    name: string;
    trade_category: string;
    suburb: string;
    logo_url: string | null;
    referral_fee_cents: number;
    is_partner?: boolean;
    leads_count?: number;
    revenue_cents?: number;
}

interface MobileReferrerNetworkProps {
    businesses?: Business[];
    partnersCount?: number;
    availableCount?: number;
    loading?: boolean;
}

interface PendingApplication {
    id: string;
    status: "pending" | "approved" | "rejected" | "expired";
    applied_at: string;
    business_name: string;
    business_slug: string;
    business_logo: string | null;
    trade_category: string;
    suburb: string;
}

export function MobileReferrerNetwork({ 
    businesses: initialBusinesses, 
    partnersCount: initialPartnersCount, 
    availableCount: initialAvailableCount, 
    loading: initialLoading 
}: MobileReferrerNetworkProps) {
    const { getToken } = useAuth();
    const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses || []);
    const [partnersCount, setPartnersCount] = useState(initialPartnersCount || 0);
    const [availableCount, setAvailableCount] = useState(initialAvailableCount || 0);
    const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
    const [loading, setLoading] = useState(initialLoading ?? !initialBusinesses);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"discover" | "pending">("discover");

    useEffect(() => {
        if (initialBusinesses) {
            setBusinesses(initialBusinesses);
            setLoading(initialLoading ?? false);
            return;
        }

        async function fetchNetwork() {
            try {
                const token = await getToken();
                const [refRes, pubRes, appsRes] = await Promise.all([
                    fetch(`/api/backend/referrer/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch(`/api/backend/public/businesses`),
                    fetch(`/api/backend/applications/my-applications`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                const stats = refRes.ok ? await refRes.json() : null;
                const allBiz = pubRes.ok ? await pubRes.json() : [];
                const appsData = appsRes.ok ? await appsRes.json() : null;

                const businessList = Array.isArray(allBiz)
                    ? allBiz
                    : Array.isArray(allBiz?.businesses)
                        ? allBiz.businesses
                        : [];

                const applicationList = Array.isArray(appsData?.applications)
                    ? appsData.applications
                    : [];

                setBusinesses(businessList.slice(0, 24));
                setPartnersCount(typeof stats?.total_referrals === "number" ? stats.total_referrals : 0);
                setAvailableCount(businessList.length);
                setPendingApplications(applicationList.filter((app: PendingApplication) => app.status === "pending"));
            } catch (err) {
                console.error("Failed to fetch network data", err);
            } finally {
                setLoading(false);
            }
        }

        fetchNetwork();
    }, [getToken, initialBusinesses, initialLoading]);

    const filteredBusinesses = useMemo(() => {
        if (!Array.isArray(businesses)) return [];
        return businesses.filter(b => 
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.trade_category.toLowerCase().includes(search.toLowerCase()) ||
            b.suburb.toLowerCase().includes(search.toLowerCase())
        );
    }, [businesses, search]);

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    const discoverCount = filteredBusinesses.length;

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32">
            
            <div className="pt-4 px-5 flex flex-col gap-6">
                {/* ── Network Header ── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight">Network</h1>
                        <p className="mt-1 text-sm font-medium text-zinc-500">Discover businesses and keep pending applications in one place.</p>
                    </div>
                    <Link
                        href="/dashboard/referrer/manage"
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-700"
                    >
                        My Team <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Partnerships</p>
                        <p className="text-2xl font-black text-[#18181B] leading-none">{partnersCount}</p>
                    </div>
                    <div className="bg-[#F4F4F5] rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Businesses Available</p>
                        <p className="text-2xl font-black text-orange-500 leading-none">{availableCount}</p>
                    </div>
                </div>

                <div className="flex bg-[#F4F4F5] p-1 rounded-2xl">
                    <button
                        onClick={() => setActiveTab("discover")}
                        className={`flex-1 flex items-center justify-center h-11 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === "discover" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-400"}`}
                    >
                        Discover
                    </button>
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 flex items-center justify-center h-11 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === "pending" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-400"}`}
                    >
                        Pending
                    </button>
                </div>

                {/* ── Action Button ── */}
                {activeTab === "discover" ? (
                    <button 
                        onClick={() => {
                            const searchInput = document.getElementById("mobile-biz-search");
                            if (searchInput) {
                                searchInput.focus();
                                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                        className="w-full h-14 bg-[#18181B] rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all"
                    >
                        <UserPlus className="w-5 h-5 text-white" />
                        <span className="text-[15px] font-bold text-white">Apply to New Trade</span>
                    </button>
                ) : (
                    <Link
                        href="/dashboard/referrer/applications"
                        className="w-full h-14 bg-[#18181B] rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all"
                    >
                        <Clock className="w-5 h-5 text-white" />
                        <span className="text-[15px] font-bold text-white">Open Full Applications View</span>
                    </Link>
                )}

                {/* ── List Section ── */}
                <div className="flex flex-col gap-4">
                    {activeTab === "discover" ? (
                        <>
                            <div className="bg-[#F4F4F5] rounded-2xl p-3.5 flex items-center gap-3">
                                <Search className="w-5 h-5 text-zinc-400" />
                                <input 
                                    id="mobile-biz-search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search businesses or trades..."
                                    className="bg-transparent border-none outline-none text-[15px] font-medium text-[#18181B] placeholder-zinc-400 w-full"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Businesses to explore</h3>
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{discoverCount} showing</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {filteredBusinesses.map(b => (
                                    <Link 
                                        key={b.id}
                                        href={`/dashboard/referrer/refer/${b.id}`}
                                        className="bg-white border border-[#E4E4E7] rounded-[20px] p-4 flex items-center gap-4 transition-all active:scale-[0.99]"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 overflow-hidden border border-[#E4E4E7]">
                                            {b.logo_url ? (
                                                <img src={b.logo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-zinc-300 font-black text-2xl">{b.name[0]}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-black text-[#18181B] truncate tracking-tight">{b.name}</p>
                                            <p className="text-[13px] font-medium text-zinc-500">
                                                {b.trade_category} · {b.suburb}
                                            </p>
                                        </div>
                                        <Info className="w-5 h-5 text-zinc-200 shrink-0" />
                                    </Link>
                                ))}
                                {filteredBusinesses.length === 0 && (
                                    <div className="py-12 text-center bg-[#F4F4F5] rounded-[20px] border border-dashed border-[#E4E4E7]">
                                        <p className="text-zinc-400 font-medium tracking-tight">No businesses match your search</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-[#18181B] tracking-tight">Pending applications</h3>
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{pendingApplications.length} waiting</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {pendingApplications.length === 0 ? (
                                    <div className="py-12 text-center bg-[#F4F4F5] rounded-[20px] border border-dashed border-[#E4E4E7]">
                                        <p className="text-zinc-400 font-medium tracking-tight">No pending applications right now</p>
                                    </div>
                                ) : (
                                    pendingApplications.map((app) => (
                                        <Link
                                            key={app.id}
                                            href="/dashboard/referrer/applications"
                                            className="bg-white border border-[#E4E4E7] rounded-[20px] p-4 flex items-center gap-4 transition-all active:scale-[0.99]"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-[#F4F4F5] flex items-center justify-center shrink-0 overflow-hidden border border-[#E4E4E7]">
                                                {app.business_logo ? (
                                                    <img src={app.business_logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-zinc-300 font-black text-2xl">{app.business_name[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-black text-[#18181B] truncate tracking-tight">{app.business_name}</p>
                                                <p className="text-[13px] font-medium text-zinc-500">
                                                    {app.trade_category} · {app.suburb}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending</p>
                                                <p className="text-[11px] font-bold text-zinc-400 mt-1">{new Date(app.applied_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
