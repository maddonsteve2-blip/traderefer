import { Button } from "@/components/ui/button";
import {
    ShieldAlert,
    Users,
    Target,
    BarChart3,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { DisputeList } from "@/components/admin/DisputeList";

async function getAdminData(token: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
}

export default async function AdminDashboardPage() {
    const { userId, getToken } = await auth();
    if (!userId) redirect("/login");
    const token = await getToken();
    if (!token) redirect("/login");

    const adminStats = await getAdminData(token);
    if (!adminStats) {
        // Not an admin or API error
        redirect("/dashboard");
    }

    const disputes = [
        { id: "d1", business: "Apex Renovations", reason: "Invalid Phone Number", date: "2h ago", status: "open" },
        { id: "d2", business: "Geelong Electrical", reason: "Wrong Category", date: "5h ago", status: "open" },
        { id: "d3", business: "Bob's Plumbing", reason: "Duplicate Lead", date: "1d ago", status: "open" },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 pt-16">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 font-display flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-orange-600" /> Admin Console
                        </h1>
                        <p className="text-zinc-500 font-medium">System overview and dispute management.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white border border-zinc-200 rounded-full px-6 py-2 flex items-center gap-2 text-sm font-bold text-zinc-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            System Live
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: "Total Leads", value: "1,284", icon: Target, color: "text-blue-600" },
                        { label: "Active Partners", value: "156", icon: Users, color: "text-zinc-900" },
                        { label: "Open Disputes", value: "4", icon: ShieldAlert, color: "text-orange-600" },
                        { label: "Lead Value", value: "$42k", icon: BarChart3, color: "text-green-600" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                <div className="text-base font-black text-zinc-400 uppercase tracking-widest">{stat.label}</div>
                            </div>
                            <div className="text-3xl font-black text-zinc-900 font-display">{stat.value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[40px] border border-zinc-200 shadow-xl shadow-zinc-200/50 p-8 md:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-orange-500" /> Open Disputes
                                </h3>
                                <div className="text-base font-black text-zinc-400 uppercase tracking-widest">Action Required</div>
                            </div>

                            <DisputeList initialDisputes={disputes} />
                        </div>
                    </div>


                    <div className="space-y-6">
                        <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl">
                            <h3 className="text-xl font-bold mb-6">Performance</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                        <span>Avg. Resolution Time</span>
                                        <span className="text-white">1.2 Days</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-3/4 rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                        <span>Verified Conversion</span>
                                        <span className="text-white">68%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-2/3 rounded-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-zinc-800">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-zinc-400 uppercase tracking-widest mb-1">Last Update</div>
                                        <div className="text-sm font-bold text-zinc-200">Today at 2:15 AM</div>
                                    </div>
                                </div>
                                <Button variant="ghost" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold h-12">
                                    Refresh Data
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
