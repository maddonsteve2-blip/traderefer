"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const loader = new Loader({ apiKey: API_KEY, version: "weekly", libraries: ["places"] });

type SuggestionItem = {
    fullText: string;
    mainText: string;
    placeId: string;
    secondaryText: string;
};

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
    const [inputValue, setInputValue] = useState(() => {
        if (addressValue && suburbValue && stateValue) {
            return `${addressValue}, ${suburbValue} ${stateValue}`;
        }
        if (addressValue && suburbValue) {
            return `${addressValue}, ${suburbValue}`;
        }
        if (addressValue) {
            return addressValue;
        }
        if (suburbValue) {
            return suburbValue;
        }
        return "";
    });
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const mapsRef = useRef<typeof google | null>(null);
    const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    const placesContainerRef = useRef<HTMLDivElement | null>(null);
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const onSelectRef = useRef(onAddressSelect);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        onSelectRef.current = onAddressSelect;
    }, [onAddressSelect]);

    useEffect(() => {
        let mounted = true;

        loader.load()
            .then((googleMaps) => {
                if (!mounted || !placesContainerRef.current) return;
                mapsRef.current = googleMaps;
                serviceRef.current = new googleMaps.maps.places.AutocompleteService();
                placesServiceRef.current = new googleMaps.maps.places.PlacesService(placesContainerRef.current);
                sessionTokenRef.current = new googleMaps.maps.places.AutocompleteSessionToken();
                setReady(true);
            })
            .catch(() => setLoadError(true));

        return () => {
            mounted = false;
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const fetchSuggestions = useCallback(async (input: string) => {
        if (!input || input.length < 3) {
            setSuggestions([]);
            setShowDropdown(false);
            setFetchError(false);
            return;
        }

        if (!serviceRef.current) {
            setFetchError(true);
            return;
        }

        try {
            if (!sessionTokenRef.current) {
                const googleMaps = mapsRef.current;
                if (!googleMaps) {
                    setFetchError(true);
                    return;
                }
                sessionTokenRef.current = new googleMaps.maps.places.AutocompleteSessionToken();
            }

            const response = await serviceRef.current.getPlacePredictions({
                input,
                componentRestrictions: { country: "au" },
                sessionToken: sessionTokenRef.current,
                types: ["address"],
            });

            const results = response.predictions || [];

            if (!results || results.length === 0) {
                setFetchError(true);
            } else {
                setFetchError(false);
            }

            setSuggestions(results.map((prediction) => ({
                fullText: prediction.description,
                mainText: prediction.structured_formatting.main_text,
                placeId: prediction.place_id,
                secondaryText: prediction.structured_formatting.secondary_text || "",
            })));
            setShowDropdown(results.length > 0);
        } catch (err) {
            console.error("Places autocomplete error:", err);
            setFetchError(true);
            setSuggestions([]);
            setShowDropdown(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
    };

    const handleSelect = useCallback(async (suggestion: SuggestionItem) => {
        setShowDropdown(false);
        setSuggestions([]);
        const displayText = suggestion.fullText || "";
        setInputValue(displayText);

        if (!placesServiceRef.current) {
            setFetchError(true);
            return;
        }

        try {
            const place = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
                placesServiceRef.current?.getDetails({
                    placeId: suggestion.placeId,
                    fields: ["address_components", "formatted_address", "name"],
                    sessionToken: sessionTokenRef.current || undefined,
                }, (result, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                        resolve(result);
                        return;
                    }
                    reject(new Error(status || "PLACE_DETAILS_FAILED"));
                });
            });

            const googleMaps = mapsRef.current;
            if (googleMaps) {
                sessionTokenRef.current = new googleMaps.maps.places.AutocompleteSessionToken();
            }

            let streetNumber = "";
            let route = "";
            let locality = "";
            let adminArea = "VIC";
            let postcode = "";

            for (const c of (place.address_components || [])) {
                if (c.types.includes("street_number")) streetNumber = c.long_name || "";
                if (c.types.includes("route")) route = c.long_name || "";
                if (c.types.includes("locality")) locality = c.long_name || "";
                if (c.types.includes("administrative_area_level_1")) adminArea = c.short_name || "";
                if (c.types.includes("postal_code")) postcode = c.long_name || "";
            }

            if (!locality) {
                const sub = (place.address_components || []).find(
                    (c) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1")
                );
                if (sub) locality = sub.long_name || "";
            }

            const address = `${streetNumber} ${route}`.trim();
            const full = place.formatted_address || displayText;
            setInputValue(full);
            onSelectRef.current(
                address || place.name || full,
                locality || address || place.name || "",
                adminArea,
                postcode
            );
        } catch (err) {
            console.error("Place fetch error:", err);
        }
    }, []);

    if (loadError || manualMode) {
        return (
            <div className="space-y-2">
                <input
                    type="text"
                    placeholder="Street address (e.g. 42 Main St)"
                    defaultValue={addressValue}
                    onChange={(e) => onSelectRef.current(e.target.value, suburbValue, stateValue)}
                    className={className}
                    autoComplete="street-address"
                />
                {!loadError && (
                    <button
                        type="button"
                        onClick={() => setManualMode(false)}
                        className="text-xs text-orange-600 hover:underline"
                    >
                        ← Back to address search
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <div ref={placesContainerRef} className="hidden" />
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder={ready ? placeholder : "Loading address search..."}
                className={className}
                disabled={!ready}
                autoComplete="off"
            />
            {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-zinc-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            onMouseDown={() => handleSelect(s)}
                            className="px-4 py-3 text-sm text-zinc-800 hover:bg-orange-50 hover:text-orange-700 cursor-pointer border-b border-zinc-50 last:border-0"
                        >
                            <span className="font-medium">{s.mainText}</span>
                            {s.secondaryText && (
                                <span className="text-zinc-400 ml-1">{s.secondaryText}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {fetchError && (
                <p className="mt-1 text-xs text-zinc-400">
                    Can&apos;t find your address?{" "}
                    <button type="button" onClick={() => setManualMode(true)} className="text-orange-600 hover:underline font-medium">
                        Enter manually
                    </button>
                </p>
            )}
        </div>
    );
}
