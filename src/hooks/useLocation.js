import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLocation, setLocationLoading, setLocationError, selectLocation } from '../store/locationSlice';
import axios from 'axios';

export const useLocationDetection = () => {
    const dispatch = useDispatch();
    const location = useSelector(selectLocation);

    const detectFromBrowser = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    let loc = { lat, lng, source: 'browser' };
                    try {
                        // Reverse geocode to get city/pincode
                        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                            params: { lat, lon: lng, format: 'json' },
                            headers: { 'Accept-Language': 'en' },
                        });
                        const addr = res.data.address;
                        loc = {
                            ...loc,
                            city: addr.city || addr.town || addr.village || addr.county || '',
                            state: addr.state || '',
                            pincode: (addr.postcode || '').replace(/\s/g, ''),
                            country: addr.country || 'India',
                        };

                        // If we have a pincode, validate/normalize with backend
                        if (loc.pincode && /^\d{6}$/.test(loc.pincode)) {
                            const pinRes = await axios.get(`/api/pincode/${loc.pincode}`);
                            if (pinRes.data?.success) {
                                loc = {
                                    ...loc,
                                    city: pinRes.data.city || loc.city,
                                    state: pinRes.data.state || loc.state,
                                    lat: pinRes.data.lat || loc.lat,
                                    lng: pinRes.data.lng || loc.lng,
                                };
                            }
                        }
                    } catch {
                        // ignore reverse-geocode failures; fall back to lat/lng only
                    }
                    resolve(loc);
                },
                (err) => reject(err),
                { timeout: 8000, maximumAge: 300000 }
            );
        });
    }, []);

    const detectFromIP = useCallback(async () => {
        const res = await axios.get('/api/notifications/detect-location', { timeout: 5000 });
        return { ...res.data.location, source: 'ip' };
    }, []);

    const setManualLocation = useCallback(async (pincode) => {
        try {
            dispatch(setLocationLoading(true));
            const res = await axios.get(`/api/pincode/${pincode}`);
            if (res.data.success) {
                dispatch(setLocation({
                    lat: res.data.lat, lng: res.data.lng,
                    city: res.data.city, state: res.data.state,
                    pincode: String(pincode), source: 'manual',
                }));
            }
            return res.data;
        } finally {
            dispatch(setLocationLoading(false));
        }
    }, [dispatch]);

    const detectLocation = useCallback(async (force = false) => {
        if (!force && location.detected && location.source !== 'default') return location; // Already detected
        dispatch(setLocationLoading(true));
        try {
            // 1. Try browser geolocation
            let geo = await detectFromBrowser();
            // If browser result lacks city/pincode, try IP as a supplement
            if (!geo.city && !geo.pincode) {
                try {
                    const ipGeo = await detectFromIP();
                    geo = { ...geo, ...ipGeo, source: geo.source || ipGeo.source };
                } catch {
                    // ignore; keep whatever we got from browser
                }
            }
            dispatch(setLocation(geo));
            return geo;
        } catch (err) {
            try {
                // 2. Fallback: IP geolocation
                const ipGeo = await detectFromIP();
                dispatch(setLocation(ipGeo));
                return ipGeo;
            } catch (err2) {
                dispatch(setLocationError('Could not detect location. Using default.'));
                throw err2;
            }
        } finally {
            dispatch(setLocationLoading(false));
        }
    }, [location.detected, location.source, detectFromBrowser, detectFromIP, dispatch, location]);

    // Auto-detect on first load (force re-check even if default present)
    useEffect(() => { detectLocation(true); }, []); // eslint-disable-line

    return { location, detectLocation, setManualLocation };
};
