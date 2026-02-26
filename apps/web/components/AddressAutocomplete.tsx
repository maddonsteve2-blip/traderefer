"use client";

import { useState, useEffect } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

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
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [inputValue, setInputValue] = useState("");

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

    const onLoad = (autocompleteCtx: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteCtx);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (!place || !place.address_components) return;

            let streetNumber = "";
            let route = "";
            let locality = "";
            let adminArea = "VIC";

            for (const component of place.address_components) {
                const types = component.types;
                if (types.includes("street_number")) {
                    streetNumber = component.long_name;
                }
                if (types.includes("route")) {
                    route = component.long_name;
                }
                if (types.includes("locality")) {
                    locality = component.long_name;
                }
                if (types.includes("administrative_area_level_1")) {
                    adminArea = component.short_name;
                }
            }

            if (!locality) {
                const sublocality = place.address_components.find(c => c.types.includes("sublocality") || c.types.includes("sublocality_level_1"));
                if (sublocality) locality = sublocality.long_name;
            }

            const address = `${streetNumber} ${route}`.trim();
            const fullAddress = place.formatted_address || `${address}, ${locality}, ${adminArea}`;

            setInputValue(fullAddress);
            onAddressSelect(address || place.name || fullAddress, locality || address || place.name || "", adminArea);
        }
    };

    if (loadError) return <div className="text-red-500 text-sm">Error loading maps</div>;
    if (!isLoaded) return <input className={className} placeholder="Loading maps..." disabled />;

    return (
        <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
                componentRestrictions: { country: "au" },
                fields: ["address_components", "formatted_address", "name"]
            }}
        >
            <input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={className}
            />
        </Autocomplete>
    );
}
