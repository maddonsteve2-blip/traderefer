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
            numClass: "text-green-600",
            icon: CheckCircle,
            highlight: true,
        },
        {
            label: "CONFIRMED LEADS",
            value: profile.confirmed_referrals,
            suffix: "",
            desc: "Successfully converted",
            numClass: "text-zinc-800",
            icon: TrendingUp,
            highlight: false,
        },
        {
            label: "ACTIVE PARTNERSHIPS",
            value: profile.businesses_linked,
            suffix: "",
            desc: "Businesses currently linked",
            numClass: "text-zinc-800",
            icon: Briefcase,
            highlight: false,
        },
        {
            label: "MEMBER SINCE",
            value: memberYear ?? "—",
            suffix: "",
            desc: "Year joined TradeRefer",
            numClass: "text-zinc-800",
            icon: CalendarDays,
            highlight: false,
        },
    ];

    return (
        <div className="min-h-screen bg-white">

                {/* ── DARK HEADER ── */}
                <div className="w-full px-12 pt-8 pb-10 bg-zinc-900">
                    {/* Back nav */}
                    <Link
                        href="/dashboard/referrer/manage"
                        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 font-semibold transition-colors mb-8 group"
                        style={{ fontSize: '14px' }}
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to Manage
                    </Link>

                    <div className="flex items-center gap-8 flex-wrap">
                        {/* Avatar */}
                        <div
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden"
                            style={{ fontSize: '32px', boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.4)' }}
                        >
                            {profile.profile_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.profile_photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : initials}
                        </div>

                        {/* Name + meta */}
                        <div>
                            <h1 className="font-black text-white leading-none mb-2" style={{ fontSize: '36px' }}>
                                {profile.full_name}
                            </h1>
                            <div className="flex items-center gap-5 flex-wrap mb-3">
                                {(profile.suburb || profile.state) && (
                                    <span className="flex items-center gap-1.5 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                        <MapPin className="w-3.5 h-3.5" />
                                        {profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                    </span>
                                )}
                                {memberYear && (
                                    <span className="flex items-center gap-1.5 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                        <Award className="w-3.5 h-3.5" /> Member since {memberYear}
                                    </span>
                                )}
                            </div>
                            {profile.tagline && (
                                <p className="font-semibold italic text-amber-400 leading-snug" style={{ fontSize: '20px' }}>
                                    &ldquo;{profile.tagline}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── CONTENT BODY ── */}
                <div className="px-12 py-12">

                {/* ── FULL-WIDTH DATA ROW ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden border border-gray-100 mb-16">
                    {tiles.map((t, i) => (
                        <div
                            key={t.label}
                            className={`px-10 py-10 flex flex-col${
                                i < tiles.length - 1 ? " border-r border-gray-100" : ""
                            } ${
                                t.highlight
                                    ? "bg-green-50"
                                    : "bg-gray-50"
                            }`}
                        >
                            <t.icon className={`w-5 h-5 mb-6 ${ t.highlight ? "text-green-400" : "text-gray-300" }`} />
                            <p className={`font-black leading-none ${t.numClass}`} style={{ fontSize: '48px' }}>
                                {t.value}
                                {t.suffix && (
                                    <span className={`font-black ${ t.highlight ? "text-green-300" : "text-gray-300" }`} style={{ fontSize: '24px' }}>{t.suffix}</span>
                                )}
                            </p>
                            <p className="font-bold text-gray-400 tracking-widest uppercase mt-5" style={{ fontSize: '14px' }}>
                                {t.label}
                            </p>
                            <p className="font-medium text-gray-400 mt-1.5" style={{ fontSize: '14px' }}>
                                {t.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── PROFESSIONAL SUMMARY ── */}
                {profile.profile_bio && (
                    <div>
                        <h2 className="font-black text-zinc-900 mb-6" style={{ fontSize: '28px' }}>
                            Professional Summary
                        </h2>
                        <p className="font-medium text-zinc-600 leading-relaxed max-w-4xl" style={{ fontSize: '22px', lineHeight: 1.85 }}>
                            {profile.profile_bio}
                        </p>
                    </div>
                )}

                </div>{/* end content body */}
        </div>
    );
}
