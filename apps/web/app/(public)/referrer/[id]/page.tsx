"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
    MapPin, Award, Star, TrendingUp, Briefcase,
    MessageSquare, ArrowLeft, CheckCircle, ExternalLink
} from "lucide-react";
import { PageTransition } from "@/components/ui/PageTransition";

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

export default function PublicReferrerProfilePage() {
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
            router.push(`/sign-in?redirect_url=/referrer/${id}`);
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
            <PageTransition className="min-h-[60vh] bg-zinc-50">
                <div className="p-6 space-y-5 max-w-2xl mx-auto pt-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-200 rounded-full animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-5 w-40 bg-zinc-200 rounded-lg animate-pulse" />
                            <div className="h-3 w-28 bg-zinc-100 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-zinc-200 animate-pulse" />)}
                    </div>
                </div>
            </PageTransition>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="font-black text-zinc-700" style={{ fontSize: '24px' }}>Referrer not found</p>
                <Link href="/" className="text-orange-600 font-bold hover:underline" style={{ fontSize: '16px' }}>← Back to TradeRefer</Link>
            </div>
        );
    }

    const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const memberYear = profile.member_since ? new Date(profile.member_since).getFullYear() : null;
    const firstName = profile.full_name.split(" ")[0];

    const stats = [
        {
            label: "Quality Score",
            value: profile.quality_score,
            suffix: "/100",
            bg: "bg-amber-50",
            val: "text-amber-600",
            sub: "text-amber-500",
            icon: Star,
            desc: "Verified referrer rating"
        },
        {
            label: "Confirmed Leads",
            value: profile.confirmed_referrals,
            suffix: "",
            bg: "bg-emerald-50",
            val: "text-emerald-600",
            sub: "text-emerald-500",
            icon: TrendingUp,
            desc: "Successfully converted"
        },
        {
            label: "Businesses",
            value: profile.businesses_linked,
            suffix: "",
            bg: "bg-blue-50",
            val: "text-blue-600",
            sub: "text-blue-500",
            icon: Briefcase,
            desc: "Active partnerships"
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-50">

            {/* ── HERO HEADER ── */}
            <div className="bg-zinc-900 w-full">
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 font-bold transition-colors mb-8"
                        style={{ fontSize: '15px' }}
                    >
                        <ArrowLeft className="w-4 h-4" /> TradeRefer
                    </Link>

                    <div className="flex items-start gap-7 flex-wrap">
                        {/* Avatar */}
                        <div
                            className="w-28 h-28 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-2xl"
                            style={{ fontSize: '36px' }}
                        >
                            {profile.profile_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.profile_photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : initials}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                <h1 className="font-black text-white leading-tight" style={{ fontSize: '36px' }}>
                                    {profile.full_name}
                                </h1>
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-bold" style={{ fontSize: '13px' }}>
                                    <CheckCircle className="w-3.5 h-3.5" /> Verified Referrer
                                </span>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap mt-2 mb-4">
                                {(profile.suburb || profile.state) && (
                                    <span className="flex items-center gap-1.5 text-zinc-400 font-medium" style={{ fontSize: '16px' }}>
                                        <MapPin className="w-4 h-4" />
                                        {profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                    </span>
                                )}
                                {memberYear && (
                                    <span className="flex items-center gap-1.5 text-zinc-400 font-medium" style={{ fontSize: '16px' }}>
                                        <Award className="w-4 h-4" /> Member since {memberYear}
                                    </span>
                                )}
                            </div>

                            {profile.tagline && (
                                <p className="font-semibold text-orange-300 leading-snug" style={{ fontSize: '20px' }}>
                                    &ldquo;{profile.tagline}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

                {/* Authority stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {stats.map(s => (
                        <div key={s.label} className={`${s.bg} rounded-3xl px-6 py-8 flex flex-col items-center text-center`}>
                            <p className={`font-black ${s.val} leading-none`} style={{ fontSize: '52px' }}>
                                {s.value}
                                <span className={`font-black ${s.val}`} style={{ fontSize: '24px' }}>{s.suffix}</span>
                            </p>
                            <p className={`font-black ${s.val} uppercase tracking-widest mt-3`} style={{ fontSize: '13px' }}>{s.label}</p>
                            <p className="font-medium text-zinc-500 mt-1" style={{ fontSize: '14px' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Why partner */}
                {profile.profile_bio && (
                    <div className="bg-white rounded-3xl shadow-sm p-8">
                        <h2 className="font-black text-zinc-900 mb-5" style={{ fontSize: '24px' }}>
                            Why Partner With {firstName}
                        </h2>
                        <p className="font-medium text-zinc-700 leading-relaxed" style={{ fontSize: '18px', lineHeight: 1.75 }}>
                            {profile.profile_bio}
                        </p>
                    </div>
                )}

                {/* How it works blurb */}
                <div className="bg-zinc-900 rounded-3xl p-8">
                    <h2 className="font-black text-white mb-3" style={{ fontSize: '22px' }}>
                        How Partnering Works
                    </h2>
                    <p className="font-medium text-zinc-400 leading-relaxed mb-6" style={{ fontSize: '17px' }}>
                        {firstName} refers qualified homeowners and property owners from their personal network directly to your business — no ads, no cold leads. Every referral is pre-qualified and introduced personally.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { step: "01", title: "You Apply", desc: `Message ${firstName} to join their partner network` },
                            { step: "02", title: "Leads Come In", desc: `${firstName} refers warm, personal leads to your business` },
                            { step: "03", title: "Pay Per Lead", desc: "Only pay $8 when a lead is confirmed — zero risk" },
                        ].map(s => (
                            <div key={s.step} className="bg-zinc-800 rounded-2xl p-5">
                                <p className="font-black text-orange-500 mb-2" style={{ fontSize: '13px' }}>STEP {s.step}</p>
                                <p className="font-black text-white mb-1" style={{ fontSize: '18px' }}>{s.title}</p>
                                <p className="font-medium text-zinc-400" style={{ fontSize: '15px' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── STICKY FOOTER CTA ── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-2xl px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <p className="font-black text-zinc-900" style={{ fontSize: '18px' }}>
                            Ready to partner with {firstName}?
                        </p>
                        <p className="font-medium text-zinc-500" style={{ fontSize: '15px' }}>
                            Join their trade partner network and start receiving referrals.
                        </p>
                    </div>
                    <Link
                        href={`/dashboard/business/messages?referrer=${profile.id}`}
                        className="flex items-center gap-2.5 px-8 py-4 text-white font-black rounded-2xl transition-all shadow-lg shadow-orange-300 shrink-0"
                        style={{ background: '#FF7A00', fontSize: '18px' }}
                    >
                        <MessageSquare className="w-5 h-5" />
                        Message {firstName}
                    </Link>
                </div>
            </div>

            {/* Spacer for sticky footer */}
            <div className="h-24" />
        </div>
    );
}
