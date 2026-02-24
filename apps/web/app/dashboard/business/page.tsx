import { Button } from "@/components/ui/button";
import {
    Users,
    Target,
    Zap,
    Star,
    ChevronRight,
    Pencil,
    User,
    Image as ImageIcon,
    DollarSign
} from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, React.ElementType> = {
    Target: Target,
    Zap: Zap,
    Star: Star,
    Users: Users,
    DollarSign: DollarSign
};

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StorefrontLinkCard } from "@/components/dashboard/StorefrontLinkCard";
import { InviteReferrersButton } from "@/components/dashboard/InviteReferrersButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getBusinessDashboardData() {
    const { userId, getToken } = await auth();
    if (!userId) {
        redirect("/login");
    }

    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/business/dashboard`, {
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (res.status === 404) {
        redirect("/onboarding");
    }

    if (!res.ok) {
        return { error: true };
    }

    return res.json();
}

export default async function BusinessDashboardPage() {
    const data = await getBusinessDashboardData();

    if (!data || data.error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center p-8 bg-white rounded-3xl border shadow-sm max-w-md">
                    <h2 className="text-xl font-bold mb-4 text-zinc-900">Dashboard Unavailable</h2>
                    <p className="text-zinc-500 mb-6 text-sm">We couldn&apos;t load your business profile. This might be a temporary issue with our connection.</p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full px-8">
                        <Link href="/dashboard">Retry Connection</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const { business, stats: apiStats, recent_leads } = data;

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                            <User className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-zinc-900 font-display">{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {business.name}</h1>
                                <Link href="/dashboard/business/settings" className="p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all">
                                    <Pencil className="w-4 h-4" />
                                </Link>
                            </div>
                            <p className="text-zinc-500 font-medium tracking-tight mt-1">Manage your storefront and track your referrals.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="rounded-full px-5 border-zinc-200 h-10 text-base font-bold text-zinc-600 hover:text-orange-600 transition-all">
                            <Link href={`/b/${business.slug}`} target="_blank">View Live Profile</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full px-5 border-zinc-200 h-10 text-base font-bold text-zinc-600 hover:text-orange-600 transition-all">
                            <Link href="/dashboard/business/profile" className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Edit Profile Media
                            </Link>
                        </Button>
                        <InviteReferrersButton businessName={business.name} slug={business.slug} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {apiStats.map((stat: { label: string; icon: string; bg: string; color: string; value: string | number }) => {
                        const Icon = ICON_MAP[stat.icon] || Target;
                        return (
                            <Card key={stat.label} className="p-8 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</div>
                                </div>
                                <div className="text-4xl font-black text-zinc-900 font-display">{stat.value}</div>
                            </Card>
                        );
                    })}
                </div>

                <Card className="p-8 mb-10 shadow-xl shadow-zinc-200/50">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <Target className="w-5 h-5 text-orange-500" /> Recent Target Leads
                        </h3>
                        <Link href="/dashboard/business/leads" className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1 transition-all hover:gap-2">
                            View all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recent_leads.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-zinc-50 rounded-[32px] border border-dashed border-zinc-200">
                                <Target className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                                <div className="text-zinc-400 font-medium">No recent leads found.</div>
                            </div>
                        ) : (
                            recent_leads.map((lead: { id: string; title: string; suburb: string; status: string }) => (
                                <div key={lead.id} className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 hover:border-orange-200 hover:bg-white transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-zinc-100 group-hover:border-orange-100 shadow-sm transition-all group-hover:rotate-12">
                                            <Users className="w-5 h-5 text-zinc-400 group-hover:text-orange-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">{lead.title}</div>
                                            <div className="text-sm text-zinc-400 font-medium tracking-tight">
                                            {lead.suburb} • <Badge variant={lead.status === 'CONFIRMED' ? 'default' : 'secondary'} className="ml-1 uppercase text-sm px-1.5">{lead.status}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/business/leads/${lead.id}`}>
                                        <Button variant="ghost" size="sm" className="rounded-full text-zinc-400 hover:text-orange-600 hover:bg-orange-50 px-4">
                                            View Details
                                        </Button>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <StorefrontLinkCard
                        slug={business.slug}
                        businessName={business.name}
                    />
                    <Card className="p-8 group border-orange-100 bg-orange-50/30 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                            <ImageIcon className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2 font-display">Your Public Profile</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                            Showcase your best work with a <strong>photo gallery</strong> and <strong>service highlights</strong>. Complete profiles get up to 2.5x more enquiries.
                        </p>
                        <Button asChild className="w-full rounded-full bg-zinc-900 hover:bg-black text-white h-12 shadow-lg shadow-zinc-200 transition-all">
                            <Link href="/dashboard/business/profile">Manage Public Profile</Link>
                        </Button>
                    </Card>
                    <Card className="p-8 group border-blue-100 bg-blue-50/30 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2 font-display">Manage Referrers</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                            View all your referrers, track their performance, set <strong>custom fees</strong>, and award <strong>bonuses</strong> to your top performers.
                        </p>
                        <Button asChild className="w-full rounded-full bg-zinc-900 hover:bg-black text-white h-12 shadow-lg shadow-zinc-200 transition-all">
                            <Link href="/dashboard/business/referrers">View Referrers</Link>
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
