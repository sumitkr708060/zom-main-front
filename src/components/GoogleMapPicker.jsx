import { useEffect, useRef, useState, useCallback } from 'react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let scriptLoaded = false;
let scriptLoading = false;
const callbacks = [];

function loadGoogleMapsScript(cb) {
    if (window.google && window.google.maps) {
        cb(true);
        return;
    }
    callbacks.push(cb);
    if (scriptLoading) return;
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
        scriptLoaded = true;
        callbacks.forEach((fn) => fn(true));
        callbacks.length = 0;
    };
    script.onerror = () => {
        scriptLoaded = false;
        callbacks.forEach((fn) => fn(false));
        callbacks.length = 0;
    };
    document.head.appendChild(script);
}

const decodeHtml = (value = '') => {
    if (typeof window === 'undefined') return value;
    const txt = document.createElement('textarea');
    txt.innerHTML = value;
    return txt.value;
};

const OSM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const OSM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * GoogleMapPicker
 * Props:
 *   initialLat {number}
 *   initialLng {number}
 *   onLocationSelect({ lat, lng, address, city, state, pincode }) — called when location changes
 *   readOnly {bool} — show map without autocomplete / drag
 *   height {string} — css height, default '260px'
 *   forceEmbed {bool} — skip JS API, always use embed fallback
 */
export default function GoogleMapPicker({ initialLat, initialLng, onLocationSelect, readOnly = false, height = '260px', forceEmbed = false }) {
    const mapRef = useRef(null);
    const inputRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [mapsReady, setMapsReady] = useState(!!(window.google && window.google.maps));
    const [address, setAddress] = useState('');
    const [mapsFailed, setMapsFailed] = useState(false);
    const [fallbackSearch, setFallbackSearch] = useState('');
    const [fallbackSearching, setFallbackSearching] = useState(false);
    const [fallbackCoords, setFallbackCoords] = useState({
        lat: initialLat || 20.5937,
        lng: initialLng || 78.9629,
    });

    const defaultLat = initialLat || 20.5937;
    const defaultLng = initialLng || 78.9629;
    const useFallbackMap = forceEmbed || (!MAPS_API_KEY || MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') || mapsFailed;

    const reverseGeocode = useCallback((lat, lng) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const place = results[0];
                const components = place.address_components || [];
                const get = (type) => components.find((c) => c.types.includes(type))?.long_name || '';
                const city = get('locality') || get('administrative_area_level_2') || get('sublocality_level_1');
                const state = get('administrative_area_level_1');
                const pincode = get('postal_code');
                const formattedAddress = place.formatted_address;
                setAddress(formattedAddress);
                if (onLocationSelect) onLocationSelect({ lat, lng, address: formattedAddress, city, state, pincode });
            }
        });
    }, [onLocationSelect]);

    const reverseGeocodeFallback = useCallback(async (lat, lng) => {
        try {
            const url = `${OSM_REVERSE_URL}?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en',
                },
            });
            const data = await res.json();
            const addr = data?.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const state = addr.state || '';
            const pincode = addr.postcode || '';
            const formattedAddress = decodeHtml(data?.display_name || '');
            setAddress(formattedAddress);
            if (onLocationSelect) onLocationSelect({ lat, lng, address: formattedAddress, city, state, pincode });
        } catch {
            if (onLocationSelect) onLocationSelect({ lat, lng, address: '', city: '', state: '', pincode: '' });
        }
    }, [onLocationSelect]);

    const searchFallbackLocation = useCallback(async () => {
        const query = fallbackSearch.trim();
        if (!query) return;

        try {
            setFallbackSearching(true);
            const url = `${OSM_SEARCH_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en',
                },
            });
            const data = await res.json();
            const first = data?.[0];
            if (!first) return;
            const lat = Number(first.lat);
            const lng = Number(first.lon);
            const formattedAddress = decodeHtml(first.display_name || '');
            setAddress(formattedAddress);
            setFallbackCoords({ lat, lng });
            await reverseGeocodeFallback(lat, lng);
        } finally {
            setFallbackSearching(false);
        }
    }, [fallbackSearch, reverseGeocodeFallback]);

    useEffect(() => {
        if (!MAPS_API_KEY || MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            setMapsFailed(true);
            return;
        }
        // Google calls this on auth / billing errors. Fall back to OSM gracefully.
        const originalAuthFailure = window.gm_authFailure;
        window.gm_authFailure = () => {
            console.error('Google Maps auth failed. Falling back to OSM.');
            setMapsFailed(true);
            if (typeof originalAuthFailure === 'function') originalAuthFailure();
        };

        loadGoogleMapsScript((ok) => {
            if (ok) setMapsReady(true);
            else setMapsFailed(true);
        });
        // If script said ok but google is still missing after a tick, fall back.
        const fallbackTimer = setTimeout(() => {
            if (!window.google || !window.google.maps) {
                setMapsFailed(true);
            }
        }, 1500);

        return () => {
            clearTimeout(fallbackTimer);
            window.gm_authFailure = originalAuthFailure;
        };
    }, []);

    useEffect(() => {
        if (!mapsReady || !mapRef.current || useFallbackMap) return;

        try {
            const center = { lat: defaultLat, lng: defaultLng };
            const map = new window.google.maps.Map(mapRef.current, {
                center,
                zoom: 15,
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                zoomControl: true,
                styles: [
                    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                ],
            });
            mapInstance.current = map;

            const marker = new window.google.maps.Marker({
                position: center,
                map,
                draggable: !readOnly,
                animation: window.google.maps.Animation.DROP,
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                },
            });
            markerRef.current = marker;

            if (!readOnly) {
                marker.addListener('dragend', (e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    reverseGeocode(lat, lng);
                });

                map.addListener('click', (e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    marker.setPosition({ lat, lng });
                    reverseGeocode(lat, lng);
                });
            }

            // Setup Places Autocomplete on the input
            if (!readOnly && inputRef.current) {
                const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                    fields: ['formatted_address', 'geometry', 'address_components', 'name'],
                });
                autocompleteRef.current = autocomplete;

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry) return;

                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    map.setCenter({ lat, lng });
                    map.setZoom(16);
                    marker.setPosition({ lat, lng });

                    const components = place.address_components || [];
                    const get = (type) => components.find((c) => c.types.includes(type))?.long_name || '';
                    const city = get('locality') || get('administrative_area_level_2') || get('sublocality_level_1');
                    const state = get('administrative_area_level_1');
                    const pincode = get('postal_code');
                    const formattedAddress = place.formatted_address;
                    setAddress(formattedAddress);
                    if (onLocationSelect) onLocationSelect({ lat, lng, address: formattedAddress, city, state, pincode });
                });
            }
        } catch {
            setMapsFailed(true);
        }
    }, [mapsReady, useFallbackMap]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update marker when initial coords change externally
    useEffect(() => {
        if (!mapInstance.current || !markerRef.current) return;
        if (!initialLat || !initialLng) return;
        const pos = { lat: initialLat, lng: initialLng };
        markerRef.current.setPosition(pos);
        mapInstance.current.setCenter(pos);
    }, [initialLat, initialLng]);

    useEffect(() => {
        if (!initialLat || !initialLng) return;
        setFallbackCoords({ lat: initialLat, lng: initialLng });
    }, [initialLat, initialLng]);

    if (useFallbackMap) {
        const lat = fallbackCoords.lat || defaultLat;
        const lng = fallbackCoords.lng || defaultLng;
        const iframeSrc = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

        return (
            <div className="space-y-2">
                {!readOnly && (
                    <div className="flex gap-2">
                        <input
                            value={fallbackSearch}
                            onChange={(e) => setFallbackSearch(e.target.value)}
                            placeholder="Search location..."
                            className="input flex-1 text-sm"
                        />
                        <button type="button" className="btn btn-secondary" onClick={searchFallbackLocation} disabled={fallbackSearching}>
                            {fallbackSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                )}
                <iframe
                    title="Google Maps location preview"
                    src={iframeSrc}
                    className="w-full rounded-xl border border-gray-200"
                    style={{ height }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                {!readOnly && (
                    <div className="text-xs text-gray-500">
                        Selected: {lat.toFixed(6)}, {lng.toFixed(6)}
                    </div>
                )}
                {!readOnly && (
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => reverseGeocodeFallback(lat, lng)}
                    >
                        Use These Coordinates
                    </button>
                )}
                {!readOnly && address && (
                    <p className="text-xs text-gray-500 truncate">{address}</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {!readOnly && (
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        defaultValue={address}
                        placeholder="Search for your store location..."
                        className="input pl-9 text-sm shadow-sm"
                        style={{ position: 'relative', zIndex: 5 }}
                    />
                </div>
            )}
            {!mapsReady && (
                <div className="rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading map...
                    </div>
                </div>
            )}
            <div
                ref={mapRef}
                style={{ height, display: mapsReady ? 'block' : 'none', borderRadius: '12px', overflow: 'hidden' }}
                className="w-full shadow-sm border border-gray-200"
            />
            {!readOnly && address && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span className="truncate">{address}</span>
                </p>
            )}
        </div>
    );
}
