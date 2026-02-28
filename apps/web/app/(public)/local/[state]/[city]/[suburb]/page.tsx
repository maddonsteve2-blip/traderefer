import { sql } from "@/lib/db";
import { ChevronRight, Hammer, Lightbulb, Pipette as Pipe, Paintbrush, Wrench, Home, Truck, Trash2, Shovel, Trees, Scissors, Lock, Wind, Bug, PenTool, HardHat, Construction, LayoutGrid, Fence } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ state: string; city: string; suburb: string }>;
}

const TRADE_ICONS: Record<string, any> = {
    "Plumber": Pipe,
    "Electrician": Lightbulb,
    "Carpenter": Hammer,
    "Painter": Paintbrush,
    "Handyman": Wrench,
    "Removalist": Truck,
    "Cleaner": Trash2,
    "Gardener": Scissors,
    "Landscaper": Shovel,
    "Tiler": LayoutGrid,
    "Plasterer": PenTool,
    "Roofing": Home,
    "Bricklayer": Construction,
    "Concreter": HardHat,
    "Fencing": Fence,
    "Air Conditioning": Wind,
    "Locksmith": Lock,
    "Pest Control": Bug,
    "Draftsman": PenTool,
    "Builder": Home
};

const TRADES = [
    "Plumber", "Electrician", "Carpenter", "Painter", "Handyman",
    "Removalist", "Cleaner", "Gardener", "Landscaper", "Tiler",
    "Plasterer", "Roofing", "Bricklayer", "Concreter", "Fencing",
    "Air Conditioning", "Locksmith", "Pest Control", "Draftsman", "Builder"
];

function formatSlug(slug: string) {
    return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

async function getTradesInSuburb(suburb: string) {
    try {
        const suburbName = formatSlug(suburb);
        const results = await sql`
            SELECT DISTINCT trade_category 
            FROM businesses 
            WHERE status = 'active' 
              AND suburb ILIKE ${'%' + suburbName + '%'}
            ORDER BY trade_category ASC
        `;
        return results.map(r => r.trade_category);
    } catch (error) {
        console.error("Error fetching trades:", error);
        return [];
    }
}

export default async function SuburbDirectoryPage({ params }: PageProps) {
    const { state, city, suburb } = await params;
    const cityName = formatSlug(city);
    const suburbName = formatSlug(suburb);
    const trades = await getTradesInSuburb(suburb);

    // If no specific trade data yet, we can show a default set to encourage signups
    const displayTrades = trades.length > 0 ? trades : [
        "Plumber", "Electrician", "Carpenter", "Handyman", "Painter"
    ];

    return (
        <main className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <nav className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/local" className="hover:text-zinc-900 transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}`} className="hover:text-zinc-900 transition-colors">{state.toUpperCase()}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/local/${state}/${city}`} className="hover:text-zinc-900 transition-colors">{cityName}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-orange-600">{suburbName}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display">
                        Best Trades in {suburbName}
                    </h1>
                    <p className="text-xl text-zinc-600 mb-12 leading-relaxed max-w-3xl">
                        Looking for a trusted pro in {suburbName}? Select a trade below to see verified local businesses recommended by your community.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayTrades.map((trade: any) => {
                            const Icon = TRADE_ICONS[trade] || Wrench;
                            return (
                                <Link key={trade} href={`/local/${state}/${city}/${suburb}/${trade.toLowerCase().replace(/ /g, '-')}`} className="group">
                                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-orange-500 hover:shadow-xl transition-all duration-300 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                                                {trade}s
                                            </h2>
                                            <p className="text-xs text-zinc-500">Verified {trade} services</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </main>
    );
}
