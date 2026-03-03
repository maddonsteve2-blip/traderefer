"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Suggestion {
  trades: string[];
  suburbs: Array<{ suburb: string; city: string; state: string; postcode: string; count: number }>;
  postcodes: Array<{ postcode: string; suburb: string; city: string; state: string; count: number }>;
}

interface SmartSearchProps {
  variant?: "landing" | "navbar" | "compact";
}

const TRADE_CATEGORIES = [
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
  "Window Cleaning"
];

export function SmartSearch({ variant = "landing" }: SmartSearchProps) {
  const router = useRouter();
  const [tradeQuery, setTradeQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion>({ trades: [], suburbs: [], postcodes: [] });
  const [showTradeSuggestions, setShowTradeSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTrade, setActiveTrade] = useState(0);
  const [activeLocation, setActiveLocation] = useState(0);
  
  const tradeRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string, type: "trade" | "location") => {
    if (query.length < 2) {
      if (type === "trade") {
        setSuggestions(prev => ({ ...prev, trades: [] }));
      } else {
        setSuggestions(prev => ({ ...prev, suburbs: [], postcodes: [] }));
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=${type}`);
      const data = await res.json();
      setSuggestions(prev => ({
        ...prev,
        trades: type === "trade" ? data.trades : prev.trades,
        suburbs: type === "location" ? data.suburbs : prev.suburbs,
        postcodes: type === "location" ? data.postcodes : prev.postcodes,
      }));
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(tradeQuery, "trade");
    }, 150);
    return () => clearTimeout(timer);
  }, [tradeQuery, fetchSuggestions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(locationQuery, "location");
    }, 150);
    return () => clearTimeout(timer);
  }, [locationQuery, fetchSuggestions]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTradeSuggestions(false);
        setShowLocationSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get all location suggestions combined
  const allLocationSuggestions = [
    ...suggestions.suburbs.map(s => ({ type: "suburb" as const, ...s })),
    ...suggestions.postcodes.map(p => ({ type: "postcode" as const, ...p }))
  ].slice(0, 6);

  // Get trade suggestions (from local filter if API hasn't responded yet)
  const tradeSuggestions = suggestions.trades.length > 0 
    ? suggestions.trades 
    : TRADE_CATEGORIES.filter(t => t.toLowerCase().includes(tradeQuery.toLowerCase())).slice(0, 6);

  const handleTradeSelect = (trade: string) => {
    setTradeQuery(trade);
    setShowTradeSuggestions(false);
    setActiveTrade(0);
  };

  const handleLocationSelect = (location: { suburb: string; city: string; state: string; postcode?: string }) => {
    setLocationQuery(location.suburb);
    setShowLocationSuggestions(false);
    setActiveLocation(0);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (tradeQuery) params.set("category", tradeQuery);
    if (locationQuery) params.set("suburb", locationQuery);
    
    const url = `/businesses${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: "trade" | "location") => {
    if (field === "trade" && showTradeSuggestions) {
      const items = tradeSuggestions;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveTrade(prev => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveTrade(prev => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[activeTrade]) {
          handleTradeSelect(items[activeTrade]);
        } else {
          handleSearch();
        }
      } else if (e.key === "Escape") {
        setShowTradeSuggestions(false);
      }
    } else if (field === "location" && showLocationSuggestions) {
      const items = allLocationSuggestions;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveLocation(prev => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveLocation(prev => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[activeLocation]) {
          handleLocationSelect(items[activeLocation]);
        } else {
          handleSearch();
        }
      } else if (e.key === "Escape") {
        setShowLocationSuggestions(false);
      }
    } else if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isLanding = variant === "landing";
  const isCompact = variant === "compact";

  return (
    <div ref={containerRef} className="w-full">
      <div className={`flex flex-col md:flex-row gap-2 ${isLanding ? 'bg-white p-2 rounded-xl shadow-2xl' : 'bg-white rounded-lg border border-gray-200'}`}>
        {/* Trade Input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={`${isLanding ? 'w-5 h-5' : 'w-4 h-4'} text-gray-400`} />
          </div>
          <input
            ref={tradeRef}
            type="text"
            value={tradeQuery}
            onChange={(e) => {
              setTradeQuery(e.target.value);
              setShowTradeSuggestions(true);
              setActiveTrade(0);
            }}
            onFocus={() => {
              setShowTradeSuggestions(true);
              setShowLocationSuggestions(false);
            }}
            onKeyDown={(e) => handleKeyDown(e, "trade")}
            placeholder={isLanding ? "Search trades..." : "Search trades..."}
            className={`w-full text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent ${
              isLanding 
                ? 'pl-12 pr-4 py-4 text-lg rounded-lg' 
                : isCompact 
                  ? 'pl-10 pr-3 py-2.5 text-base rounded-lg' 
                  : 'pl-10 pr-3 py-3 text-base rounded-lg'
            }`}
          />
          {tradeQuery && (
            <button
              onClick={() => {
                setTradeQuery("");
                tradeRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          {/* Trade Suggestions Dropdown */}
          {showTradeSuggestions && tradeSuggestions.length > 0 && (
            <div className={`absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50 ${
              isLanding ? 'top-[calc(100%+8px)]' : 'top-full mt-1'
            }`}>
              <div className="py-2">
                <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Trades
                </div>
                {tradeSuggestions.map((trade, idx) => (
                  <button
                    key={trade}
                    onClick={() => handleTradeSelect(trade)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors ${
                      idx === activeTrade ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{trade}</span>
                    <ChevronRight className={`w-4 h-4 ${idx === activeTrade ? 'text-orange-500' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-200 my-2" />

        {/* Location Input */}
        <div className={`relative ${isLanding ? 'md:w-2/5' : 'flex-grow'}`}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className={`${isLanding ? 'w-5 h-5' : 'w-4 h-4'} text-gray-400`} />
          </div>
          <input
            ref={locationRef}
            type="text"
            value={locationQuery}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              setShowLocationSuggestions(true);
              setActiveLocation(0);
            }}
            onFocus={() => {
              setShowLocationSuggestions(true);
              setShowTradeSuggestions(false);
            }}
            onKeyDown={(e) => handleKeyDown(e, "location")}
            placeholder={isLanding ? "Suburb or postcode" : "Location..."}
            className={`w-full text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent ${
              isLanding 
                ? 'pl-12 pr-4 py-4 text-lg rounded-lg' 
                : isCompact 
                  ? 'pl-10 pr-3 py-2.5 text-base rounded-lg' 
                  : 'pl-10 pr-3 py-3 text-base rounded-lg'
            }`}
          />
          {locationQuery && (
            <button
              onClick={() => {
                setLocationQuery("");
                locationRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          {/* Location Suggestions Dropdown */}
          {showLocationSuggestions && allLocationSuggestions.length > 0 && (
            <div className={`absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50 ${
              isLanding ? 'top-[calc(100%+8px)]' : 'top-full mt-1'
            }`}>
              <div className="py-2">
                <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Locations
                </div>
                {allLocationSuggestions.map((loc, idx) => (
                  <button
                    key={`${loc.suburb}-${loc.city}-${idx}`}
                    onClick={() => handleLocationSelect(loc)}
                    className={`w-full px-4 py-2.5 text-left transition-colors ${
                      idx === activeLocation ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`font-medium ${idx === activeLocation ? 'text-orange-700' : 'text-gray-700'}`}>
                          {loc.suburb}
                          {loc.postcode && <span className="text-gray-400 ml-1">({loc.postcode})</span>}
                        </span>
                        <span className="text-xs text-gray-400">{loc.city}, {loc.state.toUpperCase()}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-300">{loc.count} trades</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className={`bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isLanding 
              ? 'px-6 py-4 rounded-lg md:w-auto w-full text-lg uppercase tracking-wide' 
              : isCompact 
                ? 'px-4 py-2.5 rounded-lg text-sm' 
                : 'px-5 py-3 rounded-lg'
          }`}
          style={{ minHeight: isLanding ? '56px' : undefined }}
        >
          {loading && variant !== "landing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="text-white">FIND</span>
              <span className="text-white/90 hidden sm:inline">VERIFIED TRADES</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
