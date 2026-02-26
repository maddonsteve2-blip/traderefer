"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const loader = new Loader({ apiKey: API_KEY, version: "weekly" });

let _placesLib: any = null;
async function getPlacesLib(): Promise<any> {
    if (_placesLib) return _placesLib;
    _placesLib = await loader.importLibrary("places");
    return _placesLib;
}

export function AddressAutocomplete({
    addressValue = "",
    suburbValue = "",
    stateValue = "",
    onAddressSelect,
    className,
    placeholder = "Search for your address..."
}: {
    addressValue?: string;
    suburbValue?: string;
    stateValue?: string;
    onAddressSelect: (address: string, suburb: string, state: string, postcode?: string) => void;
    className?: string;
    placeholder?: string;
}) {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const sessionTokenRef = useRef<any>(null);
    const onSelectRef = useRef(onAddressSelect);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    onSelectRef.current = onAddressSelect;

    // Load Places library on mount
    useEffect(() => {
        getPlacesLib()
            .then((lib: any) => {
                sessionTokenRef.current = new lib.AutocompleteSessionToken();
                setReady(true);
            })
            .catch(() => setLoadError(true));
    }, []);

    // Sync initial display value
    useEffect(() => {
        if (addressValue && suburbValue && stateValue) {
            setInputValue(`${addressValue}, ${suburbValue} ${stateValue}`);
        } else if (addressValue && suburbValue) {
            setInputValue(`${addressValue}, ${suburbValue}`);
        } else if (addressValue) {
            setInputValue(addressValue);
        } else if (suburbValue) {
            setInputValue(suburbValue);
        }
    }, [addressValue, suburbValue, stateValue]);

    const fetchSuggestions = useCallback(async (input: string) => {
        if (!input || input.length < 3) { setSuggestions([]); return; }
        try {
            const lib = await getPlacesLib();
            if (!sessionTokenRef.current) {
                sessionTokenRef.current = new lib.AutocompleteSessionToken();
            }
            const { suggestions: results } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input,
                sessionToken: sessionTokenRef.current,
                includedRegionCodes: ["au"],
            });
            setSuggestions(results || []);
            setShowDropdown(true);
        } catch {
            setSuggestions([]);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
    };

    const handleSelect = useCallback(async (suggestion: any) => {
        setShowDropdown(false);
        setSuggestions([]);
        const displayText = suggestion.placePrediction?.text?.text || "";
        setInputValue(displayText);

        try {
            const lib = await getPlacesLib();
            const place = suggestion.placePrediction.toPlace();
            await place.fetchFields({
                fields: ["addressComponents", "formattedAddress", "displayName"],
            });
            // Refresh session token after selection
            sessionTokenRef.current = new lib.AutocompleteSessionToken();

            let streetNumber = "";
            let route = "";
            let locality = "";
            let adminArea = "VIC";
            let postcode = "";

            for (const c of (place.addressComponents || [])) {
                if (c.types.includes("street_number")) streetNumber = c.longText || "";
                if (c.types.includes("route")) route = c.longText || "";
                if (c.types.includes("locality")) locality = c.longText || "";
                if (c.types.includes("administrative_area_level_1")) adminArea = c.shortText || "";
                if (c.types.includes("postal_code")) postcode = c.longText || "";
            }
            if (!locality) {
                const sub = (place.addressComponents || []).find(
                    (c: any) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1")
                );
                if (sub) locality = sub.longText || "";
            }

            const address = `${streetNumber} ${route}`.trim();
            const full = place.formattedAddress || displayText;
            setInputValue(full);
            onSelectRef.current(
                address || place.displayName || full,
                locality || address || place.displayName || "",
                adminArea,
                postcode
            );
        } catch (err) {
            console.error("Place fetch error:", err);
        }
    }, []);

    if (loadError) return <div className="text-red-500 text-sm">Error loading address search</div>;

    return (
        <div className="relative">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder={ready ? placeholder : "Loading..."}
                className={className}
                disabled={!ready}
                autoComplete="off"
            />
            {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-zinc-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                    {suggestions.map((s: any, i: number) => (
                        <li
                            key={i}
                            onMouseDown={() => handleSelect(s)}
                            className="px-4 py-3 text-sm text-zinc-800 hover:bg-orange-50 hover:text-orange-700 cursor-pointer border-b border-zinc-50 last:border-0"
                        >
                            <span className="font-medium">{s.placePrediction?.mainText?.text}</span>
                            {s.placePrediction?.secondaryText?.text && (
                                <span className="text-zinc-400 ml-1">{s.placePrediction.secondaryText.text}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
