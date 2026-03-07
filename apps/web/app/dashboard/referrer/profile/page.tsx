"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Briefcase, CheckCircle, Edit3,
    ArrowLeft, Save, Eye, TrendingUp, ExternalLink, Award, Camera, Video, CalendarDays
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
    const [profileSlug, setProfileSlug] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [webcamOpen, setWebcamOpen] = useState(false);
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
            alert("Could not access webcam. Please allow camera permissions and try again.");
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
        <div className="min-h-screen bg-zinc-50">
            <div className="w-full px-12 py-8">

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

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 items-start">

                    {/* ── LEFT: EDIT FORM (40%) ── */}
                    <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg shadow-zinc-100 p-8 space-y-6">
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
                                            onClick={openWebcam}
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
                    <div className="xl:col-span-3 space-y-4">
                        <div className="flex items-center gap-2 px-1 mb-1">
                            <Eye className="w-4 h-4 text-zinc-400" />
                            <span className="font-black text-zinc-500 uppercase tracking-widest" style={{ fontSize: '13px' }}>Live Preview — what businesses see on your sales page</span>
                        </div>

                        {/* Full-width preview — mirrors the live resume exactly */}
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

                            {/* Header row */}
                            <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                                <div className="flex items-center gap-6 flex-wrap">
                                    {/* Avatar */}
                                    <div
                                        className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-black text-white shrink-0 overflow-hidden"
                                        style={{ fontSize: '18px', boxShadow: '0 0 0 3px #fff, 0 0 0 4px #e5e7eb, 0 3px 12px rgba(0,0,0,0.10)' }}
                                    >
                                        {(photoUrl || profile.profile_photo_url) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photoUrl || profile.profile_photo_url!} alt="" className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            <h3 className="font-black text-zinc-900 leading-none" style={{ fontSize: '22px' }}>{profile.full_name}</h3>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-green-200 bg-green-50 text-green-700 rounded-full font-bold" style={{ fontSize: '10px' }}>
                                                <CheckCircle className="w-2.5 h-2.5" /> Verified
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-wrap mb-1.5">
                                            {(profile.suburb || profile.state) && (
                                                <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: '12px' }}>
                                                    <MapPin className="w-3 h-3" />{profile.suburb}{profile.state ? `, ${profile.state}` : ""}
                                                </span>
                                            )}
                                            {memberYear && (
                                                <span className="flex items-center gap-1 text-zinc-400 font-medium" style={{ fontSize: '12px' }}>
                                                    <Award className="w-3 h-3" />Since {memberYear}
                                                </span>
                                            )}
                                        </div>
                                        {(tagline || profile.tagline) && (
                                            <p className="font-medium text-zinc-500" style={{ fontSize: '13px' }}>
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
                                    <div key={t.label} className={`px-6 py-6 flex flex-col${i < 3 ? " border-r border-gray-100" : ""} ${t.highlight ? "bg-green-50" : "bg-gray-50"}`}>
                                        <t.Icon className={`w-3.5 h-3.5 mb-4 ${t.highlight ? "text-green-400" : "text-gray-300"}`} />
                                        <p className={`font-black leading-none ${t.numClass}`} style={{ fontSize: '28px' }}>
                                            {t.value}
                                            {t.suffix && <span className={`font-black ${t.highlight ? "text-green-300" : "text-gray-300"}`} style={{ fontSize: '14px' }}>{t.suffix}</span>}
                                        </p>
                                        <p className="font-bold text-gray-400 tracking-widest uppercase mt-3" style={{ fontSize: '10px' }}>{t.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Professional Summary */}
                            <div className="px-8 py-6">
                                <p className="font-black text-zinc-900 mb-3" style={{ fontSize: '14px' }}>Professional Summary</p>
                                {(bio || profile.profile_bio) ? (
                                    <p className="font-medium text-zinc-500 leading-relaxed" style={{ fontSize: '14px', lineHeight: 1.75 }}>
                                        {bio || profile.profile_bio}
                                    </p>
                                ) : (
                                    <p className="font-medium text-gray-300 italic" style={{ fontSize: '13px' }}>Add a bio above — this becomes your professional summary…</p>
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
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Video className="w-5 h-5 text-orange-400" />
                                <span className="font-black text-white" style={{ fontSize: '18px' }}>Take Your Photo</span>
                            </div>
                            <button
                                onClick={closeWebcam}
                                className="text-zinc-500 hover:text-white font-bold transition-colors"
                                style={{ fontSize: '14px' }}
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
                        <div className="px-6 py-5 text-center space-y-3">
                            <p className="font-medium text-zinc-400" style={{ fontSize: '14px' }}>
                                Centre your face in the circle, then tap Snap
                            </p>
                            <button
                                onClick={snapWebcam}
                                className="flex items-center justify-center gap-2 mx-auto px-10 h-14 rounded-2xl font-black text-white transition-all shadow-lg"
                                style={{ background: '#FF7A00', fontSize: '18px' }}
                            >
                                <Camera className="w-5 h-5" /> Snap Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
