"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    User, Star, MapPin, Briefcase, CheckCircle, Edit3,
    ArrowLeft, Save, Eye, TrendingUp
} from "lucide-react";
import Link from "next/link";

interface Profile {
    full_name: string;
    suburb: string;
    state: string;
    quality_score: number;
    member_since: string | null;
    profile_bio: string | null;
    tagline: string | null;
    profile_photo_url: string | null;
    businesses_linked: number;
    confirmed_referrals: number;
}

export default function ReferrerProfilePage() {
    const { getToken, isLoaded, userId } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [bio, setBio] = useState("");
    const [tagline, setTagline] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        if (!isLoaded) return;
        (async () => {
            const token = await getToken();
            const meRes = await fetch(`${apiUrl}/referrer/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!meRes.ok) { router.push("/dashboard/referrer"); return; }
            const me = await meRes.json();

            // Get stats
            const statsRes = await fetch(`${apiUrl}/applications/referrer-profile/${me.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null);
            const stats = statsRes?.ok ? await statsRes.json() : {};

            const p: Profile = {
                full_name: me.full_name || "",
                suburb: me.suburb || "",
                state: me.state || "",
                quality_score: me.quality_score || 0,
                member_since: me.created_at ? me.created_at.slice(0, 10) : null,
                profile_bio: me.profile_bio || null,
                tagline: me.tagline || null,
                profile_photo_url: me.profile_photo_url || null,
                businesses_linked: stats.businesses_linked || 0,
                confirmed_referrals: stats.confirmed_referrals || 0,
            };
            setProfile(p);
            setBio(me.profile_bio || "");
            setTagline(me.tagline || "");
            setPhotoUrl(me.profile_photo_url || "");
            setLoading(false);
        })();
    }, [isLoaded, getToken, apiUrl, router]);

    const handleSave = async () => {
        setSaving(true);
        const token = await getToken();
        await fetch(`${apiUrl}/applications/my-profile`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ profile_bio: bio || null, tagline: tagline || null, profile_photo_url: photoUrl || null }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        if (profile) setProfile({ ...profile, profile_bio: bio, tagline, profile_photo_url: photoUrl });
    };

    if (loading || !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const memberYear = profile.member_since ? new Date(profile.member_since).getFullYear() : null;

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-6 py-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/dashboard/referrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold" style={{ fontSize: '16px' }}>
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-bold" style={{ fontSize: '16px' }}>My Referrer Profile</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                    {/* ── LEFT: EDIT FORM ── */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Edit3 className="w-5 h-5 text-orange-500" />
                            <h2 className="font-black text-zinc-900" style={{ fontSize: '20px' }}>Edit Your Profile</h2>
                        </div>
                        <p className="text-zinc-500 font-medium" style={{ fontSize: '16px' }}>
                            This is your public sales page — businesses see this when you apply to join their network.
                        </p>

                        {/* Tagline */}
                        <div>
                            <label className="block font-bold text-zinc-700 mb-1.5" style={{ fontSize: '16px' }}>
                                One-line tagline
                            </label>
                            <input
                                type="text"
                                maxLength={80}
                                placeholder="e.g. Property investor with a network of 200+ homeowners"
                                value={tagline}
                                onChange={e => setTagline(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-900 font-medium"
                                style={{ fontSize: '16px' }}
                            />
                            <p className="text-zinc-400 text-xs mt-1">{tagline.length}/80</p>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block font-bold text-zinc-700 mb-1.5" style={{ fontSize: '16px' }}>
                                About you (3–4 sentences)
                            </label>
                            <textarea
                                rows={4}
                                maxLength={500}
                                placeholder="Tell businesses who you are, your network, and why you'd be a great referrer..."
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-900 font-medium resize-none"
                                style={{ fontSize: '16px' }}
                            />
                            <p className="text-zinc-400 text-xs mt-1">{bio.length}/500</p>
                        </div>

                        {/* Photo URL */}
                        <div>
                            <label className="block font-bold text-zinc-700 mb-1.5" style={{ fontSize: '16px' }}>
                                Profile photo URL (optional)
                            </label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={photoUrl}
                                onChange={e => setPhotoUrl(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-900 font-medium"
                                style={{ fontSize: '16px' }}
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 w-full h-12 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all"
                            style={{ fontSize: '17px' }}
                        >
                            {saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : saving ? "Saving…" : <><Save className="w-5 h-5" /> Save Profile</>}
                        </button>
                    </div>

                    {/* ── RIGHT: LIVE PREVIEW ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1 mb-1">
                            <Eye className="w-4 h-4 text-zinc-400" />
                            <span className="font-bold text-zinc-500 uppercase tracking-wider" style={{ fontSize: '14px' }}>Preview — what businesses see</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                            {/* Avatar + name + tagline */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center font-black text-orange-600 shrink-0 overflow-hidden" style={{ fontSize: '22px' }}>
                                    {photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-zinc-900 leading-tight" style={{ fontSize: '22px' }}>{profile.full_name}</h3>
                                    {(tagline || profile.tagline) && (
                                        <p className="font-medium text-zinc-500 mt-1 leading-snug" style={{ fontSize: '16px' }}>
                                            {tagline || profile.tagline}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        {(profile.suburb || profile.state) && (
                                            <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                                <MapPin className="w-4 h-4" />{profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                            </span>
                                        )}
                                        {memberYear && (
                                            <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                                <Briefcase className="w-4 h-4" />Member since {memberYear}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats strip */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: "Quality Score", value: profile.quality_score, icon: Star, color: "text-amber-500 bg-amber-50" },
                                    { label: "Confirmed Leads", value: profile.confirmed_referrals, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
                                    { label: "Businesses", value: profile.businesses_linked, icon: Briefcase, color: "text-blue-600 bg-blue-50" },
                                ].map(s => (
                                    <div key={s.label} className="bg-zinc-50 rounded-xl p-3 text-center">
                                        <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mx-auto mb-1.5`}>
                                            <s.icon className="w-4 h-4" />
                                        </div>
                                        <p className="font-black text-zinc-900" style={{ fontSize: '20px' }}>{s.value}</p>
                                        <p className="font-bold text-zinc-400 leading-tight" style={{ fontSize: '13px' }}>{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Bio */}
                            {(bio || profile.profile_bio) ? (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                                    <p className="font-medium text-zinc-700 leading-relaxed" style={{ fontSize: '17px', lineHeight: 1.65 }}>
                                        {bio || profile.profile_bio}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-zinc-50 rounded-xl p-4 border border-dashed border-zinc-200 text-center">
                                    <p className="font-medium text-zinc-400" style={{ fontSize: '16px' }}>Add a bio to help businesses understand your network</p>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/dashboard/referrer/applications"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-600 transition-all"
                            style={{ fontSize: '16px' }}
                        >
                            View My Applications
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
