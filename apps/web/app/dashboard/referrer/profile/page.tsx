"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Briefcase, CheckCircle, Edit3, ArrowLeft,
    Save, Eye, TrendingUp, ExternalLink, Award, Camera, Video, CalendarDays,
    ShieldCheck, Zap, Crown, Trophy, Star, Target, Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/PageTransition";

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
    const [profileSlug, setProfileSlug] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [webcamOpen, setWebcamOpen] = useState(false);
    const apiUrl = "/api/backend";
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

    const openWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } });
            streamRef.current = stream;
            setWebcamOpen(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 50);
        } catch {
            toast.error("Could not access webcam. Please allow camera permissions and try again.");
        }
    };

    const closeWebcam = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setWebcamOpen(false);
    };

    const snapWebcam = async () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        const side = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext("2d")!;
        const sx = (video.videoWidth - side) / 2;
        const sy = (video.videoHeight - side) / 2;
        ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);
        canvas.toBlob(async blob => {
            if (!blob) return;
            closeWebcam();
            const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
            await handleImageUpload(file);
        }, "image/jpeg", 0.92);
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
            setProfileSlug(me.id || null);
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
            <PageTransition className="min-h-screen bg-zinc-100">
                <div className="p-6 space-y-4 max-w-2xl mx-auto pt-10">
                    <div className="h-7 w-36 bg-zinc-200 rounded-xl animate-pulse" />
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-100 rounded-2xl animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-40 bg-zinc-100 rounded-lg animate-pulse" />
                                <div className="h-4 w-24 bg-zinc-50 rounded-lg animate-pulse" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-zinc-50 rounded-2xl animate-pulse" />)}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-10 bg-zinc-50 rounded-xl animate-pulse" />)}
                    </div>
                </div>
            </PageTransition>
        );
    }

    const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const memberYear = profile.member_since ? new Date(profile.member_since).getFullYear() : null;

    const publicUrl = profileSlug ? `${siteUrl}/dashboard/referrer-profile/${profileSlug}` : null;

    return (
        <PageTransition className="min-h-screen bg-zinc-100">
            <div className="md:hidden px-4 py-4 space-y-4 bg-zinc-50">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-[22px] font-black text-zinc-900">My Profile</h1>
                        <p className="text-[13px] font-medium text-zinc-500">Edit the profile businesses see when you apply.</p>
                    </div>
                    {publicUrl && (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-orange-600 hover:bg-orange-700 px-3 text-[11px] font-black uppercase tracking-wider text-white transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                        </a>
                    )}
                </div>

                <div className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-orange-500 to-amber-400 text-[20px] font-black text-white">
                            {photoUrl ? (
                                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                            ) : initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[18px] font-black text-zinc-900 truncate">{profile.full_name}</p>
                            {(profile.suburb || profile.state) && (
                                <p className="mt-1 text-[13px] font-medium text-zinc-500">{profile.suburb}{profile.state ? `, ${profile.state}` : ""}</p>
                            )}
                            {(tagline || profile.tagline) && (
                                <p className="mt-2 text-[13px] font-medium leading-relaxed text-zinc-600">{tagline || profile.tagline}</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
                        {[
                            { label: "Quality", value: profile.quality_score },
                            { label: "Confirmed", value: profile.confirmed_referrals },
                            { label: "Partners", value: profile.businesses_linked },
                            { label: "Since", value: memberYear ?? "—" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[10px] font-bold text-zinc-400">{item.label}</p>
                                <p className="mt-1 text-[18px] font-black text-zinc-900">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[24px] border border-zinc-200 bg-white p-4 space-y-4 shadow-sm">
                    <div>
                        <label className="mb-2 block text-[11px] font-bold text-zinc-500">Professional Tagline</label>
                        <textarea
                            rows={2}
                            maxLength={120}
                            placeholder="e.g. Property investor with a network of homeowners..."
                            value={tagline}
                            onChange={e => setTagline(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] font-medium text-zinc-900 outline-none"
                        />
                        <p className="text-right text-[12px] font-medium text-zinc-400 mt-1">{tagline.length}/120</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-[11px] font-bold text-zinc-500">Referrer Bio</label>
                        <textarea
                            rows={5}
                            maxLength={500}
                            placeholder="Tell businesses who you are..."
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] font-medium leading-relaxed text-zinc-900 outline-none"
                        />
                        <p className="text-right text-[12px] font-medium text-zinc-400 mt-1">{bio.length}/500</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-[11px] font-bold text-zinc-500">Profile Photo</label>
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
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white text-[14px] font-black text-zinc-700"
                            >
                                <Camera className="w-4 h-4" /> {uploading ? "Uploading…" : "Choose Photo"}
                            </button>
                            <button
                                type="button"
                                onClick={openWebcam}
                                disabled={uploading}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 text-[14px] font-black text-white transition-colors"
                            >
                                <Video className="w-4 h-4" /> Take Photo
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 text-[15px] font-black text-white shadow-lg shadow-orange-600/20"
                    >
                        {saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : saving ? "Saving…" : <><Save className="w-5 h-5" /> Save Profile</>}
                    </button>
                </div>
            </div>

            <div className="hidden md:flex md:flex-col bg-zinc-100 min-h-screen">
                {/* ── TOP BAR ── */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 bg-white border-b border-zinc-100 shrink-0">
                    <div>
                        <h1 className="text-xl font-black text-zinc-900">My Profile</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-0.5">Your referral resume — businesses see this when you apply to their network.</p>
                    </div>
                    {publicUrl && (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all text-sm shrink-0"
                        >
                            <ExternalLink className="w-4 h-4" /> View Live Resume
                        </a>
                    )}
                </div>

                {/* ── BODY ── */}
                <div className="flex flex-col md:flex-row flex-1 overflow-visible md:overflow-hidden">

                    {/* ── LEFT: EDITOR PANE (Stacked on Mobile) ── */}
                    <div className="w-full md:w-2/5 md:h-full md:overflow-y-auto bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col order-1">
                        <div className="flex-1 p-6 md:p-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <Edit3 className="w-6 h-6 text-orange-500" />
                                <h2 className="font-black text-zinc-900 text-xl md:text-2xl">Edit Your Profile</h2>
                            </div>
                            <p className="text-zinc-500 font-bold text-base md:text-lg">
                                Businesses see this resume when you apply to their network.
                            </p>

                            {/* Tagline */}
                            <div className="space-y-2">
                                <label className="block font-bold text-zinc-600 text-xs">
                                    Professional Tagline
                                </label>
                                <textarea
                                    rows={2}
                                    maxLength={120}
                                    placeholder="e.g. Property investor with a network of 200+ homeowners..."
                                    value={tagline}
                                    onChange={e => setTagline(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-zinc-900 font-bold resize-none transition-all text-lg md:text-xl leading-relaxed"
                                />
                                <p className="text-zinc-400 font-bold text-xs">{tagline.length}/120 characters</p>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="block font-bold text-zinc-600 text-xs">
                                    Referrer Bio
                                </label>
                                <textarea
                                    rows={5}
                                    maxLength={500}
                                    placeholder="Tell businesses who you are..."
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-zinc-900 font-medium resize-none transition-all text-lg md:text-xl leading-relaxed"
                                />
                                <p className="text-zinc-400 font-bold text-xs">{bio.length}/500 characters</p>
                            </div>

                            {/* Profile Photo Upload */}
                            <div className="space-y-4">
                                <label className="block font-bold text-zinc-600 text-xs">
                                    Profile Photo
                                </label>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    {/* Avatar preview */}
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-[20px] md:rounded-[24px] bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-xl text-2xl md:text-3xl">
                                        {photoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    {/* Upload options */}
                                    <div className="flex-1 w-full space-y-3">
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="flex items-center justify-center gap-2 h-12 px-4 bg-white border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-zinc-700 hover:text-orange-600 rounded-xl font-black transition-all disabled:opacity-60 text-sm"
                                            >
                                                {uploading ? "Uploading…" : <><Camera className="w-5 h-5" /> Gallery</>}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={openWebcam}
                                                disabled={uploading}
                                                className="flex items-center justify-center gap-2 h-12 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black transition-all text-sm"
                                            >
                                                <Video className="w-5 h-5" /> Take Photo
                                            </button>
                                        </div>
                                        {photoUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setPhotoUrl("")}
                                                className="text-red-500 hover:text-red-600 font-bold transition-colors underline underline-offset-4 text-xs block mx-auto sm:mx-0"
                                            >
                                                Remove photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── PINNED SAVE BUTTON ── */}
                        <div className="md:shrink-0 px-6 md:px-10 py-6 md:pb-8 md:pt-6 bg-white border-t border-gray-100 sticky bottom-0 md:static z-20">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center justify-center gap-3 w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-2xl font-black transition-all shadow-xl shadow-orange-600/20 active:scale-95 text-lg md:text-xl h-14 md:h-16"
                            >
                                {saved ? <><CheckCircle className="w-6 h-6" /> Saved!</> : saving ? "Saving…" : <><Save className="w-6 h-6" /> Save Profile</>}
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT: PREVIEW PANE ── */}
                    <div className="flex-1 h-auto md:h-full bg-zinc-50 overflow-y-visible md:overflow-y-auto p-4 md:p-6 order-2">
                        {/* Label */}
                        <div className="flex items-center gap-2 mb-3">
                            <Eye className="w-4 h-4 text-zinc-400" />
                            <span className="font-semibold text-zinc-400 text-xs">Business View — exact copy of the live profile</span>
                        </div>

                        {/* ── MINI NAV BAR ── */}
                        <div className="bg-white border border-zinc-100 rounded-xl px-4 py-2 flex items-center gap-3 mb-3">
                            <span className="flex items-center gap-1 text-xs font-semibold text-zinc-500">
                                <ArrowLeft className="w-3 h-3" /> My Profile
                            </span>
                            <div className="flex-1" />
                            <span className="hidden sm:block text-[9px] font-medium text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-full">Business View · What businesses see when reviewing your application</span>
                        </div>

                        {/* ── HERO CARD ── */}
                        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mb-3">
                            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />
                            <div className="px-5 py-5">
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    {/* Avatar */}
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden text-xl ring-[3px] ring-orange-50">
                                        {(photoUrl || profile.profile_photo_url) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photoUrl || profile.profile_photo_url!} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                            <p className="font-black text-zinc-900 text-base">{profile.full_name}</p>
                                            {(() => { const s = profile.quality_score; const ql = s >= 96 ? {l:'Elite',c:'bg-amber-50 border-amber-200 text-amber-700'} : s >= 80 ? {l:'Expert',c:'bg-orange-50 border-orange-200 text-orange-700'} : s >= 60 ? {l:'Active',c:'bg-blue-50 border-blue-200 text-blue-700'} : {l:'Growing',c:'bg-green-50 border-green-200 text-green-700'}; return <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${ql.c}`}><Zap className="w-2.5 h-2.5" /> {ql.l} Referrer</span>; })()}
                                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700"><ShieldCheck className="w-2.5 h-2.5" /> Verified</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            {(profile.suburb || profile.state) && <span className="flex items-center gap-1 text-xs text-zinc-500 font-medium"><MapPin className="w-3 h-3 text-orange-400" />{profile.suburb}{profile.state ? `, ${profile.state}` : ""}</span>}
                                            {memberYear && <span className="flex items-center gap-1 text-xs text-zinc-500 font-medium"><CalendarDays className="w-3 h-3 text-zinc-400" /> Member since {memberYear}</span>}
                                        </div>
                                        {(tagline || profile.tagline) && <p className="text-xs italic font-semibold text-orange-600 mb-3">&ldquo;{tagline || profile.tagline}&rdquo;</p>}
                                        {/* Earned badge chips — same as live */}
                                        {(() => {
                                            const yrs = profile.member_since ? new Date().getFullYear() - new Date(profile.member_since).getFullYear() : 0;
                                            const earned = [
                                                { label: 'Verified Member',  show: true,                             cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: ShieldCheck, ic: 'text-emerald-500' },
                                                { label: 'Elite Referrer',   show: profile.quality_score >= 96,      cls: 'bg-amber-50 border-amber-200 text-amber-700',       icon: Crown,       ic: 'text-amber-500' },
                                                { label: 'Top Performer',    show: profile.quality_score >= 80,      cls: 'bg-orange-50 border-orange-200 text-orange-700',     icon: Trophy,      ic: 'text-orange-500' },
                                                { label: 'Rising Star',      show: profile.quality_score >= 60,      cls: 'bg-blue-50 border-blue-200 text-blue-700',           icon: Star,        ic: 'text-blue-400' },
                                                { label: 'Lead Champion',    show: profile.confirmed_referrals >= 5, cls: 'bg-violet-50 border-violet-200 text-violet-700',     icon: Target,      ic: 'text-violet-500' },
                                                { label: 'Lead Generator',   show: profile.confirmed_referrals >= 1, cls: 'bg-sky-50 border-sky-200 text-sky-700',              icon: TrendingUp,  ic: 'text-sky-500' },
                                                { label: 'Power Networker',  show: profile.businesses_linked >= 3,   cls: 'bg-green-50 border-green-200 text-green-700',        icon: Users,       ic: 'text-green-500' },
                                                { label: 'Networker',        show: profile.businesses_linked >= 1,   cls: 'bg-teal-50 border-teal-200 text-teal-700',           icon: Briefcase,   ic: 'text-teal-500' },
                                                { label: 'Veteran',          show: yrs >= 2,                         cls: 'bg-purple-50 border-purple-200 text-purple-700',     icon: Award,       ic: 'text-purple-500' },
                                            ].filter(b => b.show);
                                            return earned.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {earned.map(b => (
                                                        <span key={b.label} title={b.label} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border ${b.cls}`}>
                                                            <b.icon className={`w-3 h-3 ${b.ic}`} /> {b.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                    {/* Quality Score widget */}
                                    <div className="shrink-0 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-center min-w-[80px] self-start">
                                        <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Quality Score</p>
                                        <p className="text-2xl font-black text-zinc-900 leading-none">{profile.quality_score}<span className="text-xs font-black text-zinc-300">/100</span></p>
                                        <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${profile.quality_score >= 96 ? 'bg-amber-400' : profile.quality_score >= 80 ? 'bg-orange-400' : profile.quality_score >= 60 ? 'bg-blue-400' : 'bg-green-400'}`} style={{ width: `${profile.quality_score}%` }} />
                                        </div>
                                        <p className={`text-[9px] font-bold mt-1 ${profile.quality_score >= 96 ? 'text-amber-600' : profile.quality_score >= 80 ? 'text-orange-600' : profile.quality_score >= 60 ? 'text-blue-600' : 'text-green-600'}`}>
                                            {profile.quality_score >= 96 ? 'Elite' : profile.quality_score >= 80 ? 'Expert' : profile.quality_score >= 60 ? 'Active' : 'Growing'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── TWO-COLUMN BODY (mirrors live layout) ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_190px] gap-3 items-start">

                            {/* LEFT: About + Badges */}
                            <div className="space-y-3">
                                {/* About */}
                                {(bio || profile.profile_bio) ? (
                                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
                                        <h2 className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider mb-3 pl-2.5 border-l-2 border-orange-500">
                                            About {profile.full_name.split(" ")[0]}
                                        </h2>
                                        <p className="text-xs font-medium text-zinc-700 leading-relaxed line-clamp-4">{bio || profile.profile_bio}</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-4 text-center">
                                        <p className="text-xs font-medium text-zinc-400 italic">No professional summary added yet.</p>
                                    </div>
                                )}

                                {/* Badges & Achievements */}
                                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4">
                                    <h2 className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider mb-1 pl-2.5 border-l-2 border-orange-500">Badges &amp; Achievements</h2>
                                    <p className="text-[10px] text-zinc-400 mb-3 pl-2.5 mt-1">Earned through activity and performance on TradeRefer</p>
                                    {(() => {
                                        const yrs = profile.member_since ? new Date().getFullYear() - new Date(profile.member_since).getFullYear() : 0;
                                        const ALL = [
                                            { label: 'Verified Member',  show: true,                             cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: ShieldCheck, ic: 'text-emerald-500' },
                                            { label: 'Elite Referrer',   show: profile.quality_score >= 96,      cls: 'bg-amber-50 border-amber-200 text-amber-700',       icon: Crown,       ic: 'text-amber-500' },
                                            { label: 'Top Performer',    show: profile.quality_score >= 80,      cls: 'bg-orange-50 border-orange-200 text-orange-700',     icon: Trophy,      ic: 'text-orange-500' },
                                            { label: 'Rising Star',      show: profile.quality_score >= 60,      cls: 'bg-blue-50 border-blue-200 text-blue-700',           icon: Star,        ic: 'text-blue-400' },
                                            { label: 'Lead Champion',    show: profile.confirmed_referrals >= 5, cls: 'bg-violet-50 border-violet-200 text-violet-700',     icon: Target,      ic: 'text-violet-500' },
                                            { label: 'Lead Generator',   show: profile.confirmed_referrals >= 1, cls: 'bg-sky-50 border-sky-200 text-sky-700',              icon: TrendingUp,  ic: 'text-sky-500' },
                                            { label: 'Power Networker',  show: profile.businesses_linked >= 3,   cls: 'bg-green-50 border-green-200 text-green-700',        icon: Users,       ic: 'text-green-500' },
                                            { label: 'Networker',        show: profile.businesses_linked >= 1,   cls: 'bg-teal-50 border-teal-200 text-teal-700',           icon: Briefcase,   ic: 'text-teal-500' },
                                            { label: 'Veteran',          show: yrs >= 2,                         cls: 'bg-purple-50 border-purple-200 text-purple-700',     icon: Award,       ic: 'text-purple-500' },
                                        ];
                                        const earned = ALL.filter(b => b.show);
                                        const locked = ALL.filter(b => !b.show);
                                        return (
                                            <>
                                                {earned.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {earned.map(b => (
                                                            <div key={b.label} className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border ${b.cls} min-w-[80px] text-center`}>
                                                                <b.icon className={`w-4 h-4 ${b.ic}`} />
                                                                <div>
                                                                    <p className="text-[10px] font-bold leading-tight">{b.label}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {locked.length > 0 && (
                                                    <div>
                                                        <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Locked — keep growing to unlock</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {locked.map(b => (
                                                                <div key={b.label} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-100 bg-zinc-50 opacity-50">
                                                                    <b.icon className="w-3 h-3 text-zinc-400" />
                                                                    <span className="text-[10px] font-semibold text-zinc-400">{b.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* RIGHT SIDEBAR */}
                            <div className="space-y-3">
                                {/* Track Record */}
                                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                                    <div className="px-4 pt-3 pb-1">
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Track Record</h3>
                                    </div>
                                    <div className="divide-y divide-zinc-50">
                                        {([
                                            { label: 'Confirmed Leads',     value: profile.confirmed_referrals,    icon: TrendingUp,   color: 'text-blue-500',   bg: 'bg-blue-50' },
                                            { label: 'Active Partnerships', value: profile.businesses_linked,      icon: Briefcase,    color: 'text-green-500',  bg: 'bg-green-50' },
                                            { label: 'Quality Score',       value: `${profile.quality_score}/100`, icon: CheckCircle,  color: 'text-orange-500', bg: 'bg-orange-50' },
                                            { label: 'Member Since',        value: memberYear ?? '—',              icon: CalendarDays, color: 'text-zinc-500',   bg: 'bg-zinc-100' },
                                        ] as const).map(stat => (
                                            <div key={stat.label} className="flex items-center gap-2 px-4 py-2.5">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${stat.bg} shrink-0`}>
                                                    <stat.icon className={`w-3 h-3 ${stat.color}`} />
                                                </div>
                                                <p className="flex-1 text-[10px] font-medium text-zinc-600 truncate">{stat.label}</p>
                                                <p className="text-xs font-black text-zinc-900 shrink-0">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4">
                                    <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide mb-0.5">Interested?</p>
                                    <p className="text-[11px] font-bold text-zinc-800 mb-3 leading-snug">Add {profile.full_name.split(" ")[0]} to your referral network and start receiving quality leads</p>
                                    <div className="flex items-center justify-center w-full bg-orange-500 text-white rounded-xl h-8 text-[11px] font-bold">
                                        View Referral Network
                                    </div>
                                </div>

                                {/* Next badge */}
                                {(() => {
                                    const yrs = profile.member_since ? new Date().getFullYear() - new Date(profile.member_since).getFullYear() : 0;
                                    const locked = [
                                        { label: 'Elite Referrer',   show: profile.quality_score >= 96,      icon: Crown      },
                                        { label: 'Top Performer',    show: profile.quality_score >= 80,      icon: Trophy     },
                                        { label: 'Rising Star',      show: profile.quality_score >= 60,      icon: Star       },
                                        { label: 'Lead Champion',    show: profile.confirmed_referrals >= 5, icon: Target     },
                                        { label: 'Lead Generator',   show: profile.confirmed_referrals >= 1, icon: TrendingUp },
                                        { label: 'Power Networker',  show: profile.businesses_linked >= 3,   icon: Users      },
                                        { label: 'Networker',        show: profile.businesses_linked >= 1,   icon: Briefcase  },
                                        { label: 'Veteran',          show: yrs >= 2,                         icon: Award      },
                                    ].filter(b => !b.show);
                                    if (locked.length === 0) return null;
                                    const next = locked[0];
                                    return (
                                        <div className="bg-white border border-zinc-200 rounded-2xl p-3">
                                            <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Next Badge to Unlock</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                                                    <next.icon className="w-4 h-4 text-zinc-400" />
                                                </div>
                                                <p className="text-xs font-bold text-zinc-700">{next.label}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── WEBCAM MODAL ── */}
            {webcamOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 md:p-4">
                    <div className="bg-zinc-900 md:rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg h-full md:h-auto flex flex-col">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-orange-400" />
                                <span className="font-black text-white text-lg">Take Your Photo</span>
                            </div>
                            <button
                                onClick={closeWebcam}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Video stream */}
                        <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {/* Crop circle guide */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-white/40 border-dashed" />
                            </div>
                        </div>

                        {/* Snap button */}
                        <div className="px-6 py-8 md:py-10 text-center space-y-4 bg-zinc-900">
                            <p className="font-bold text-zinc-500 text-sm">
                                Centre your face in the circle.
                            </p>
                            <button
                                onClick={snapWebcam}
                                className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto h-16 bg-[#FF7A00] rounded-2xl font-black text-white transition-all shadow-xl shadow-orange-600/20 active:scale-95 text-lg"
                            >
                                <Camera className="w-6 h-6" /> Snap Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
