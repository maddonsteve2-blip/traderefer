"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    User, Star, MapPin, Briefcase, CheckCircle, Edit3,
    ArrowLeft, Save, Eye, TrendingUp, ExternalLink, Award, Camera, Video
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
    const [referrerId, setReferrerId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://traderefer.au";

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        try {
            const resized = await cropAndResizeImage(file, 400);
            const formData = new FormData();
            formData.append("file", resized, "avatar.jpg");
            const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
            const data = await res.json();
            if (data.url) setPhotoUrl(data.url);
        } catch (e) {
            console.error("Upload failed", e);
        }
        setUploading(false);
    };

    const cropAndResizeImage = (file: File, size: number): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d")!;
                const side = Math.min(img.width, img.height);
                const sx = (img.width - side) / 2;
                const sy = (img.height - side) / 2;
                ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
                canvas.toBlob(blob => {
                    if (!blob) return reject(new Error("Canvas toBlob failed"));
                    resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
                }, "image/jpeg", 0.92);
            };
            img.onerror = reject;
            img.src = url;
        });
    };

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
            setReferrerId(me.id || null);
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

    const publicUrl = referrerId ? `${siteUrl}/referrer/${referrerId}` : null;

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-6 py-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/referrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors font-bold" style={{ fontSize: '16px' }}>
                            <ArrowLeft className="w-4 h-4" /> Dashboard
                        </Link>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-700 font-bold" style={{ fontSize: '16px' }}>My Referrer Profile</span>
                    </div>
                    {publicUrl && (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl transition-all shadow-sm"
                            style={{ fontSize: '16px' }}
                        >
                            <ExternalLink className="w-4 h-4" /> View My Live Sales Page
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                    {/* ── LEFT: EDIT FORM (40%) ── */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg shadow-zinc-100 p-7 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Edit3 className="w-5 h-5 text-orange-500" />
                            <h2 className="font-black text-zinc-900" style={{ fontSize: '20px' }}>Edit Your Profile</h2>
                        </div>
                        <p className="text-zinc-500 font-medium" style={{ fontSize: '16px' }}>
                            This is your public sales page — businesses see this when you apply to join their network.
                        </p>

                        {/* Tagline */}
                        <div>
                            <label className="block font-black text-zinc-700 mb-2" style={{ fontSize: '15px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Professional Tagline
                            </label>
                            <textarea
                                rows={2}
                                maxLength={120}
                                placeholder="e.g. Property investor with a network of 200+ homeowners, landlords & renovators in Brisbane's south side"
                                value={tagline}
                                onChange={e => setTagline(e.target.value)}
                                className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-zinc-900 font-semibold resize-none"
                                style={{ fontSize: '18px', lineHeight: 1.5 }}
                            />
                            <p className="text-zinc-400 font-medium mt-1" style={{ fontSize: '13px' }}>{tagline.length}/120 characters</p>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block font-black text-zinc-700 mb-2" style={{ fontSize: '15px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Referrer Bio
                            </label>
                            <textarea
                                rows={5}
                                maxLength={500}
                                placeholder="Tell businesses who you are, the size of your network, and why you&apos;d be a great referrer for their trade..."
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-zinc-900 font-medium resize-none"
                                style={{ fontSize: '18px', lineHeight: 1.6 }}
                            />
                            <p className="text-zinc-400 font-medium mt-1" style={{ fontSize: '13px' }}>{bio.length}/500 characters</p>
                        </div>

                        {/* Profile Photo Upload */}
                        <div>
                            <label className="block font-black text-zinc-700 mb-2" style={{ fontSize: '15px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Profile Photo
                            </label>
                            <div className="flex items-center gap-4">
                                {/* Avatar preview */}
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-md" style={{ fontSize: '24px' }}>
                                    {photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : initials}
                                </div>
                                {/* Upload button */}
                                <div className="flex-1 space-y-2">
                                    {/* File picker (gallery / file system) */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) handleImageUpload(f);
                                            e.target.value = "";
                                        }}
                                    />
                                    {/* Camera / webcam input */}
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="user"
                                        className="hidden"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) handleImageUpload(f);
                                            e.target.value = "";
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex items-center justify-center gap-2 flex-1 h-11 px-4 bg-white border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 text-zinc-600 hover:text-orange-600 rounded-xl font-bold transition-all disabled:opacity-60"
                                            style={{ fontSize: '14px' }}
                                        >
                                            {uploading ? (
                                                <><div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> Uploading…</>
                                            ) : (
                                                <><Camera className="w-4 h-4" /> {photoUrl ? "Change" : "Upload"}</>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => cameraInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex items-center justify-center gap-2 flex-1 h-11 px-4 bg-zinc-900 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all disabled:opacity-60"
                                            style={{ fontSize: '14px' }}
                                        >
                                            <Video className="w-4 h-4" /> Take Photo
                                        </button>
                                    </div>
                                    {photoUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setPhotoUrl("")}
                                            className="text-zinc-400 hover:text-red-500 font-medium transition-colors"
                                            style={{ fontSize: '13px' }}
                                        >
                                            Remove photo
                                        </button>
                                    )}
                                    <p className="text-zinc-400 font-medium" style={{ fontSize: '12px' }}>JPG, PNG or WEBP · auto-cropped to square · max 5MB</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 w-full h-14 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-black transition-all shadow-lg shadow-orange-200"
                            style={{ fontSize: '18px' }}
                        >
                            {saved ? <><CheckCircle className="w-5 h-5" /> Profile Saved!</> : saving ? "Saving…" : <><Save className="w-5 h-5" /> Save Profile</>}
                        </button>

                        {publicUrl && (
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full h-12 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl font-bold transition-all"
                                style={{ fontSize: '16px' }}
                            >
                                <ExternalLink className="w-4 h-4" /> View My Live Sales Page
                            </a>
                        )}
                    </div>

                    {/* ── RIGHT: LIVE PREVIEW (60%) ── */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center gap-2 px-1 mb-1">
                            <Eye className="w-4 h-4 text-zinc-400" />
                            <span className="font-black text-zinc-500 uppercase tracking-widest" style={{ fontSize: '13px' }}>Live Preview — what businesses see on your sales page</span>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg shadow-zinc-100 overflow-hidden">
                            {/* Preview hero header */}
                            <div className="bg-zinc-900 px-8 py-8">
                                <div className="flex items-start gap-5">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-lg" style={{ fontSize: '28px' }}>
                                        {(photoUrl || profile.profile_photo_url) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photoUrl || profile.profile_photo_url!} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-white leading-tight" style={{ fontSize: '28px' }}>{profile.full_name}</h3>
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            {(profile.suburb || profile.state) && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                                    <MapPin className="w-4 h-4" />{profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                                </span>
                                            )}
                                            {memberYear && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-medium" style={{ fontSize: '15px' }}>
                                                    <Award className="w-4 h-4" />Member since {memberYear}
                                                </span>
                                            )}
                                        </div>
                                        {(tagline || profile.tagline) && (
                                            <p className="font-semibold text-orange-300 mt-2 leading-snug" style={{ fontSize: '16px' }}>
                                                &ldquo;{tagline || profile.tagline}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>{/* end preview hero */}

                            <div className="p-7 space-y-6">
                                {/* Stats grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: "Quality Score", value: profile.quality_score, suffix: "/100", bg: "bg-amber-50", val: "text-amber-600", sub: "text-amber-400" },
                                        { label: "Confirmed Leads", value: profile.confirmed_referrals, suffix: "", bg: "bg-emerald-50", val: "text-emerald-600", sub: "text-emerald-400" },
                                        { label: "Businesses", value: profile.businesses_linked, suffix: "", bg: "bg-blue-50", val: "text-blue-600", sub: "text-blue-400" },
                                    ].map(s => (
                                        <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-5 text-center`}>
                                            <p className={`font-black ${s.val} leading-none`} style={{ fontSize: '36px' }}>{s.value}<span style={{ fontSize: '18px' }}>{s.suffix}</span></p>
                                            <p className={`font-black ${s.sub} mt-2 uppercase tracking-wider`} style={{ fontSize: '11px' }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Bio / Why partner */}
                                <div>
                                    <p className="font-black text-zinc-500 uppercase tracking-widest mb-3" style={{ fontSize: '12px' }}>Why Partner With Me</p>
                                    {(bio || profile.profile_bio) ? (
                                        <div className="bg-zinc-50 rounded-2xl p-5">
                                            <p className="font-medium text-zinc-700 leading-relaxed" style={{ fontSize: '18px', lineHeight: 1.7 }}>
                                                {bio || profile.profile_bio}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-zinc-50 rounded-2xl p-5 border-2 border-dashed border-zinc-200 text-center">
                                            <p className="font-medium text-zinc-400" style={{ fontSize: '17px' }}>Add a bio above to tell businesses about your network</p>
                                        </div>
                                    )}
                                </div>

                                {/* CTA preview */}
                                <div className="rounded-2xl overflow-hidden" style={{ background: '#FF7A00' }}>
                                    <div className="px-6 py-5 text-center">
                                        <p className="font-black text-white" style={{ fontSize: '20px' }}>Message {profile.full_name.split(" ")[0]}</p>
                                        <p className="font-medium text-orange-100 mt-1" style={{ fontSize: '15px' }}>Start a conversation about partnering</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
