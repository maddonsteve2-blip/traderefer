"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const loader = new Loader({
    apiKey: API_KEY,
    version: "weekly",
    libraries: ["places"],
});

let _mapsReady: Promise<void> | null = null;
function loadMapsScript(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if (_mapsReady) return _mapsReady;
    _mapsReady = loader.load().then(() => {});
    return _mapsReady!;
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
    onAddressSelect: (address: string, suburb: string, state: string) => void;
    className?: string;
    placeholder?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const acRef = useRef<any>(null);
    const onSelectRef = useRef(onAddressSelect);
    onSelectRef.current = onAddressSelect;

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

    const handlePlaceChanged = useCallback(() => {
        const ac = acRef.current;
        if (!ac) return;
        const place = ac.getPlace();
        if (!place?.address_components) return;

        let streetNumber = "";
        let route = "";
        let locality = "";
        let adminArea = "VIC";

        for (const c of place.address_components) {
            if (c.types.includes("street_number")) streetNumber = c.long_name;
            if (c.types.includes("route")) route = c.long_name;
            if (c.types.includes("locality")) locality = c.long_name;
            if (c.types.includes("administrative_area_level_1")) adminArea = c.short_name;
        }

        if (!locality) {
            const sub = place.address_components.find(
                (c: any) => c.types.includes("sublocality") || c.types.includes("sublocality_level_1")
            );
            if (sub) locality = sub.long_name;
        }

        const address = `${streetNumber} ${route}`.trim();
        const full = place.formatted_address || `${address}, ${locality}, ${adminArea}`;
        setInputValue(full);
        onSelectRef.current(
            address || place.name || full,
            locality || address || place.name || "",
            adminArea
        );
    }, []);

    useEffect(() => {
        let cancelled = false;
        loadMapsScript()
            .then(() => {
                if (cancelled || !inputRef.current || acRef.current) return;
                const goog = (window as any).google;
                const ac = new goog.maps.places.Autocomplete(inputRef.current, {
                    componentRestrictions: { country: "au" },
                    fields: ["address_components", "formatted_address", "name"],
                });
                ac.addListener("place_changed", handlePlaceChanged);
                acRef.current = ac;
                setReady(true);
            })
            .catch(() => { if (!cancelled) setLoadError(true); });
        return () => { cancelled = true; };
    }, [handlePlaceChanged]);

    if (loadError) return <div className="text-red-500 text-sm">Error loading address search</div>;

    return (
        <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={ready ? placeholder : "Loading..."}
            className={className}
            disabled={!ready}
        />
    );
}
