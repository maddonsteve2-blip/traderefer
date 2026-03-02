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
            LIMIT 20
        `;
        if (result.length > 0) {
            const row = result[Math.floor(Math.random() * result.length)];
            trade = row.trade_category || trade;
            suburb = row.suburb || suburb;
            ago = timeAgo(new Date(row.created_at));
        }
    } catch {
        // fallback to defaults
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t-2 border-[#FF6600] shadow-2xl" style={{ height: '56px' }}>
            <div className="container mx-auto h-full flex items-center justify-center gap-3 px-4">
                <Zap className="w-5 h-5 text-[#FF6600] shrink-0 animate-pulse" />
                <span className="text-white font-bold" style={{ fontSize: '18px' }}>
                    Last referral matched:{" "}
                    <span className="text-[#FF6600]">{trade}</span>
                    {" "}in{" "}
                    <span className="text-[#FF6600]">{suburb}</span>
                    {" "}
                    <span className="text-zinc-400 font-normal">— {ago}</span>
                </span>
            </div>
        </div>
    );
}
