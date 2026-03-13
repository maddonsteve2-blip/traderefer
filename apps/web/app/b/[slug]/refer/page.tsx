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
        <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 md:p-8">
            <div className="max-w-md w-full bg-white rounded-[24px] md:rounded-[32px] border border-zinc-200 shadow-2xl p-8 md:p-12 text-center">
                {business.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 p-1 bg-white border border-zinc-100 rounded-[20px] md:rounded-[24px] shadow-sm">
                        <img src={business.logo_url} alt="" className="w-full h-full rounded-[18px] md:rounded-[22px] object-cover" />
                    </div>
                ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-[20px] md:rounded-[24px] bg-orange-100 flex items-center justify-center text-orange-600 font-black text-3xl md:text-4xl mx-auto mb-6">
                        {business.business_name?.charAt(0)}
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <span className="text-xs md:text-sm font-black uppercase tracking-widest text-blue-500">Verified Business</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-2 leading-tight">{business.business_name}</h1>
                <p className="text-base md:text-lg text-zinc-500 font-bold mb-8">
                    {business.trade_category}{business.suburb ? ` · ${business.suburb}` : ""}
                </p>

                {fee && (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-[20px] p-6 mb-8">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-xs md:text-sm font-black text-orange-600 uppercase tracking-widest">Referral Reward</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-5xl md:text-6xl font-black text-zinc-900">{fee}</span>
                            <span className="text-base md:text-lg font-bold text-zinc-400">aud</span>
                        </div>
                        <p className="text-sm md:text-base text-zinc-600 font-bold mt-2">Earn every time you refer a verified lead</p>
                    </div>
                )}

                <div className="space-y-4 mb-10 text-left">
                    {[
                        "Free to join — no subscriptions",
                        "Earn rewards for every lead",
                        "Instant Prezzee gift card payouts",
                    ].map(item => (
                        <div key={item} className="flex items-center gap-3">
                            <div className="size-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />
                            </div>
                            <span className="text-base font-bold text-zinc-700">{item}</span>
                        </div>
                    ))}
                </div>

                <Link
                    href={`/join/referrer?next=/dashboard/referrer/refer/${slug}`}
                    className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg md:text-xl rounded-2xl h-16 md:h-18 transition-all shadow-xl shadow-zinc-200 active:scale-95"
                >
                    Join & Start Earning <ArrowRight className="w-5 h-5" />
                </Link>
                <div className="mt-6 flex flex-col gap-2">
                    <p className="text-sm text-zinc-500 font-bold">
                        Already a member?{" "}
                        <Link href={`/sign-in?redirect_url=/dashboard/referrer/refer/${slug}`} className="text-orange-500 hover:text-orange-600 font-black">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
