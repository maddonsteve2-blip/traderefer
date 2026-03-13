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
        <div className="flex flex-col bg-zinc-100" style={{ height: 'calc(100vh - 64px)' }}>

            {/* ── FIXED TOP BAR ── */}
            <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/referrer/manage"
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-800 font-bold transition-colors group text-lg"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Manage
                    </Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-700 font-black text-lg">My Referrer Profile</span>
                </div>
                {publicUrl && (
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl transition-all text-sm"
                    >
                        <ExternalLink className="w-4 h-4" /> View Live Resume
                    </a>
                )}
            </div>

            {/* ── SPLIT PANE BODY ── */}
            <div className="flex flex-row flex-1 overflow-hidden">

                {/* ── LEFT: EDITOR PANE (40%) ── */}
                <div className="w-2/5 h-full overflow-y-auto bg-white border-r border-gray-200 flex flex-col">
                    <div className="flex-1 p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <Edit3 className="w-6 h-6 text-orange-500" />
                            <h2 className="font-black text-zinc-900 text-2xl">Edit Your Profile</h2>
                        </div>
                        <p className="text-zinc-500 font-bold text-lg">
                            Businesses see this resume when you apply to their network.
                        </p>

                        {/* Tagline */}
                        <div>
                            <label className="block font-black text-zinc-700 mb-2.5 text-sm uppercase tracking-widest">
                                Professional Tagline
                            </label>
                            <textarea
                                rows={2}
                                maxLength={120}
                                placeholder="e.g. Property investor with a network of 200+ homeowners, landlords & renovators in Brisbane's south side"
                                value={tagline}
                                onChange={e => setTagline(e.target.value)}
                                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-zinc-900 font-bold resize-none transition-all text-xl leading-relaxed"
                            />
                            <p className="text-zinc-400 font-bold mt-2 text-sm">{tagline.length}/120 characters</p>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block font-black text-zinc-700 mb-2.5 text-sm uppercase tracking-widest">
                                Referrer Bio
                            </label>
                            <textarea
                                rows={5}
                                maxLength={500}
                                placeholder="Tell businesses who you are, the size of your network, and why you&apos;d be a great referrer for their trade..."
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-zinc-900 font-medium resize-none transition-all text-xl leading-relaxed"
                            />
                            <p className="text-zinc-400 font-bold mt-2 text-sm">{bio.length}/500 characters</p>
                        </div>

                        {/* Profile Photo Upload */}
                        <div>
                            <label className="block font-black text-zinc-700 mb-3 text-sm uppercase tracking-widest">
                                Profile Photo
                            </label>
                            <div className="flex items-center gap-6">
                                {/* Avatar preview */}
                                <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-xl text-3xl">
                                    {photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : initials}
                                </div>
                                {/* Upload button */}
                                <div className="flex-1 space-y-3">
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
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex items-center justify-center gap-2 flex-1 h-12 px-5 bg-white border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 text-zinc-700 hover:text-orange-600 rounded-2xl font-black transition-all disabled:opacity-60 shadow-sm text-base"
                                        >
                                            {uploading ? (
                                                <><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> Uploading…</>
                                            ) : (
                                                <><Camera className="w-5 h-5" /> {photoUrl ? "Change" : "Upload"}</>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openWebcam}
                                            disabled={uploading}
                                            className="flex items-center justify-center gap-2 flex-1 h-12 px-5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-2xl font-black transition-all disabled:opacity-60 shadow-lg shadow-zinc-200 text-base"
                                        >
                                            <Video className="w-5 h-5" /> Take Photo
                                        </button>
                                    </div>
                                    {photoUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setPhotoUrl("")}
                                            className="text-red-500 hover:text-red-600 font-bold transition-colors underline underline-offset-4 text-sm"
                                        >
                                            Remove photo
                                        </button>
                                    )}
                                    <p className="text-zinc-400 font-bold text-xs">JPG, PNG or WEBP · auto-cropped to square · max 5MB</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── PINNED SAVE BUTTON ── */}
                    <div className="shrink-0 px-10 pb-8 pt-6 bg-white border-t-2 border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-3 w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-2xl font-black transition-all shadow-xl shadow-orange-200 active:scale-95 text-xl h-16"
                        >
                            {saved ? <><CheckCircle className="w-6 h-6" /> Saved!</> : saving ? "Saving…" : <><Save className="w-6 h-6" /> Save Profile Changes</>}
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: PREVIEW PANE (60%) ── */}
                <div className="flex-1 h-full bg-gray-50 overflow-y-auto flex items-start justify-center p-16">
                    <div className="w-full max-w-2xl space-y-4">
                        <div className="flex items-center gap-2.5 mb-4 px-2">
                            <Eye className="w-5 h-5 text-zinc-400" />
                            <span className="font-black text-zinc-400 uppercase tracking-widest text-sm">Live Preview (Business View)</span>
                        </div>

                        <div className="bg-white border-2 border-gray-100 rounded-[32px] overflow-hidden shadow-2xl">

                            {/* Header row */}
                            <div className="px-10 pt-10 pb-8 border-b-2 border-gray-50">
                                <div className="flex items-center gap-8 flex-wrap">
                                    {/* Avatar */}
                                    <div
                                        className="w-20 h-24 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden text-2xl"
                                        style={{ boxShadow: '0 0 0 4px #fff, 0 0 0 6px #f3f4f6, 0 10px 30px rgba(0,0,0,0.15)' }}
                                    >
                                        {(photoUrl || profile.profile_photo_url) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photoUrl || profile.profile_photo_url!} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-2">
                                            <h3 className="font-black text-zinc-900 leading-none text-3xl">{profile.full_name}</h3>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-green-200 bg-green-50 text-green-700 rounded-full font-black uppercase tracking-widest text-[11px]">
                                                <CheckCircle className="w-3.5 h-3.5" /> Verified
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6 flex-wrap mb-3">
                                            {(profile.suburb || profile.state) && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-base">
                                                    <MapPin className="w-4 h-4 text-orange-400" />{profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                                </span>
                                            )}
                                            {memberYear && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-base">
                                                    <Award className="w-4 h-4 text-amber-400" />Since {memberYear}
                                                </span>
                                            )}
                                        </div>
                                        {(tagline || profile.tagline) && (
                                            <p className="font-bold text-zinc-600 leading-relaxed text-lg">
                                                {tagline || profile.tagline}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Full-width 4-tile data row */}
                            <div className="grid grid-cols-4">
                                {([
                                    { label: "QUALITY SCORE",       value: profile.quality_score,       suffix: "/100", numClass: "text-green-600",  highlight: true,  Icon: CheckCircle },
                                    { label: "CONFIRMED LEADS",     value: profile.confirmed_referrals,  suffix: "",     numClass: "text-zinc-800",  highlight: false, Icon: TrendingUp },
                                    { label: "ACTIVE PARTNERSHIPS", value: profile.businesses_linked,   suffix: "",     numClass: "text-zinc-800",  highlight: false, Icon: Briefcase },
                                    { label: "MEMBER SINCE",        value: memberYear ?? "—",            suffix: "",     numClass: "text-zinc-800",  highlight: false, Icon: CalendarDays },
                                ] as const).map((t, i) => (
                                    <div key={t.label} className={`px-6 py-8 flex flex-col items-center text-center${i < 3 ? " border-r-2 border-gray-100" : ""} ${t.highlight ? "bg-green-50/50" : "bg-gray-50/50"}`}>
                                        <t.Icon className={`w-5 h-5 mb-5 ${t.highlight ? "text-green-500" : "text-gray-400"}`} />
                                        <p className={`font-black leading-none ${t.numClass} mb-2 text-4xl`}>
                                            {t.value}
                                            {t.suffix && <span className={`font-black ${t.highlight ? "text-green-300" : "text-gray-300"} text-base`}>{t.suffix}</span>}
                                        </p>
                                        <p className="font-black text-gray-400 tracking-widest uppercase text-xs leading-tight">{t.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Professional Summary */}
                            <div className="px-10 py-8">
                                <p className="font-black text-zinc-900 mb-4 uppercase tracking-widest text-sm">Professional Summary</p>
                                {(bio || profile.profile_bio) ? (
                                    <p className="font-bold text-zinc-500 leading-relaxed text-xl leading-relaxed">
                                        {bio || profile.profile_bio}
                                    </p>
                                ) : (
                                    <p className="font-bold text-gray-300 italic text-lg">Add a bio above — this becomes your professional summary…</p>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ── WEBCAM MODAL ── */}
            {webcamOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <Video className="w-6 h-6 text-orange-400" />
                                <span className="font-black text-white text-xl">Take Your Photo</span>
                            </div>
                            <button
                                onClick={closeWebcam}
                                className="text-zinc-500 hover:text-white font-bold transition-colors text-base"
                            >
                                ✕ Cancel
                            </button>
                        </div>

                        {/* Video stream */}
                        <div className="relative bg-black">
                            {/* Square crop overlay guide */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full aspect-video object-cover"
                            />
                            {/* Crop circle guide */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-56 h-56 rounded-full border-4 border-white/40 border-dashed" />
                            </div>
                        </div>

                        {/* Snap button */}
                        <div className="px-8 py-8 text-center space-y-4">
                            <p className="font-bold text-zinc-400 text-base">
                                Centre your face in the circle, then tap Snap
                            </p>
                            <button
                                onClick={snapWebcam}
                                className="flex items-center justify-center gap-3 mx-auto px-12 h-16 rounded-2xl font-black text-white transition-all shadow-xl active:scale-95 text-xl"
                                style={{ background: '#FF7A00' }}
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
