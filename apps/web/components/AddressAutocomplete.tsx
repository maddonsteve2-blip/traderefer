"use client";

import { useRef, useState, useEffect } from "react";

declare global {
    interface Window {
        google?: any;
    }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/* ── Bootstrap the Maps JS API with importLibrary support ── */
let _loadPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
    if (_loadPromise) return _loadPromise;
    if (typeof window === "undefined") return Promise.reject(new Error("No window"));

    const g = (window as any).google;
    if (g?.maps?.places?.PlaceAutocompleteElement) {
        return (_loadPromise = Promise.resolve());
    }

    _loadPromise = new Promise<void>((resolve, reject) => {
        // Inject the Google Maps bootstrap loader (enables importLibrary)
        const bootstrapScript = document.createElement("script");
        bootstrapScript.textContent = `
            (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=q+"="+Date.now();r.add("maps");e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);var x=m.createElement("script");var N=d[l]=function(f,...n){return N._p||=new Promise(function(v,w){x.id="gm_authFailure_module";x.crossOrigin="";x.src="https://maps.googleapis.com/maps/api/js?"+e+"&callback="+q;d[q]=v;x.onerror=()=>h=w(Error(p+" could not load."));x.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.appendChild(x)}).then(()=>d[l](f,...n))};N({});})({key:"${API_KEY}",v:"weekly"});
        `;
        document.head.appendChild(bootstrapScript);

        // Now use importLibrary to load Places
        const waitForGoogle = () => {
            const goog = (window as any).google;
            if (goog?.maps?.importLibrary) {
                goog.maps.importLibrary("places").then(() => {
                    resolve();
                }).catch(reject);
            } else {
                setTimeout(waitForGoogle, 50);
            }
        };
        waitForGoogle();

        // Timeout after 15s
        setTimeout(() => reject(new Error("Google Maps load timeout")), 15000);
    });
    return _loadPromise;
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

        loadGoogleMaps()
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
            .catch((err) => {
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
