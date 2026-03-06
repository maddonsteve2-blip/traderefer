import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { UrgencyTicker } from "@/components/UrgencyTicker";

const TOP_CATEGORIES = [
    { name: "Electrician", category: "Electrical" },
    { name: "Plumber", category: "Plumbing" },
    { name: "Painter", category: "Painting" },
    { name: "Fencing", category: "Fencing" },
    { name: "Landscaper", category: "Landscaping" },
    { name: "Flooring", category: "Flooring" },
    { name: "Air Conditioning & Heating", category: "Air Conditioning & Heating" },
    { name: "Cleaning", category: "Cleaning" },
    { name: "Solar & Energy", category: "Solar & Energy" },
    { name: "Roofing", category: "Roofing" },
    { name: "Cabinet Making", category: "Cabinet Making" },
    { name: "Locksmith", category: "Locksmith" },
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

export async function DirectoryFooter() {
    return (
        <>
        <UrgencyTicker />
        <footer className="bg-zinc-900 text-white pt-20 border-t border-white/5" style={{ paddingBottom: '74px' }}>
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">

                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/">
                            <Logo size="sm" variant="white" />
                        </Link>
                        <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '16px' }}>
                            Australia's trusted referral network for local trades. We connect you with verified experts recommended by your own community.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Icons Placeholder */}
                        </div>
                    </div>

                    {/* Top Cities */}
                    <div>
                        <h4 className="font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-zinc-500" style={{ fontSize: '16px' }}>
                            <MapPin className="w-4 h-4 text-orange-500" />
                            Top Cities
                        </h4>
                        <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                            {TOP_CITIES.map((city) => (
                                <li key={city.name}>
                                    <Link
                                        href={`/local/${city.state}/${city.name.toLowerCase().replace(/ /g, '-')}`}
                                        className="text-zinc-400 hover:text-orange-500 transition-colors flex items-center group" style={{ fontSize: '16px' }}
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
                        <h4 className="font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-zinc-500" style={{ fontSize: '16px' }}>
                            Browse States
                        </h4>
                        <ul className="space-y-3">
                            {STATES.map((state) => (
                                <li key={state.slug}>
                                    <Link
                                        href={`/local/${state.slug}`}
                                        className="text-zinc-400 hover:text-orange-500 transition-colors flex items-center group" style={{ fontSize: '16px' }}
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
                        <h4 className="font-bold mb-6 uppercase tracking-widest text-zinc-500" style={{ fontSize: '16px' }}>
                            Browse by Trade
                        </h4>
                        <ul className="space-y-3">
                            {TOP_CATEGORIES.slice(0, 8).map((cat) => (
                                <li key={cat.category}>
                                    <Link
                                        href={`/businesses?category=${encodeURIComponent(cat.category)}`}
                                        className="text-zinc-400 hover:text-orange-500 transition-colors flex items-center group" style={{ fontSize: '16px' }}
                                    >
                                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                        {cat.name}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/categories" className="text-orange-500 hover:text-orange-400 font-bold uppercase tracking-widest transition-colors" style={{ fontSize: '16px' }}>
                                    View All Categories →
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Access */}
                    <div>
                        <h4 className="font-bold mb-6 uppercase tracking-widest text-zinc-500" style={{ fontSize: '16px' }}>
                            For Businesses
                        </h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/register?type=business" className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-xl font-bold inline-flex items-center justify-center w-full text-center transition-all" style={{ fontSize: '16px', minHeight: '48px' }}>
                                    List Your Business
                                </Link>
                            </li>
                            <li>
                                <Link href="/claim" className="text-zinc-400 hover:text-white transition-colors block text-center" style={{ fontSize: '16px' }}>
                                    Claim Your Profile
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* E-E-A-T Authority Links */}
                <div className="pt-8 border-t border-white/5 mb-6">
                    <p className="text-zinc-500 font-bold uppercase tracking-widest mb-4" style={{ fontSize: '16px' }}>Industry Bodies &amp; Licensing Authorities</p>
                    <div className="flex flex-wrap gap-6">
                        <a href="https://www.vba.vic.gov.au" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors" style={{ fontSize: '16px' }}>VBA Victoria ↗</a>
                        <a href="https://www.masterbuilders.com.au" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors" style={{ fontSize: '16px' }}>Master Builders ↗</a>
                        <a href="https://www.neca.asn.au" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors" style={{ fontSize: '16px' }}>NECA ↗</a>
                        <a href="https://hia.com.au" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors" style={{ fontSize: '16px' }}>HIA ↗</a>
                        <a href="https://www.abr.business.gov.au" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors" style={{ fontSize: '16px' }}>ABR ↗</a>
                        <a href="https://www.fairtrading.nsw.gov.au" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 font-bold flex items-center gap-1 transition-colors" style={{ fontSize: '16px' }}>NSW Fair Trading ↗</a>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-white/5">
                    <div className="text-left">
                        <p className="text-zinc-600" style={{ fontSize: '16px' }}>
                            &copy; {new Date().getFullYear()} TradeRefer Pty Ltd. All rights reserved.
                        </p>
                        <p className="text-zinc-700 mt-1" style={{ fontSize: '16px' }}>
                            ABN: 88 764 351 213 &nbsp;|&nbsp; Level 1, 123 Collins Street, Melbourne VIC 3000 Australia &nbsp;|&nbsp; Made in Australia 🇦🇺
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-6 text-zinc-600 font-bold uppercase tracking-widest" style={{ fontSize: '14px' }}>
                        <Link href="/privacy" className="hover:text-zinc-400">Privacy</Link>
                        <Link href="/terms" className="hover:text-zinc-400">Terms</Link>
                        <Link href="/cookies" className="hover:text-zinc-400">Cookies</Link>
                        <Link href="/compare" className="hover:text-zinc-400">Compare</Link>
                        <Link href="/remove" className="text-zinc-700 hover:text-zinc-500 transition-colors">Request Removal</Link>
                    </div>
                </div>
            </div>
        </footer>
        </>
    );
}
