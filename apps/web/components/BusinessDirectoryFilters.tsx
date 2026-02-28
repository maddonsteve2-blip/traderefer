"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Briefcase, X, ChevronDown } from "lucide-react";
import { TRADE_CATEGORIES, AUSTRALIA_LOCATIONS } from "@/lib/constants";

const STATE_LABELS: Record<string, string> = {
    VIC: "Victoria", NSW: "New South Wales", QLD: "Queensland",
    WA: "Western Australia", SA: "South Australia", ACT: "ACT",
    TAS: "Tasmania", NT: "Northern Territory",
};

const selectClass = "pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium appearance-none cursor-pointer w-full";

export function BusinessDirectoryFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get("category") || "";
    const currentSuburb = searchParams.get("suburb") || "";
    const currentState = searchParams.get("state") || "";
    const currentCity = searchParams.get("city") || "";
    const currentSearch = searchParams.get("q") || "";

    // Derive cities and suburbs directly from URL params — no local state
    const cities = currentState ? Object.keys(AUSTRALIA_LOCATIONS[currentState] || {}) : [];
    const suburbs = (currentState && currentCity)
        ? AUSTRALIA_LOCATIONS[currentState]?.[currentCity] || []
        : [];

    const push = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        router.push(`/businesses?${params.toString()}`);
    };

    const handleStateChange = (state: string) => {
        // Clear city and suburb when state changes
        push({ state, city: "", suburb: "" });
    };

    const handleCityChange = (city: string) => {
        // Clear suburb when city changes
        push({ city, suburb: "" });
    };

    const clearAll = () => router.push("/businesses");

    const hasFilters = currentCategory || currentSuburb || currentState || currentCity || currentSearch;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

                {/* Search */}
                <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        defaultValue={currentSearch}
                        placeholder="Search businesses..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                push({ q: (e.target as HTMLInputElement).value });
                            }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                    />
                </div>

                {/* Trade Category */}
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none z-10" />
                    <select
                        value={currentCategory}
                        onChange={(e) => push({ category: e.target.value })}
                        className={selectClass}
                    >
                        <option value="">All Categories</option>
                        {TRADE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* State */}
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none z-10" />
                    <select
                        value={currentState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">All States</option>
                        {Object.keys(AUSTRALIA_LOCATIONS).map((s) => (
                            <option key={s} value={s}>{STATE_LABELS[s] || s}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* City */}
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none z-10" />
                    <select
                        value={currentCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={!currentState}
                        className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        <option value="">All Cities</option>
                        {cities.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* Suburb */}
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none z-10" />
                    <select
                        value={currentSuburb}
                        onChange={(e) => push({ suburb: e.target.value })}
                        disabled={!currentCity}
                        className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        <option value="">All Suburbs</option>
                        {suburbs.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                </div>
            </div>

            {/* Active filter pills */}
            {hasFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active:</span>
                    {currentState && (
                        <button onClick={() => handleStateChange("")}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-100 hover:bg-purple-100 transition-colors">
                            {STATE_LABELS[currentState] || currentState} <X className="w-3 h-3" />
                        </button>
                    )}
                    {currentCity && (
                        <button onClick={() => handleCityChange("")}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                            {currentCity} <X className="w-3 h-3" />
                        </button>
                    )}
                    {currentSuburb && (
                        <button onClick={() => push({ suburb: "" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                            {currentSuburb} <X className="w-3 h-3" />
                        </button>
                    )}
                    {currentCategory && (
                        <button onClick={() => push({ category: "" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100 hover:bg-orange-100 transition-colors">
                            {currentCategory} <X className="w-3 h-3" />
                        </button>
                    )}
                    {currentSearch && (
                        <button onClick={() => push({ q: "" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold border border-zinc-200 hover:bg-zinc-200 transition-colors">
                            &quot;{currentSearch}&quot; <X className="w-3 h-3" />
                        </button>
                    )}
                    <button onClick={clearAll}
                        className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors ml-2">
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
}
