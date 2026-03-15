"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, Star, MapPin, Search, Loader2, ChevronRight } from "lucide-react";

interface Application {
    id: string;
    status: string;
    applied_at: string;
    referrer_name: string;
    referrer_suburb: string;
    referrer_state: string;
    quality_score: number;
    profile_photo_url: string | null;
}

export function MobileBusinessApplications() {
    const { getToken, isLoaded } = useAuth();
    const router = useRouter();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"pending" | "all">("pending");

    const fetchApps = useCallback(async () => {
        const token = await getToken();
        const res = await fetch(`/api/backend/applications/business/pending`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            // The original code already had this Array.isArray check.
            // The instruction's "Code Edit" snippet was malformed and seemed to combine changes for different files.
            // This line is kept as it was, as it already correctly implements the Array.isArray check for 'applications'.
            setApps(Array.isArray(data.applications) ? data.applications : []);
        }
        setLoading(false);
    }, [getToken]);

    useEffect(() => { if (isLoaded) fetchApps(); }, [isLoaded, fetchApps]);

    const displayed = (Array.isArray(apps) ? apps : []).filter(a => {
        if (filter !== "pending") return true;
        return ["pending", "applied", "new"].includes(a.status.toLowerCase());
    });

    if (loading) {
        return (
            <div className="lg:hidden h-40 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="lg:hidden flex flex-col min-h-screen bg-white pb-32 pt-2 px-5">
            <h1 className="text-[28px] font-extrabold text-[#18181B] leading-tight mb-6">Referrer Requests</h1>

            {/* Filter */}
            <div className="flex bg-[#F4F4F5] p-1 rounded-2xl mb-6">
                <button 
                    onClick={() => setFilter("pending")}
                    className={`flex-1 flex items-center justify-center h-11 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${filter === "pending" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-400"}`}
                >
                    Pending
                </button>
                <button 
                    onClick={() => setFilter("all")}
                    className={`flex-1 flex items-center justify-center h-11 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all ${filter === "all" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-400"}`}
                >
                    All History
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {displayed.length === 0 ? (
                    <div className="p-12 text-center bg-zinc-50 rounded-[28px] border border-zinc-100 italic">
                        <p className="font-bold text-zinc-400 text-lg">No applications found.</p>
                    </div>
                ) : (
                    displayed.map(app => {
                        const initials = app.referrer_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                        return (
                            <button 
                                key={app.id}
                                onClick={() => router.push(`/dashboard/business/applications/${app.id}`)}
                                className="bg-white border border-[#E4E4E7] rounded-[24px] p-5 flex flex-col gap-4 active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden border border-orange-200">
                                        {app.profile_photo_url ? (
                                            <img src={app.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[18px] font-black text-[#18181B] truncate tracking-tight uppercase leading-none">{app.referrer_name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                <span className="text-[12px] font-black text-amber-700">{app.quality_score}</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[120px]">
                                                {app.referrer_suburb}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-300" />
                                </div>
                                <div className="h-px bg-zinc-100" />
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                        Applied {new Date(app.applied_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-[11px] font-black px-3 py-1 bg-orange-600 text-white rounded-full uppercase tracking-widest">
                                        REVIEW
                                    </span>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
