import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, DollarSign, ShieldCheck, Star } from "lucide-react";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

async function getBusiness(slug: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/businesses/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
}

export default async function ReferPublicPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Signed-in users go straight to their referral dashboard
    const { userId } = await auth();
    if (userId) {
        redirect(`/dashboard/referrer/refer/${slug}`);
    }

    const business = await getBusiness(slug);
    if (!business) notFound();

    const fee = business.referral_fee_cents
        ? `$${(business.referral_fee_cents / 100).toFixed(0)}`
        : null;

    return (
        <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-xl p-8 text-center">
                {business.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={business.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
                ) : (
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-2xl mx-auto mb-4">
                        {business.business_name?.charAt(0)}
                    </div>
                )}

                <div className="flex items-center justify-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-blue-500">Verified Business</span>
                </div>

                <h1 className="text-2xl font-black text-zinc-900 mb-1">{business.business_name}</h1>
                <p className="text-base text-zinc-500 mb-6">
                    {business.trade_category}{business.suburb ? ` · ${business.suburb}` : ""}
                </p>

                {fee && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-3xl font-black text-green-600">{fee}</span>
                            <span className="text-base font-bold text-green-700">per referral</span>
                        </div>
                        <p className="text-sm text-green-700">Earn every time you refer a verified lead</p>
                    </div>
                )}

                <div className="space-y-3 mb-6 text-left">
                    {[
                        "Join free — no subscription fees",
                        "Earn when your referral becomes a lead",
                        "Get paid via Prezzee gift cards",
                    ].map(item => (
                        <div key={item} className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-orange-500 shrink-0" />
                            <span className="text-sm font-semibold text-zinc-700">{item}</span>
                        </div>
                    ))}
                </div>

                <Link
                    href={`/join/referrer?next=/dashboard/referrer/refer/${slug}`}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl px-6 py-4 transition-colors"
                >
                    Join & Start Earning <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-xs text-zinc-400 mt-3">
                    Already a member?{" "}
                    <Link href={`/sign-in?redirect_url=/dashboard/referrer/refer/${slug}`} className="text-orange-500 hover:underline font-semibold">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
