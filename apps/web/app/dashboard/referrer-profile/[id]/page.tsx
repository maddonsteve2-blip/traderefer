"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { MapPin, Award, Star, TrendingUp, Briefcase, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";

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
            label: "Quality Score",
            value: profile.quality_score,
            suffix: "/100",
            desc: "Verified referrer rating",
            bg: "bg-green-50",
            border: "border-green-100",
            val: "text-green-600",
            sub: "text-green-500",
            icon: ShieldCheck,
        },
        {
            label: "Confirmed Leads",
            value: profile.confirmed_referrals,
            suffix: "",
            desc: "Successfully converted",
            bg: "bg-orange-50",
            border: "border-orange-100",
            val: "text-orange-600",
            sub: "text-orange-500",
            icon: TrendingUp,
        },
        {
            label: "Active Partnerships",
            value: profile.businesses_linked,
            suffix: "",
            desc: "Businesses currently linked",
            bg: "bg-blue-50",
            border: "border-blue-100",
            val: "text-blue-600",
            sub: "text-blue-500",
            icon: Briefcase,
        },
        {
            label: "Member Since",
            value: memberYear ?? "—",
            suffix: "",
            desc: "Year joined TradeRefer",
            bg: "bg-violet-50",
            border: "border-violet-100",
            val: "text-violet-600",
            sub: "text-violet-500",
            icon: Award,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-16">

            {/* ── WHITE HEADER ── */}
            <div className="bg-white border-b border-gray-200 shadow-sm w-full">
                <div className="w-full px-12 py-10">
                    {/* Back nav */}
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 font-bold transition-colors mb-8"
                        style={{ fontSize: '15px' }}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    {/* Identity row */}
                    <div className="flex items-center gap-8 flex-wrap">
                        {/* Avatar */}
                        <div
                            className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-xl ring-4 ring-white"
                            style={{ fontSize: '36px' }}
                        >
                            {profile.profile_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.profile_photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : initials}
                        </div>

                        {/* Name block */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h1 className="font-black text-zinc-900 leading-tight" style={{ fontSize: '36px' }}>
                                    {profile.full_name}
                                </h1>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-black" style={{ fontSize: '13px' }}>
                                    <CheckCircle className="w-3.5 h-3.5" /> Verified Referrer
                                </span>
                            </div>

                            <div className="flex items-center gap-5 flex-wrap mb-3">
                                {(profile.suburb || profile.state) && (
                                    <span className="flex items-center gap-1.5 text-zinc-500 font-medium" style={{ fontSize: '16px' }}>
                                        <MapPin className="w-4 h-4 text-zinc-400" />
                                        {profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                    </span>
                                )}
                                {memberYear && (
                                    <span className="flex items-center gap-1.5 text-zinc-500 font-medium" style={{ fontSize: '16px' }}>
                                        <Star className="w-4 h-4 text-zinc-400" /> Member since {memberYear}
                                    </span>
                                )}
                            </div>

                            {profile.tagline && (
                                <p className="font-semibold italic text-zinc-500 leading-snug" style={{ fontSize: '18px' }}>
                                    &ldquo;{profile.tagline}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="w-full px-12 py-10 space-y-10">

                {/* ── 4 OVERSIZED AUTHORITY TILES ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {tiles.map(t => (
                        <div
                            key={t.label}
                            className={`${t.bg} border ${t.border} rounded-3xl px-8 py-9 flex flex-col items-start`}
                        >
                            <t.icon className={`w-6 h-6 ${t.sub} mb-4 opacity-80`} />
                            <p className={`font-black ${t.val} leading-none`} style={{ fontSize: '42px' }}>
                                {t.value}<span className={`${t.val} opacity-60`} style={{ fontSize: '22px' }}>{t.suffix}</span>
                            </p>
                            <p className="font-black text-zinc-700 mt-3" style={{ fontSize: '16px' }}>{t.label}</p>
                            <p className={`font-medium ${t.sub} mt-1`} style={{ fontSize: '14px' }}>{t.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── EXECUTIVE SUMMARY ── */}
                {profile.profile_bio && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-10 py-10">
                        <h2 className="font-black text-zinc-900 mb-5" style={{ fontSize: '26px' }}>
                            About {firstName}
                        </h2>
                        <p className="font-medium text-zinc-700 leading-relaxed" style={{ fontSize: '20px', lineHeight: 1.8 }}>
                            {profile.profile_bio}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
