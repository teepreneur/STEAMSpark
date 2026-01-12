"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapPin, Search, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LocationPickerProps {
    onLocationSelect: (location: { address: string; lat: number; lng: number }) => void
    defaultLocation?: { address: string; lat: number; lng: number }
    className?: string
}

// Load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (window.google?.maps) {
            resolve()
            return
        }

        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = reject
        document.head.appendChild(script)
    })
}

export default function LocationPicker({ onLocationSelect, defaultLocation, className }: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [marker, setMarker] = useState<google.maps.Marker | null>(null)
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
    const [loading, setLoading] = useState(true)
    const [address, setAddress] = useState(defaultLocation?.address || "")
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
        defaultLocation ? { lat: defaultLocation.lat, lng: defaultLocation.lng } : null
    )

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

    // Initialize Google Maps
    useEffect(() => {
        if (!API_KEY) {
            console.error("Google Maps API key is missing")
            setLoading(false)
            return
        }

        loadGoogleMapsScript(API_KEY)
            .then(() => {
                if (!mapRef.current) return

                // Default to Ghana (Accra) if no default location
                const defaultCenter = defaultLocation
                    ? { lat: defaultLocation.lat, lng: defaultLocation.lng }
                    : { lat: 5.6037, lng: -0.1870 }

                const mapInstance = new google.maps.Map(mapRef.current, {
                    center: defaultCenter,
                    zoom: defaultLocation ? 15 : 12,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false
                })

                setMap(mapInstance)

                // Create draggable marker
                const markerInstance = new google.maps.Marker({
                    position: defaultCenter,
                    map: mapInstance,
                    draggable: true,
                    animation: google.maps.Animation.DROP
                })

                setMarker(markerInstance)

                // Handle marker drag
                markerInstance.addListener("dragend", () => {
                    const position = markerInstance.getPosition()
                    if (position) {
                        const lat = position.lat()
                        const lng = position.lng()
                        setSelectedLocation({ lat, lng })

                        // Reverse geocode to get address
                        const geocoder = new google.maps.Geocoder()
                        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                            if (status === "OK" && results?.[0]) {
                                const newAddress = results[0].formatted_address
                                setAddress(newAddress)
                                onLocationSelect({ address: newAddress, lat, lng })
                            }
                        })
                    }
                })

                // Set up autocomplete
                if (inputRef.current) {
                    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
                        types: ["geocode", "establishment"],
                        componentRestrictions: { country: ["gh", "ng", "ke", "za", "gb", "us"] }
                    })

                    autocompleteInstance.bindTo("bounds", mapInstance)

                    autocompleteInstance.addListener("place_changed", () => {
                        const place = autocompleteInstance.getPlace()

                        if (place.geometry?.location) {
                            const lat = place.geometry.location.lat()
                            const lng = place.geometry.location.lng()

                            mapInstance.setCenter({ lat, lng })
                            mapInstance.setZoom(16)
                            markerInstance.setPosition({ lat, lng })

                            const newAddress = place.formatted_address || place.name || ""
                            setAddress(newAddress)
                            setSelectedLocation({ lat, lng })
                            onLocationSelect({ address: newAddress, lat, lng })
                        }
                    })

                    setAutocomplete(autocompleteInstance)
                }

                // If default location exists, trigger callback
                if (defaultLocation) {
                    setSelectedLocation({ lat: defaultLocation.lat, lng: defaultLocation.lng })
                }

                setLoading(false)
            })
            .catch((err) => {
                console.error("Failed to load Google Maps:", err)
                setLoading(false)
            })
    }, [API_KEY, defaultLocation, onLocationSelect])

    const clearLocation = useCallback(() => {
        setAddress("")
        setSelectedLocation(null)
        if (marker && map) {
            const defaultCenter = { lat: 5.6037, lng: -0.1870 }
            marker.setPosition(defaultCenter)
            map.setCenter(defaultCenter)
            map.setZoom(12)
        }
    }, [marker, map])

    if (!API_KEY) {
        return (
            <div className={cn("bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4", className)}>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                    Google Maps is not configured. Location selection unavailable.
                </p>
            </div>
        )
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for your address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-9 pr-9"
                />
                {address && (
                    <button
                        type="button"
                        onClick={clearLocation}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {/* Map Container */}
            <div className="relative rounded-xl overflow-hidden border border-border">
                {loading && (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                        <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                )}
                <div ref={mapRef} className="w-full h-[200px]" />
            </div>

            {/* Selected Location Display */}
            {selectedLocation && address && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <MapPin className="size-4 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Selected Location</p>
                        <p className="text-xs text-green-600 dark:text-green-400 truncate">{address}</p>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Search for your address or drag the pin on the map to set your exact location.
            </p>
        </div>
    )
}
