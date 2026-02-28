import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

const TOP_CATEGORIES = [
    { name: "Electrician", slug: "electrician" },
    { name: "Plumber", slug: "plumber" },
    { name: "Painter", slug: "painter" },
    { name: "Fencing", slug: "fencing" },
    { name: "Landscaper", slug: "landscaper" },
    { name: "Flooring", slug: "flooring" },
    { name: "Air Conditioning & Heating", slug: "air-conditioning-heating" },
    { name: "Cleaning", slug: "cleaning" },
    { name: "Solar & Energy", slug: "solar-energy" },
    { name: "Roofing", slug: "roofing" },
    { name: "Cabinet Making", slug: "cabinet-making" },
    { name: "Locksmith", slug: "locksmith" },
];

const TOP_CITIES = [
    { name: "Sydney", state: "nsw" },
    { name: "Melbourne", state: "vic" },
    { name: "Brisbane", state: "qld" },
    { name: "Perth", state: "wa" },
    { name: "Adelaide", state: "sa" },
    { name: "Geelong", state: "vic" },
    { name: "Gold Coast", state: "qld" },
    { name: "Newcastle", state: "nsw" }
];

const STATES = [
    { name: "Victoria", slug: "vic" },
    { name: "New South Wales", slug: "nsw" },
    { name: "Queensland", slug: "qld" },
    { name: "Western Australia", slug: "wa" },
    { name: "South Australia", slug: "sa" },
    { name: "Tasmania", slug: "tas" }
];

export function DirectoryFooter() {
    return (
        <footer className="bg-zinc-900 text-white pt-20 pb-10 border-t border-white/5">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">

                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
                            <span className="text-orange-500">TRADE</span>REFER
                        </Link>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Australia's trusted referral network for local trades. We connect you with verified experts recommended by your own community.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Icons Placeholder */}
                        </div>
                    </div>

                    {/* Top Cities */}
                    <div>
                        <h4 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            Top Cities
                        </h4>
                        <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                            {TOP_CITIES.map((city) => (
                                <li key={city.name}>
                                    <Link
                                        href={`/local/${city.state}/${city.name.toLowerCase().replace(/ /g, '-')}`}
                                        className="text-zinc-400 hover:text-orange-500 text-sm transition-colors flex items-center group"
                                    >
                                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                        {city.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* States */}
                    <div>
                        <h4 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500">
                            Browse States
                        </h4>
                        <ul className="space-y-3">
                            {STATES.map((state) => (
                                <li key={state.slug}>
                                    <Link
                                        href={`/local/${state.slug}`}
                                        className="text-zinc-400 hover:text-orange-500 text-sm transition-colors flex items-center group"
                                    >
                                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                        {state.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Browse by Category */}
                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-zinc-500">
                            Browse by Trade
                        </h4>
                        <ul className="space-y-3">
                            {TOP_CATEGORIES.slice(0, 8).map((cat) => (
                                <li key={cat.slug}>
                                    <Link
                                        href={`/categories#${cat.slug}`}
                                        className="text-zinc-400 hover:text-orange-500 text-sm transition-colors flex items-center group"
                                    >
                                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/categories" className="text-orange-500 hover:text-orange-400 text-xs font-bold uppercase tracking-widest transition-colors">
                                    View All Categories →
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Access */}
                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-zinc-500">
                            For Businesses
                        </h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/register?type=business" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm inline-block w-full text-center transition-all">
                                    List Your Business
                                </Link>
                            </li>
                            <li>
                                <Link href="/claim" className="text-zinc-400 hover:text-white text-sm transition-colors block text-center">
                                    Claim Your Profile
                                </Link>
                            </li>
                            <li>
                                <Link href="/remove" className="text-zinc-500 hover:text-zinc-300 text-[10px] block text-center uppercase tracking-widest">
                                    Request Removal
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-zinc-600 text-xs">
                        &copy; {new Date().getFullYear()} TradeRefer Australia. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-zinc-400">Privacy</Link>
                        <Link href="/terms" className="hover:text-zinc-400">Terms</Link>
                        <Link href="/cookies" className="hover:text-zinc-400">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
