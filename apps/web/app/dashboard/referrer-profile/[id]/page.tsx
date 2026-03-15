"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
    MapPin, Award, TrendingUp, Briefcase, ArrowLeft, CheckCircle,
    CalendarDays, ShieldCheck, Star, Zap, Trophy, Crown, Target, Users,
} from "lucide-react";

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

const BADGE_DEFS = [
    { id: 'verified',        label: 'Verified Member',  desc: 'Identity confirmed on TradeRefer',  icon: ShieldCheck, colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-700', iconClass: 'text-emerald-500', earned: (_p: ReferrerProfile) => true },
    { id: 'elite',           label: 'Elite Referrer',   desc: 'Quality score 96+',                 icon: Crown,       colorClass: 'bg-amber-50 border-amber-200 text-amber-700',       iconClass: 'text-amber-500',  earned: (p: ReferrerProfile) => p.quality_score >= 96 },
    { id: 'top_performer',   label: 'Top Performer',    desc: 'Quality score 80+',                 icon: Trophy,      colorClass: 'bg-orange-50 border-orange-200 text-orange-700',     iconClass: 'text-orange-500', earned: (p: ReferrerProfile) => p.quality_score >= 80 },
    { id: 'rising_star',     label: 'Rising Star',      desc: 'Quality score 60+',                 icon: Star,        colorClass: 'bg-blue-50 border-blue-200 text-blue-700',           iconClass: 'text-blue-400',   earned: (p: ReferrerProfile) => p.quality_score >= 60 },
    { id: 'lead_champion',   label: 'Lead Champion',    desc: '5+ confirmed leads',                icon: Target,      colorClass: 'bg-violet-50 border-violet-200 text-violet-700',     iconClass: 'text-violet-500', earned: (p: ReferrerProfile) => p.confirmed_referrals >= 5 },
    { id: 'lead_generator',  label: 'Lead Generator',   desc: '1+ confirmed leads',                icon: TrendingUp,  colorClass: 'bg-sky-50 border-sky-200 text-sky-700',              iconClass: 'text-sky-500',    earned: (p: ReferrerProfile) => p.confirmed_referrals >= 1 },
    { id: 'power_networker', label: 'Power Networker',  desc: '3+ active partnerships',            icon: Users,       colorClass: 'bg-green-50 border-green-200 text-green-700',        iconClass: 'text-green-500',  earned: (p: ReferrerProfile) => p.businesses_linked >= 3 },
    { id: 'networker',       label: 'Networker',        desc: '1+ active partnership',             icon: Briefcase,   colorClass: 'bg-teal-50 border-teal-200 text-teal-700',           iconClass: 'text-teal-500',   earned: (p: ReferrerProfile) => p.businesses_linked >= 1 },
    { id: 'veteran',         label: 'Veteran',          desc: '2+ years on platform',              icon: Award,       colorClass: 'bg-purple-50 border-purple-200 text-purple-700',     iconClass: 'text-purple-500', earned: (p: ReferrerProfile) => { const y = p.member_since ? new Date().getFullYear() - new Date(p.member_since).getFullYear() : 0; return y >= 2; } },
] as const;

function qualityMeta(score: number) {
    if (score >= 96) return { label: 'Elite',   barColor: 'bg-amber-400',  textColor: 'text-amber-600',  badgeBg: 'bg-amber-50',  badgeBorder: 'border-amber-200' };
    if (score >= 80) return { label: 'Expert',  barColor: 'bg-orange-400', textColor: 'text-orange-600', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-200' };
    if (score >= 60) return { label: 'Active',  barColor: 'bg-blue-400',   textColor: 'text-blue-600',   badgeBg: 'bg-blue-50',   badgeBorder: 'border-blue-200' };
    if (score >= 30) return { label: 'Growing', barColor: 'bg-green-400',  textColor: 'text-green-600',  badgeBg: 'bg-green-50',  badgeBorder: 'border-green-200' };
    return              { label: 'New',     barColor: 'bg-zinc-300',   textColor: 'text-zinc-500',   badgeBg: 'bg-zinc-50',   badgeBorder: 'border-zinc-200' };
}

export default function ReferrerProfileViewPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const [profile, setProfile] = useState<ReferrerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const apiUrl = "/api/backend";

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
                <p className="font-black text-zinc-800 text-2xl">Referrer not found</p>
                <Link href="/dashboard" className="text-orange-600 font-bold hover:underline text-base">← Back to Dashboard</Link>
            </div>
        );
    }

    const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const memberYear = profile.member_since ? new Date(profile.member_since).getFullYear() : null;
    const firstName = profile.full_name.split(" ")[0];
    const qm = qualityMeta(profile.quality_score);
    const allBadges = BADGE_DEFS.map(b => ({ ...b, isEarned: b.earned(profile) }));
    const earnedBadges = allBadges.filter(b => b.isEarned);
    const lockedBadges = allBadges.filter(b => !b.isEarned);

    return (
        <div className="min-h-screen bg-zinc-50">

            {/* ── TOP NAV ── */}
            <div className="bg-white border-b border-zinc-100 sticky top-0 z-10">
                <div className="w-full px-6 md:px-10 lg:px-16 py-3 flex items-center gap-4">
                    <Link
                        href="/dashboard/referrer/profile"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> My Profile
                    </Link>
                    <div className="flex-1" />
                    <span className="hidden sm:block text-xs font-medium text-zinc-400 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full">
                        Business View · What businesses see when reviewing your application
                    </span>
                </div>
            </div>

            <div className="w-full px-6 md:px-10 lg:px-16 py-6 md:py-8">

                {/* ── HERO CARD ── */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
                    <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />
                    <div className="px-6 md:px-10 py-7 md:py-8">
                        <div className="flex flex-col sm:flex-row items-start gap-6">

                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden text-3xl ring-4 ring-orange-50">
                                {profile.profile_photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={profile.profile_photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : initials}
                            </div>

                            {/* Name + meta */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900">{profile.full_name}</h1>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${qm.badgeBg} ${qm.badgeBorder} ${qm.textColor}`}>
                                        <Zap className="w-3 h-3" /> {qm.label} Referrer
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                                        <ShieldCheck className="w-3 h-3" /> Verified
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 md:gap-5 mb-3">
                                    {(profile.suburb || profile.state) && (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                                            <MapPin className="w-3.5 h-3.5 text-orange-400" />
                                            {profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                        </span>
                                    )}
                                    {memberYear && (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                                            <CalendarDays className="w-3.5 h-3.5 text-zinc-400" /> Member since {memberYear}
                                        </span>
                                    )}
                                </div>

                                {profile.tagline && (
                                    <p className="text-base font-semibold italic text-orange-600 mb-4">
                                        &ldquo;{profile.tagline}&rdquo;
                                    </p>
                                )}

                                {/* Earned badge chips row */}
                                {earnedBadges.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {earnedBadges.map(b => (
                                            <span
                                                key={b.id}
                                                title={b.desc}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${b.colorClass}`}
                                            >
                                                <b.icon className={`w-3.5 h-3.5 ${b.iconClass}`} /> {b.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quality Score widget */}
                            <div className="shrink-0 bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-center min-w-[130px] self-start">
                                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Quality Score</p>
                                <p className="text-4xl font-black text-zinc-900 leading-none">
                                    {profile.quality_score}<span className="text-lg font-black text-zinc-300">/100</span>
                                </p>
                                <div className="mt-3 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${qm.barColor}`} style={{ width: `${profile.quality_score}%` }} />
                                </div>
                                <p className={`text-xs font-bold mt-2 ${qm.textColor}`}>{qm.label}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TWO-COLUMN BODY ── */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5 items-start">

                    {/* ── LEFT ── */}
                    <div className="space-y-5">

                        {/* Professional Summary */}
                        {profile.profile_bio ? (
                            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 md:p-8">
                                <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-4 pl-3 border-l-2 border-orange-500">
                                    About {firstName}
                                </h2>
                                <p className="text-zinc-700 font-medium leading-relaxed text-base whitespace-pre-line">
                                    {profile.profile_bio}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-6 md:p-8 text-center">
                                <p className="text-zinc-400 font-medium text-sm">No professional summary added yet.</p>
                            </div>
                        )}

                        {/* Badges & Achievements */}
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 md:p-8">
                            <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider mb-1 pl-3 border-l-2 border-orange-500">
                                Badges &amp; Achievements
                            </h2>
                            <p className="text-xs text-zinc-400 mb-5 pl-3 mt-1">Earned through activity and performance on TradeRefer</p>

                            {earnedBadges.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-5">
                                    {earnedBadges.map(b => (
                                        <div key={b.id} className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border ${b.colorClass} min-w-[100px] text-center`}>
                                            <b.icon className={`w-5 h-5 ${b.iconClass}`} />
                                            <div>
                                                <p className="text-xs font-bold leading-tight">{b.label}</p>
                                                <p className="text-[10px] font-medium opacity-70 mt-0.5">{b.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {lockedBadges.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Locked — keep growing to unlock</p>
                                    <div className="flex flex-wrap gap-2">
                                        {lockedBadges.map(b => (
                                            <div key={b.id} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-100 bg-zinc-50 opacity-50" title={b.desc}>
                                                <b.icon className="w-3.5 h-3.5 text-zinc-400" />
                                                <span className="text-xs font-semibold text-zinc-400">{b.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div className="space-y-4">

                        {/* Track Record */}
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-5 pt-4 pb-1">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Track Record</h3>
                            </div>
                            <div className="divide-y divide-zinc-50">
                                {[
                                    { label: 'Confirmed Leads',     value: profile.confirmed_referrals,    icon: TrendingUp,   color: 'text-blue-500',   bg: 'bg-blue-50' },
                                    { label: 'Active Partnerships', value: profile.businesses_linked,      icon: Briefcase,    color: 'text-green-500',  bg: 'bg-green-50' },
                                    { label: 'Quality Score',       value: `${profile.quality_score}/100`, icon: CheckCircle,  color: 'text-orange-500', bg: 'bg-orange-50' },
                                    { label: 'Member Since',        value: memberYear ?? '—',              icon: CalendarDays, color: 'text-zinc-500',   bg: 'bg-zinc-100' },
                                ].map(stat => (
                                    <div key={stat.label} className="flex items-center gap-3 px-5 py-3.5">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.bg} shrink-0`}>
                                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        </div>
                                        <p className="flex-1 text-sm font-medium text-zinc-600 min-w-0">{stat.label}</p>
                                        <p className="text-base font-black text-zinc-900 shrink-0">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA for business owner */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Interested?</p>
                            <p className="text-sm font-bold text-zinc-800 mb-4 leading-snug">Add {firstName} to your referral network and start receiving quality leads</p>
                            <Link
                                href="/dashboard/business/force"
                                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 text-sm font-bold transition-all"
                            >
                                View Referral Network
                            </Link>
                        </div>

                        {/* Next badge to unlock */}
                        {lockedBadges.length > 0 && (
                            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Next Badge to Unlock</p>
                                {(() => {
                                    const next = lockedBadges[0];
                                    return (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                                                <next.icon className="w-5 h-5 text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-700">{next.label}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">{next.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
