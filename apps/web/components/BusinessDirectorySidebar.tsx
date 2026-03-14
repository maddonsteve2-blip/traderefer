"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Wrench, Clock, ChevronDown, ChevronUp, X, Search } from "lucide-react";
import { TRADE_CATEGORIES, AUSTRALIA_LOCATIONS, JOB_TYPES } from "@/lib/constants";
import { useState } from "react";

const STATE_LABELS: Record<string, string> = {
    VIC: "Victoria", NSW: "New South Wales", QLD: "Queensland",
    WA: "Western Australia", SA: "South Australia", ACT: "ACT",
    TAS: "Tasmania", NT: "Northern Territory",
};

interface SidebarProps {
    counts?: {
        states?: Record<string, number>;
        cities?: Record<string, number>;
        suburbs?: Record<string, number>;
        categories?: Record<string, number>;
    };
    total: number;
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children }: {
    title: string;
    icon: React.ElementType;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-zinc-100 pb-5">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full group py-1"
                aria-expanded={open}
            >
                <span className="flex items-center gap-2 font-black text-zinc-900 uppercase tracking-wider text-xs">
                    <Icon className="w-4 h-4 text-zinc-500" />
                    {title}
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>
            {open && <div className="mt-3 space-y-1">{children}</div>}
        </div>
    );
}

function FilterCheckbox({ label, count, checked, onChange }: {
    label: string;
    count?: number;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors min-h-[36px] ${checked ? 'bg-orange-50 text-orange-700' : 'hover:bg-zinc-50 text-zinc-700'}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 rounded border-zinc-300 text-[#FF6600] focus:ring-orange-500/20 cursor-pointer accent-[#FF6600]"
            />
            <span className="font-bold text-sm flex-1 truncate">{label}</span>
            {count !== undefined && (
                <span className="text-xs font-medium text-zinc-400 shrink-0">({count})</span>
            )}
        </label>
    );
}

export function BusinessDirectorySidebar({ counts, total }: SidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const currentCategory = searchParams.get("category") || "";
    const currentSuburb = searchParams.get("suburb") || "";
    const currentState = searchParams.get("state") || "";
    const currentCity = searchParams.get("city") || "";
    const currentSearch = searchParams.get("q") || "";

    const cities = currentState ? Object.keys(AUSTRALIA_LOCATIONS[currentState] || {}) : [];
    const suburbs = (currentState && currentCity)
        ? AUSTRALIA_LOCATIONS[currentState]?.[currentCity] || []
        : [];

    const subServices = currentCategory ? (JOB_TYPES[currentCategory] || []) : [];

    const push = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        params.delete("page");
        router.push(`/businesses?${params.toString()}`);
    };

    const handleStateChange = (state: string) => {
        if (currentState === state) {
            push({ state: "", city: "", suburb: "" });
        } else {
            push({ state, city: "", suburb: "" });
        }
    };

    const handleCityChange = (city: string) => {
        if (currentCity === city) {
            push({ city: "", suburb: "" });
        } else {
            push({ city, suburb: "" });
        }
    };

    const handleSuburbChange = (suburb: string) => {
        push({ suburb: currentSuburb === suburb ? "" : suburb });
    };

    const handleCategoryChange = (cat: string) => {
        push({ category: currentCategory === cat ? "" : cat });
    };

    const clearAll = () => router.push("/businesses");

    const hasFilters = currentCategory || currentSuburb || currentState || currentCity || currentSearch;

    const visibleCategories = showAllCategories
        ? TRADE_CATEGORIES
        : TRADE_CATEGORIES.slice(0, 10);

    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            push({ q: searchQuery });
                        }
                    }}
                    placeholder="Search businesses..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                />
            </div>

            {/* Active Filters Summary */}
            {hasFilters && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <p className="font-black text-zinc-900 text-sm mb-2">
                        {total.toLocaleString()} {total === 1 ? 'business' : 'businesses'} match
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {currentState && (
                            <button onClick={() => handleStateChange("")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors">
                                {STATE_LABELS[currentState] || currentState} <X className="w-3 h-3" />
                            </button>
                        )}
                        {currentCity && (
                            <button onClick={() => handleCityChange("")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors">
                                {currentCity} <X className="w-3 h-3" />
                            </button>
                        )}
                        {currentSuburb && (
                            <button onClick={() => push({ suburb: "" })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors">
                                {currentSuburb} <X className="w-3 h-3" />
                            </button>
                        )}
                        {currentCategory && (
                            <button onClick={() => push({ category: "" })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors">
                                {currentCategory} <X className="w-3 h-3" />
                            </button>
                        )}
                        {currentSearch && (
                            <button onClick={() => { setSearchQuery(""); push({ q: "" }); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-orange-200 rounded-full text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors">
                                &quot;{currentSearch}&quot; <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <button onClick={clearAll} className="text-xs font-bold text-orange-600 hover:text-orange-700 mt-2">
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Location Drill-Down (replaces view at each level) */}
            <CollapsibleSection title="Location" icon={MapPin}>
                {currentState && currentCity ? (
                    /* Level 3: Suburbs */
                    <div className="space-y-1">
                        <button onClick={() => handleCityChange("")} className="flex items-center gap-1.5 text-xs font-bold text-[#FF6600] hover:text-[#E65C00] mb-2">
                            <ChevronUp className="w-3 h-3" /> Back to {STATE_LABELS[currentState] || currentState} cities
                        </button>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-wider px-2 mb-1">{currentCity} suburbs</p>
                        <div className="space-y-0.5 max-h-64 overflow-y-auto">
                            {suburbs.map((sub) => (
                                <FilterCheckbox
                                    key={sub}
                                    label={sub}
                                    count={counts?.suburbs?.[sub]}
                                    checked={currentSuburb === sub}
                                    onChange={() => handleSuburbChange(sub)}
                                />
                            ))}
                        </div>
                    </div>
                ) : currentState ? (
                    /* Level 2: Cities */
                    <div className="space-y-1">
                        <button onClick={() => handleStateChange("")} className="flex items-center gap-1.5 text-xs font-bold text-[#FF6600] hover:text-[#E65C00] mb-2">
                            <ChevronUp className="w-3 h-3" /> Back to all states
                        </button>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-wider px-2 mb-1">{STATE_LABELS[currentState] || currentState}</p>
                        <div className="space-y-0.5 max-h-64 overflow-y-auto">
                            {cities.map((c) => (
                                <FilterCheckbox
                                    key={c}
                                    label={c}
                                    count={counts?.cities?.[c]}
                                    checked={currentCity === c}
                                    onChange={() => handleCityChange(c)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Level 1: States */
                    <div className="space-y-0.5">
                        {Object.keys(AUSTRALIA_LOCATIONS).map((s) => (
                            <FilterCheckbox
                                key={s}
                                label={STATE_LABELS[s] || s}
                                count={counts?.states?.[s]}
                                checked={currentState === s}
                                onChange={() => handleStateChange(s)}
                            />
                        ))}
                    </div>
                )}
            </CollapsibleSection>

            {/* Service Categories */}
            <CollapsibleSection title="Services" icon={Wrench}>
                <div className="space-y-0.5">
                    {visibleCategories.map((cat) => (
                        <div key={cat}>
                            <FilterCheckbox
                                label={cat}
                                count={counts?.categories?.[cat]}
                                checked={currentCategory === cat}
                                onChange={() => handleCategoryChange(cat)}
                            />
                            {/* Sub-services (auto-expand when category selected) */}
                            {currentCategory === cat && subServices.length > 0 && (
                                <div className="pl-4 mt-1 space-y-0.5 border-l-2 border-orange-200 ml-4 max-h-48 overflow-y-auto">
                                    {subServices.slice(0, 8).map((job) => (
                                        <span key={job} className="block px-2 py-1.5 text-sm font-medium text-zinc-500 truncate">
                                            {job.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {!showAllCategories && TRADE_CATEGORIES.length > 10 && (
                        <button
                            onClick={() => setShowAllCategories(true)}
                            className="text-sm font-bold text-[#FF6600] hover:text-[#E65C00] mt-2 ml-2"
                        >
                            View all ({TRADE_CATEGORIES.length})
                        </button>
                    )}
                    {showAllCategories && (
                        <button
                            onClick={() => setShowAllCategories(false)}
                            className="text-sm font-bold text-zinc-500 hover:text-zinc-700 mt-2 ml-2"
                        >
                            Show less
                        </button>
                    )}
                </div>
            </CollapsibleSection>

            {/* Trading Hours */}
            <CollapsibleSection title="Trading Hours" icon={Clock} defaultOpen={false}>
                <div className="space-y-0.5">
                    <FilterCheckbox
                        label="Open Now"
                        checked={searchParams.get("openNow") === "true"}
                        onChange={() => push({ openNow: searchParams.get("openNow") === "true" ? "" : "true" })}
                    />
                    <FilterCheckbox
                        label="Open 24 Hours"
                        checked={searchParams.get("is24h") === "true"}
                        onChange={() => push({ is24h: searchParams.get("is24h") === "true" ? "" : "true" })}
                    />
                </div>
            </CollapsibleSection>
        </div>
    );
}
