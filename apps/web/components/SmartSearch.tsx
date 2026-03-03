"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type SuburbResult = { suburb: string; city: string; state: string; count: number };

interface SmartSearchProps {
  variant?: "landing" | "navbar";
}

const TRADES = [
  "Air Conditioning & Heating",
  "Bricklaying",
  "Building & Carpentry",
  "Cabinet Making",
  "Cleaning",
  "Concreting",
  "Demolition",
  "Electrical",
  "Fencing",
  "Flooring",
  "Garage Doors",
  "Gardening & Lawn Care",
  "Glazing",
  "Handyman",
  "Insulation",
  "Landscaping",
  "Locksmith",
  "Painting",
  "Pest Control",
  "Plastering",
  "Plumbing",
  "Renovations",
  "Roofing",
  "Rubbish Removal",
  "Security Systems",
  "Sheds & Outdoor Structures",
  "Solar & Energy",
  "Tiling",
  "Tree Services",
  "Window Cleaning",
];

export function SmartSearch({ variant = "landing" }: SmartSearchProps) {
  const router = useRouter();
  const isLanding = variant === "landing";

  const [trade, setTrade] = useState("");
  const [suburb, setSuburb] = useState("");
  const [tradeOpen, setTradeOpen] = useState(false);
  const [suburbOpen, setSuburbOpen] = useState(false);
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbResult[]>([]);
  const [suburbLoading, setSuburbLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const suburbInputRef = useRef<HTMLInputElement>(null);

  // Trades: instant client-side filter — no API needed
  const tradeSuggestions = trade.length === 0
    ? TRADES.slice(0, 8)
    : TRADES.filter(t => t.toLowerCase().includes(trade.toLowerCase())).slice(0, 8);

  // Suburbs: debounced DB lookup
  useEffect(() => {
    if (suburb.length < 2) {
      setSuburbSuggestions([]);
      return;
    }
    setSuburbLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(suburb)}&type=location`);
        const data = await res.json();
        setSuburbSuggestions(data.suburbs ?? []);
      } catch {
        setSuburbSuggestions([]);
      } finally {
        setSuburbLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [suburb]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTradeOpen(false);
        setSuburbOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [selectedSuburbMeta, setSelectedSuburbMeta] = useState<{ city: string; state: string } | null>(null);

  const navigate = useCallback((t: string, s: string, meta?: { city: string; state: string } | null) => {
    const params = new URLSearchParams();
    if (t) params.set("category", t);
    if (s) params.set("suburb", s);
    const m = meta ?? selectedSuburbMeta;
    if (m?.city) params.set("city", m.city);
    if (m?.state) params.set("state", m.state);
    router.push(`/businesses${params.toString() ? `?${params}` : ""}`);
  }, [router, selectedSuburbMeta]);

  const selectTrade = (t: string) => {
    setTrade(t);
    setTradeOpen(false);
    suburbInputRef.current?.focus();
  };

  const selectSuburb = (s: SuburbResult) => {
    setSuburb(s.suburb);
    setSelectedSuburbMeta({ city: s.city, state: s.state });
    setSuburbOpen(false);
    navigate(trade, s.suburb, { city: s.city, state: s.state }); // auto-navigate immediately
  };

  const p = isLanding;

  return (
    <div ref={containerRef} className="w-full">
      <div className={`flex ${
        p
          ? "bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-visible"
          : "bg-white rounded-xl border border-gray-200 overflow-visible"
      }`}>

        {/* ── TRADE COLUMN ── */}
        <div className="relative flex-1 min-w-0">
          <div className={`flex items-center gap-2.5 ${p ? "px-5 py-3.5" : "px-3 py-2"}`}>
            <Search className={`shrink-0 text-[#FF6600] ${p ? "w-5 h-5" : "w-4 h-4"}`} />
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-gray-400 uppercase tracking-widest ${p ? "text-[11px] mb-0.5" : "text-[9px] mb-0"}`}>Trade</div>
              <input
                type="text"
                value={trade}
                onChange={e => { setTrade(e.target.value); setTradeOpen(true); }}
                onFocus={() => { setTradeOpen(true); setSuburbOpen(false); }}
                onKeyDown={e => {
                  if (e.key === "Enter") navigate(trade, suburb);
                  if (e.key === "Escape") setTradeOpen(false);
                }}
                placeholder="e.g. Plumbing"
                className={`w-full bg-transparent font-semibold text-gray-900 placeholder-gray-400 outline-none truncate ${p ? "text-base" : "text-sm"}`}
                autoComplete="off"
              />
            </div>
            {trade && (
              <button onMouseDown={e => { e.preventDefault(); setTrade(""); setTradeOpen(true); }} className="shrink-0 text-gray-300 hover:text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {tradeOpen && tradeSuggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] min-w-[240px] overflow-hidden">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trades</div>
              {tradeSuggestions.map(t => (
                <button
                  key={t}
                  onMouseDown={e => { e.preventDefault(); selectTrade(t); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between group transition-colors hover:bg-orange-50 hover:text-orange-600 ${
                    trade.toLowerCase() === t.toLowerCase() ? "bg-orange-50 text-orange-600" : "text-gray-700"
                  }`}
                >
                  <span>{t}</span>
                  <Search className="w-3 h-3 text-gray-300 group-hover:text-orange-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`shrink-0 bg-gray-200 w-px ${p ? "my-3" : "my-1.5"}`} />

        {/* ── SUBURB COLUMN ── */}
        <div className="relative flex-1 min-w-0">
          <div className={`flex items-center gap-2.5 ${p ? "px-5 py-3.5" : "px-3 py-2"}`}>
            <MapPin className={`shrink-0 text-gray-400 ${p ? "w-5 h-5" : "w-4 h-4"}`} />
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-gray-400 uppercase tracking-widest ${p ? "text-[11px] mb-0.5" : "text-[9px] mb-0"}`}>Suburb</div>
              <input
                ref={suburbInputRef}
                type="text"
                value={suburb}
                onChange={e => { setSuburb(e.target.value); setSuburbOpen(true); }}
                onFocus={() => { setSuburbOpen(true); setTradeOpen(false); }}
                onKeyDown={e => {
                  if (e.key === "Enter") navigate(trade, suburb);
                  if (e.key === "Escape") setSuburbOpen(false);
                }}
                placeholder="e.g. Richmond"
                className={`w-full bg-transparent font-semibold text-gray-900 placeholder-gray-400 outline-none truncate ${p ? "text-base" : "text-sm"}`}
                autoComplete="off"
              />
            </div>
            {suburbLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300 shrink-0" />
              : suburb
                ? <button onMouseDown={e => { e.preventDefault(); setSuburb(""); setSuburbSuggestions([]); }} className="shrink-0 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
                : null
            }
          </div>

          {suburbOpen && suburbSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden min-w-[220px]">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suburbs</div>
              {suburbSuggestions.map((s, i) => (
                <button
                  key={`${s.suburb}-${i}`}
                  onMouseDown={e => { e.preventDefault(); selectSuburb(s); }}
                  className="w-full text-left px-4 py-2 hover:bg-orange-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-orange-600">{s.suburb}</span>
                      <span className="text-xs text-gray-400 ml-1.5">{s.city}, {s.state?.toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-gray-300">{s.count}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── SEARCH BUTTON ── */}
        <button
          onClick={() => navigate(trade, suburb)}
          className={`shrink-0 bg-[#FF6600] hover:bg-[#E65C00] active:scale-95 text-white font-black transition-all flex items-center gap-1.5 ${
            p
              ? "px-6 py-3.5 rounded-r-2xl text-sm uppercase tracking-wide"
              : "px-3 py-2 rounded-r-xl text-xs uppercase tracking-wide"
          }`}
        >
          <span>FIND</span>
          {p && <span className="text-white/90 hidden sm:inline">VERIFIED TRADES</span>}
        </button>
      </div>
    </div>
  );
}
