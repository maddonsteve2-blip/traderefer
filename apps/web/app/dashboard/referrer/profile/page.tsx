"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Briefcase, CheckCircle, Edit3,
    ArrowLeft, Save, Eye, TrendingUp, ExternalLink, Award, Camera, Video, CalendarDays
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const memberYear = profile.member_since ? new Date(profile.member_since).getFullYear() : null;

    const publicUrl = profileSlug ? `${siteUrl}/dashboard/referrer-profile/${profileSlug}` : null;

    return (
        <div className="min-h-screen bg-zinc-100">
            <div className="md:hidden px-4 py-4 space-y-4 bg-zinc-50">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href="/dashboard/referrer/manage" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-[22px] font-black text-zinc-900">My Profile</h1>
                            <p className="text-[13px] font-medium text-zinc-500">Edit the profile businesses see when you apply.</p>
                        </div>
                    </div>
                    {publicUrl && (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-zinc-900 px-3 text-[11px] font-black uppercase tracking-wider text-white"
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
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{item.label}</p>
                                <p className="mt-1 text-[18px] font-black text-zinc-900">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[24px] border border-zinc-200 bg-white p-4 space-y-4 shadow-sm">
                    <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Professional Tagline</label>
                        <textarea
                            rows={2}
                            maxLength={120}
                            placeholder="e.g. Property investor with a network of homeowners..."
                            value={tagline}
                            onChange={e => setTagline(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] font-medium text-zinc-900 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Referrer Bio</label>
                        <textarea
                            rows={5}
                            maxLength={500}
                            placeholder="Tell businesses who you are..."
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[15px] font-medium leading-relaxed text-zinc-900 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Profile Photo</label>
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
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-[14px] font-black text-white"
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
                <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-gray-200 shrink-0 gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/referrer/manage"
                            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-800 font-bold transition-colors group text-sm md:text-lg"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Manage
                        </Link>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-700 font-black text-sm md:text-lg">My Referrer Profile</span>
                    </div>
                    {publicUrl && (
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl transition-all text-xs md:text-sm"
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
                                <label className="block font-black text-zinc-700 text-xs uppercase tracking-widest">
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
                                <label className="block font-black text-zinc-700 text-xs uppercase tracking-widest">
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
                                <label className="block font-black text-zinc-700 text-xs uppercase tracking-widest">
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
                                                className="flex items-center justify-center gap-2 h-12 px-4 bg-zinc-900 hover:bg-zinc-700 text-white rounded-xl font-black transition-all text-sm"
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

                    {/* ── RIGHT: PREVIEW PANE (Stacked below on Mobile) ── */}
                    <div className="flex-1 h-auto md:h-full bg-gray-50 overflow-y-visible md:overflow-y-auto flex items-start justify-center p-6 md:p-16 order-2">
                        <div className="w-full max-w-2xl space-y-4">
                            <div className="flex items-center gap-2.5 mb-4 px-2">
                                <Eye className="w-5 h-5 text-zinc-400" />
                                <span className="font-black text-zinc-400 uppercase tracking-widest text-xs md:text-sm">Live Preview (Business View)</span>
                            </div>

                            <div className="bg-white border md:border-2 border-gray-100 rounded-[24px] md:rounded-[32px] overflow-hidden shadow-xl md:shadow-2xl">

                                {/* Header row */}
                                <div className="px-6 md:px-10 pt-8 md:pt-10 pb-6 md:pb-8 border-b md:border-b-2 border-gray-50">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 md:gap-8">
                                        {/* Avatar */}
                                        <div
                                            className="w-20 h-24 rounded-[20px] md:rounded-3xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden text-2xl shadow-lg border-4 border-white"
                                        >
                                            {(photoUrl || profile.profile_photo_url) ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={photoUrl || profile.profile_photo_url!} alt="" className="w-full h-full object-cover" />
                                            ) : initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 mb-3">
                                                <h3 className="font-black text-zinc-900 leading-none text-2xl md:text-3xl lg:text-4xl">{profile.full_name}</h3>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-green-200 bg-green-50 text-green-700 rounded-full font-black uppercase tracking-widest text-[10px] md:text-[10px]">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-start gap-4 md:gap-6 flex-wrap mb-4">
                                                {(profile.suburb || profile.state) && (
                                                    <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-sm md:text-base">
                                                        <MapPin className="w-4 h-4 text-orange-400" />{profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                                    </span>
                                                )}
                                                {memberYear && (
                                                    <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-sm md:text-base">
                                                        <Award className="w-4 h-4 text-amber-400" />Since {memberYear}
                                                    </span>
                                                )}
                                            </div>
                                            {(tagline || profile.tagline) && (
                                                <p className="font-bold text-zinc-600 leading-relaxed text-base md:text-lg">
                                                    {tagline || profile.tagline}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Grid stats row */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-gray-50">
                                    {([
                                        { label: "QUALITY SCORE",       value: profile.quality_score,       suffix: "/100", numClass: "text-green-600",  highlight: true,  Icon: CheckCircle },
                                        { label: "CONFIRMED LEADS",     value: profile.confirmed_referrals,  suffix: "",     numClass: "text-zinc-800",  highlight: false, Icon: TrendingUp },
                                        { label: "PARTNERSHIPS",        value: profile.businesses_linked,   suffix: "",     numClass: "text-zinc-800",  highlight: false, Icon: Briefcase },
                                        { label: "MEMBER SINCE",        value: memberYear ?? "—",            suffix: "",     numClass: "text-zinc-800",  highlight: false, Icon: CalendarDays },
                                    ] as const).map((t, i) => (
                                        <div key={t.label} className={`px-4 py-6 flex flex-col items-center text-center border-b md:border-b-0 last:border-b-0 ${i % 2 === 0 ? "border-r" : "lg:border-r"} ${t.highlight ? "bg-green-50/20" : "bg-white"}`}>
                                            <t.Icon className={`w-4 h-4 mb-3 ${t.highlight ? "text-green-500" : "text-gray-400"}`} />
                                            <p className={`font-black leading-none ${t.numClass} mb-1.5 text-2xl md:text-3xl`}>
                                                {t.value}
                                                {t.suffix && <span className={`font-black ${t.highlight ? "text-green-300" : "text-gray-300"} text-sm`}>{t.suffix}</span>}
                                            </p>
                                            <p className="font-black text-gray-400 tracking-widest uppercase text-[9px] md:text-[10px] leading-tight">{t.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Professional Summary */}
                                <div className="px-6 md:px-10 py-8">
                                    <p className="font-black text-zinc-900 mb-4 uppercase tracking-widest text-xs md:text-sm">Professional Summary</p>
                                    {(bio || profile.profile_bio) ? (
                                        <p className="font-bold text-zinc-500 leading-relaxed text-lg md:text-xl">
                                            {bio || profile.profile_bio}
                                        </p>
                                    ) : (
                                        <p className="font-bold text-gray-300 italic text-base md:text-lg">Add a bio above — this becomes your professional summary…</p>
                                    )}
                                </div>

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
        </div>
    );
}
