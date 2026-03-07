"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { MapPin, Award, TrendingUp, Briefcase, ArrowLeft, CheckCircle, CalendarDays } from "lucide-react";

interface ReferrerProfile {
    id: string;
    full_name: string;
    suburb: string | null;
    state: string | null;
    profile_bio: string | null;
    tagline: string | null;
    profile_photo_url: string | null;
    quality_score: number;
    member_since: string | null;
    businesses_linked: number;
    confirmed_referrals: number;
}

export default function ReferrerProfileViewPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const [profile, setProfile] = useState<ReferrerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            router.push(`/sign-in?redirect_url=/dashboard/referrer-profile/${id}`);
            return;
        }
        if (!id) return;
        fetch(`${apiUrl}/referrer/${id}/profile`)
            .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
            .then(data => { setProfile(data); setLoading(false); })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [id, apiUrl, isLoaded, isSignedIn, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="font-black text-zinc-800" style={{ fontSize: '24px' }}>Referrer not found</p>
                <Link href="/dashboard" className="text-orange-600 font-bold hover:underline" style={{ fontSize: '16px' }}>← Back to Dashboard</Link>
            </div>
        );
    }

    const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const memberYear = profile.member_since ? new Date(profile.member_since).getFullYear() : null;
    const firstName = profile.full_name.split(" ")[0];

    const tiles = [
        {
            label: "QUALITY SCORE",
            value: profile.quality_score,
            suffix: "/100",
            desc: "Verified platform rating",
            numClass: "text-orange-500",
            icon: CheckCircle,
        },
        {
            label: "CONFIRMED LEADS",
            value: profile.confirmed_referrals,
            suffix: "",
            desc: "Successfully converted",
            numClass: "text-zinc-800",
            icon: TrendingUp,
        },
        {
            label: "ACTIVE PARTNERSHIPS",
            value: profile.businesses_linked,
            suffix: "",
            desc: "Businesses currently linked",
            numClass: "text-zinc-800",
            icon: Briefcase,
        },
        {
            label: "MEMBER SINCE",
            value: memberYear ?? "—",
            suffix: "",
            desc: "Year joined TradeRefer",
            numClass: "text-zinc-800",
            icon: CalendarDays,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full max-w-7xl mx-auto px-12 pt-20 pb-20">

                {/* ── BACK NAV ── */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-600 font-semibold transition-colors mb-10"
                    style={{ fontSize: '14px' }}
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* ── DOCUMENT CARD ── */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                    {/* ── HEADER SECTION ── */}
                    <div className="bg-white border-b border-gray-100 px-14 py-12">
                        <div className="flex items-center gap-10 flex-wrap">

                            {/* 160px Avatar with professional border */}
                            <div className="shrink-0 relative">
                                <div
                                    className="w-40 h-40 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-black text-white overflow-hidden"
                                    style={{ fontSize: '48px', boxShadow: '0 0 0 4px #fff, 0 0 0 5px #e5e7eb, 0 4px 24px rgba(0,0,0,0.10)' }}
                                >
                                    {profile.profile_photo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={profile.profile_photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                    ) : initials}
                                </div>
                            </div>

                            {/* Identity block */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <h1 className="font-black text-zinc-900 leading-none" style={{ fontSize: '36px' }}>
                                        {profile.full_name}
                                    </h1>
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1 border border-green-200 bg-green-50 text-green-700 rounded-full font-bold"
                                        style={{ fontSize: '12px' }}
                                    >
                                        <CheckCircle className="w-3 h-3" /> Verified Referrer
                                    </span>
                                </div>

                                <div className="flex items-center gap-6 flex-wrap mt-3 mb-4">
                                    {(profile.suburb || profile.state) && (
                                        <span className="flex items-center gap-1.5 text-zinc-500 font-medium" style={{ fontSize: '15px' }}>
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                        </span>
                                    )}
                                    {memberYear && (
                                        <span className="flex items-center gap-1.5 text-zinc-500 font-medium" style={{ fontSize: '15px' }}>
                                            <Award className="w-4 h-4 text-gray-400" /> Member since {memberYear}
                                        </span>
                                    )}
                                </div>

                                {profile.tagline && (
                                    <p className="font-medium text-zinc-600 leading-snug" style={{ fontSize: '22px' }}>
                                        {profile.tagline}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── DATA TILES ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 border-b border-gray-100">
                        {tiles.map(t => (
                            <div key={t.label} className="px-10 py-9 bg-white flex flex-col">
                                <t.icon className="w-5 h-5 text-gray-300 mb-5" />
                                <p className={`font-black leading-none ${t.numClass}`} style={{ fontSize: '48px' }}>
                                    {t.value}
                                    {t.suffix && (
                                        <span className="text-gray-300 font-black" style={{ fontSize: '24px' }}>{t.suffix}</span>
                                    )}
                                </p>
                                <p className="font-bold text-gray-400 tracking-widest uppercase mt-4" style={{ fontSize: '12px' }}>
                                    {t.label}
                                </p>
                                <p className="font-medium text-gray-400 mt-1" style={{ fontSize: '13px' }}>
                                    {t.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ── PROFESSIONAL SUMMARY ── */}
                    {profile.profile_bio && (
                        <div className="px-14 py-12">
                            <h2 className="font-black text-zinc-900 mb-6" style={{ fontSize: '24px' }}>
                                Professional Summary
                            </h2>
                            <div className="px-24">
                                <p className="font-medium text-zinc-600 leading-relaxed" style={{ fontSize: '20px', lineHeight: 1.85 }}>
                                    {profile.profile_bio}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
