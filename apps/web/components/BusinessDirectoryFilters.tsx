"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRADE_CATEGORIES, GEELONG_SUBURBS } from "@/lib/constants";

export function BusinessDirectoryFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get("category") || "";
    const currentSuburb = searchParams.get("suburb") || "";
    const currentSearch = searchParams.get("q") || "";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/businesses?${params.toString()}`);
    };

    const clearAll = () => {
        router.push("/businesses");
    };

    const hasFilters = currentCategory || currentSuburb || currentSearch;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                        type="text"
                        defaultValue={currentSearch}
                        placeholder="Search by name..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                updateFilter("q", (e.target as HTMLInputElement).value);
                            }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                    />
                </div>

                {/* Trade Category Filter */}
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                    <select
                        value={currentCategory}
                        onChange={(e) => updateFilter("category", e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium appearance-none cursor-pointer min-w-[200px]"
                    >
                        <option value="">All Trade Categories</option>
                        {TRADE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Suburb Filter */}
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                    <select
                        value={currentSuburb}
                        onChange={(e) => updateFilter("suburb", e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium appearance-none cursor-pointer min-w-[200px]"
                    >
                        <option value="">All Suburbs</option>
                        {GEELONG_SUBURBS.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Active filters */}
            {hasFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filters:</span>
                    {currentCategory && (
                        <button
                            onClick={() => updateFilter("category", "")}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100 hover:bg-orange-100 transition-colors"
                        >
                            {currentCategory} <X className="w-3 h-3" />
                        </button>
                    )}
                    {currentSuburb && (
                        <button
                            onClick={() => updateFilter("suburb", "")}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                            {currentSuburb} <X className="w-3 h-3" />
                        </button>
                    )}
                    {currentSearch && (
                        <button
                            onClick={() => updateFilter("q", "")}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold border border-zinc-200 hover:bg-zinc-200 transition-colors"
                        >
                            &quot;{currentSearch}&quot; <X className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={clearAll}
                        className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors ml-2"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
}
