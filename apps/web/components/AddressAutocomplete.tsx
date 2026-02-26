"use client";

import { useRef, useState, useEffect } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

let _placesReady: Promise<void> | null = null;
let _optionsSet = false;
function loadPlaces(): Promise<void> {
    if (_placesReady) return _placesReady;
    if (!_optionsSet) {
        (setOptions as any)({ apiKey: API_KEY, version: "weekly" });
        _optionsSet = true;
    }
    _placesReady = importLibrary("places").then(() => {});
    return _placesReady!;
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [displayValue, setDisplayValue] = useState("");
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);
    const elementInserted = useRef(false);
    const onAddressSelectRef = useRef(onAddressSelect);
    onAddressSelectRef.current = onAddressSelect;

    // Sync initial display value
    useEffect(() => {
        if (addressValue && suburbValue && stateValue) {
            setDisplayValue(`${addressValue}, ${suburbValue} ${stateValue}`);
        } else if (addressValue && suburbValue) {
            setDisplayValue(`${addressValue}, ${suburbValue}`);
        } else if (addressValue) {
            setDisplayValue(addressValue);
        } else if (suburbValue) {
            setDisplayValue(suburbValue);
        }
    }, [addressValue, suburbValue, stateValue]);

    // Create and insert PlaceAutocompleteElement
    useEffect(() => {
        if (elementInserted.current) return;
        let cancelled = false;

        loadPlaces()
            .then(() => {
                if (cancelled || !containerRef.current || elementInserted.current) return;
                elementInserted.current = true;

                // Create the new PlaceAutocompleteElement (Web Component)
                const goog = (window as any).google;
                const pac = new goog.maps.places.PlaceAutocompleteElement({
                    includedRegionCodes: ["au"],
                });

                // Style the inner input to match our design
                pac.style.width = "100%";
                pac.setAttribute("placeholder", placeholder);

                // Listen for place selection
                pac.addEventListener("gmp-select", async (e: any) => {
                    try {
                        const placePrediction = e.placePrediction;
                        if (!placePrediction) return;

                        const place = placePrediction.toPlace();
                        await place.fetchFields({
                            fields: ["addressComponents", "formattedAddress", "displayName"],
                        });

                        let streetNumber = "";
                        let route = "";
                        let locality = "";
                        let adminArea = "VIC";

                        const components = place.addressComponents || [];
                        for (const component of components) {
                            const types = component.types || [];
                            if (types.includes("street_number")) streetNumber = component.longText || "";
                            if (types.includes("route")) route = component.longText || "";
                            if (types.includes("locality")) locality = component.longText || "";
                            if (types.includes("administrative_area_level_1")) adminArea = component.shortText || "";
                        }

                        if (!locality) {
                            const sub = components.find(
                                (c: any) => (c.types || []).includes("sublocality") || (c.types || []).includes("sublocality_level_1")
                            );
                            if (sub) locality = sub.longText || "";
                        }

                        const address = `${streetNumber} ${route}`.trim();
                        const fullAddress = place.formattedAddress || `${address}, ${locality}, ${adminArea}`;
                        const displayName = place.displayName || "";

                        setDisplayValue(fullAddress);
                        onAddressSelectRef.current(
                            address || displayName || fullAddress,
                            locality || address || displayName || "",
                            adminArea
                        );
                    } catch (err) {
                        console.error("Place selection error:", err);
                    }
                });

                // Clear existing content and insert the element
                containerRef.current.innerHTML = "";
                containerRef.current.appendChild(pac);
                setReady(true);
            })
            .catch((err: unknown) => {
                console.error("Google Maps load error:", err);
                if (!cancelled) setError(true);
            });

        return () => { cancelled = true; };
    }, [placeholder]);

    if (error) {
        return <div className="text-red-500 text-sm">Error loading address search</div>;
    }

    return (
        <div>
            {/* Show current value when a place has been selected */}
            {displayValue && ready && (
                <p className="mb-2 text-sm font-medium text-zinc-500">
                    Current: <span className="text-zinc-900">{displayValue}</span>
                </p>
            )}
            {/* Container for the PlaceAutocompleteElement Web Component */}
            <div
                ref={containerRef}
                className={className}
                style={{ minHeight: "48px" }}
            >
                {!ready && (
                    <input
                        className={className}
                        placeholder="Loading address search..."
                        disabled
                    />
                )}
            </div>
            <style>{`
                gmp-place-autocomplete {
                    width: 100%;
                }
                gmp-place-autocomplete input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                    border: 1px solid #e4e4e7;
                    border-radius: 0.75rem;
                    outline: none;
                    background: #fafafa;
                    transition: all 0.2s;
                }
                gmp-place-autocomplete input:focus {
                    border-color: #f97316;
                    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
                }
            `}</style>
        </div>
    );
}
