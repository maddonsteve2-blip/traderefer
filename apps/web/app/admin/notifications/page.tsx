export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Bell, Send } from "lucide-react";
import { BroadcastForm } from "@/components/admin/BroadcastForm";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getNotifications(token: string) {
    try {
        const res = await fetch(`${API}/admin/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        if (!res.ok) return { items: [], total: 0 };
        return res.json();
    } catch {
        return { items: [], total: 0 };
    }
}

export default async function NotificationsPage() {
    const { getToken } = await auth();
    const token = await getToken();
    const data = token ? await getNotifications(token) : { items: [], total: 0 };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-violet-600" /> Notifications
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Send broadcast notifications to businesses and referrers</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Compose */}
                    <BroadcastForm />

                    {/* History */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Send className="w-4 h-4 text-violet-500" /> Sent Notifications
                        </h3>
                        {data.items.length === 0 ? (
                            <p className="text-zinc-400 text-sm text-center py-8">No notifications sent yet</p>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {data.items.map((notif: any) => (
                                    <div key={notif.id} className="border border-zinc-100 rounded-xl p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-bold text-zinc-900 text-sm truncate">{notif.title}</p>
                                                <p className="text-zinc-500 text-xs mt-0.5 line-clamp-2">{notif.message}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full shrink-0 ${
                                                notif.audience === "businesses" ? "bg-blue-50 text-blue-600" :
                                                notif.audience === "referrers" ? "bg-green-50 text-green-600" :
                                                "bg-violet-50 text-violet-600"
                                            }`}>
                                                {notif.audience}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-400">
                                            <span>{notif.recipient_count ?? 0} recipients</span>
                                            <span>{notif.created_at ? new Date(notif.created_at).toLocaleDateString("en-AU") : "—"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
