export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Star, MapPin, Phone, Mail, Globe, Calendar, Shield, Image as ImageIcon } from "lucide-react";
import { BusinessEditForm } from "@/components/admin/BusinessEditForm";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getBusiness(token: string, id: string) {
    const res = await fetch(`${API}/admin/businesses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
}

export default async function BusinessDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { getToken } = await auth();
    const token = await getToken();
    const { id } = await params;

    const biz = token ? await getBusiness(token, id) : null;
    if (!biz) return notFound();

    const photos = Array.isArray(biz.photo_urls) ? biz.photo_urls : 
        (typeof biz.photo_urls === "string" && biz.photo_urls.startsWith("{"))
            ? biz.photo_urls.replace(/^\{|\}$/g, "").split(",").filter(Boolean)
            : [];

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto">
                {/* Back */}
                <Link href="/admin/directory" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-zinc-800 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Directory
                </Link>

                {/* Header */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900">{biz.business_name}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-zinc-500">
                                {biz.trade_category && (
                                    <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-lg font-bold text-xs">{biz.trade_category}</span>
                                )}
                                {biz.suburb && (
                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {biz.suburb}, {biz.state}</span>
                                )}
                                {biz.avg_rating && (
                                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" /> {biz.avg_rating} ({biz.review_count} reviews)</span>
                                )}
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${biz.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                                    {biz.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Link href={`/b/${biz.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold text-zinc-600 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" /> View Public
                            </Link>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-100">
                        <div className="text-center">
                            <div className="text-lg font-black text-zinc-900">{biz.lead_count ?? 0}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Leads</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-zinc-900">{biz.deal_count ?? 0}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Deals</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-zinc-900">{biz.campaign_count ?? 0}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Campaigns</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-zinc-900">{photos.length}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Photos</div>
                        </div>
                    </div>
                </div>

                {/* Edit form */}
                <BusinessEditForm business={biz} />

                {/* Metadata */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mt-6">
                    <h3 className="font-bold text-zinc-900 mb-3">Metadata</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="font-bold text-zinc-500">ID:</span> <span className="text-zinc-700 font-mono text-xs">{biz.id}</span></div>
                        <div><span className="font-bold text-zinc-500">Slug:</span> <span className="text-zinc-700">{biz.slug}</span></div>
                        <div><span className="font-bold text-zinc-500">Data Source:</span> <span className="text-zinc-700">{biz.data_source || "—"}</span></div>
                        <div><span className="font-bold text-zinc-500">Created:</span> <span className="text-zinc-700">{biz.created_at ? new Date(biz.created_at).toLocaleDateString("en-AU") : "—"}</span></div>
                        <div><span className="font-bold text-zinc-500">Clerk User:</span> <span className="text-zinc-700 font-mono text-xs">{biz.clerk_user_id || "Unclaimed"}</span></div>
                        <div><span className="font-bold text-zinc-500">Visibility:</span> <span className="text-zinc-700">{biz.listing_visibility || "public"}</span></div>
                        <div><span className="font-bold text-zinc-500">ABN:</span> <span className="text-zinc-700">{biz.abn || "—"}</span></div>
                        <div><span className="font-bold text-zinc-500">Google Place ID:</span> <span className="text-zinc-700 font-mono text-xs">{biz.google_place_id || "—"}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
