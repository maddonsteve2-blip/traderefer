import { sql } from "@/lib/db";
import { Zap } from "lucide-react";

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} days ago`;
}

export async function UrgencyTicker() {
    let trade = "Plumbing";
    let suburb = "Melbourne";
    let ago = "12 min ago";

    try {
        const result = await sql`
            SELECT b.trade_category, b.suburb, rl.created_at
            FROM referral_links rl
            JOIN businesses b ON b.id = rl.business_id
            WHERE b.trade_category IS NOT NULL AND b.suburb IS NOT NULL
            ORDER BY rl.created_at DESC
            LIMIT 1
        `;
        if (result.length > 0) {
            const row = result[0];
            trade = row.trade_category || trade;
            suburb = row.suburb || suburb;
            ago = timeAgo(new Date(row.created_at));
        }
    } catch {
        // fallback to defaults
    }

    return (
        <div className="bg-zinc-950 border-t border-white/5 py-2.5 px-4">
            <div className="container mx-auto flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Zap className="w-3 h-3 text-orange-500 shrink-0" />
                <span>
                    Last referral matched:{" "}
                    <span className="text-white font-bold">{trade}</span>
                    {" "}in{" "}
                    <span className="text-white font-bold">{suburb}</span>
                    {" "}
                    <span className="text-zinc-500">({ago})</span>
                </span>
            </div>
        </div>
    );
}
