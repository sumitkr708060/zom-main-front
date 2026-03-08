import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useRegisterVendorMutation } from '../../store/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CITY_COORDS_FALLBACK = {
    prayagraj: { lat: 25.4358, lng: 81.8463 },
    allahabad: { lat: 25.4358, lng: 81.8463 },
    lucknow: { lat: 26.8467, lng: 80.9462 },
    varanasi: { lat: 25.3176, lng: 82.9739 },
    kanpur: { lat: 26.4499, lng: 80.3319 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
    mumbai: { lat: 19.076, lng: 72.8777 },
    delhi: { lat: 28.6139, lng: 77.209 },
    'new delhi': { lat: 28.6139, lng: 77.209 },
};

const PINCODE_PREFIX_FALLBACK = {
    '110': { lat: 28.6139, lng: 77.209 },
    '208': { lat: 26.4499, lng: 80.3319 },
    '211': { lat: 25.4358, lng: 81.8463 },
    '221': { lat: 25.3176, lng: 82.9739 },
    '226': { lat: 26.8467, lng: 80.9462 },
    '400': { lat: 19.076, lng: 72.8777 },
    '560': { lat: 12.9716, lng: 77.5946 },
};

export default function VendorRegister() {
    const navigate = useNavigate();
    const [registerVendor, { isLoading }] = useRegisterVendorMutation();
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [searchingLocation, setSearchingLocation] = useState(false);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
    const city = watch('city');
    const pincode = watch('pincode');

    const fallbackFromForm = useMemo(() => {
        const cityKey = String(city || '').trim().toLowerCase();
        if (cityKey && CITY_COORDS_FALLBACK[cityKey]) return CITY_COORDS_FALLBACK[cityKey];
        if (/^\d{6}$/.test(String(pincode || ''))) {
            const prefix = String(pincode).slice(0, 3);
            if (PINCODE_PREFIX_FALLBACK[prefix]) return PINCODE_PREFIX_FALLBACK[prefix];
        }
        return { lat: 25.3176, lng: 82.9739 };
    }, [city, pincode]);

    const currentLat = Number.isFinite(parseFloat(manualLat)) ? parseFloat(manualLat) : fallbackFromForm.lat;
    const currentLng = Number.isFinite(parseFloat(manualLng)) ? parseFloat(manualLng) : fallbackFromForm.lng;
    const mapUrl = `https://maps.google.com/maps?q=${currentLat},${currentLng}&z=15&output=embed`;

    const setCoordinates = (lat, lng) => {
        const latStr = String(lat);
        const lngStr = String(lng);
        setManualLat(latStr);
        setManualLng(lngStr);
        setValue('lat', latStr);
        setValue('lng', lngStr);
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported in this browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                setCoordinates(lat, lng);
                toast.success('Location pinned from current GPS');
            },
            () => {
                toast.error('Could not get current location. You can still submit using pincode/city.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const searchLocation = async () => {
        const query = locationQuery.trim() || [
            watch('addressLine1'),
            watch('city'),
            watch('state'),
            watch('pincode'),
            'India',
        ].filter(Boolean).join(', ');

        if (!query) {
            toast.error('Enter a location to search');
            return;
        }

        try {
            setSearchingLocation(true);
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            const data = await res.json();
            const first = data?.[0];
            if (!first) {
                toast.error('Location not found. Try a more specific address.');
                return;
            }
            setCoordinates(Number(first.lat).toFixed(6), Number(first.lon).toFixed(6));
            toast.success('Location found and pinned');
        } catch {
            toast.error('Location search failed. Try again.');
        } finally {
            setSearchingLocation(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            const fallback = (() => {
                const cityKey = String(data.city || '').trim().toLowerCase();
                if (cityKey && CITY_COORDS_FALLBACK[cityKey]) return CITY_COORDS_FALLBACK[cityKey];
                if (/^\d{6}$/.test(String(data.pincode || ''))) {
                    const prefix = String(data.pincode).slice(0, 3);
                    if (PINCODE_PREFIX_FALLBACK[prefix]) return PINCODE_PREFIX_FALLBACK[prefix];
                }
                return null;
            })();

            const lat = Number.isFinite(parseFloat(data.lat)) ? parseFloat(data.lat) : fallback?.lat;
            const lng = Number.isFinite(parseFloat(data.lng)) ? parseFloat(data.lng) : fallback?.lng;

            const payload = {
                storeName: data.storeName,
                storeDescription: data.storeDescription,
                phone: data.phone,
                pincode: data.pincode,
                city: data.city,
                state: data.state,
                lat,
                lng,
                address: {
                    line1: data.addressLine1,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                },
                bankDetails: {
                    accountNumber: data.bankAccountNumber,
                    ifscCode: data.ifsc,
                },
            };

            await registerVendor(payload).unwrap();
            toast.success('Vendor application submitted! You\'ll be reviewed shortly. 🎉');
            navigate('/vendor/dashboard');
        } catch (err) {
            toast.error(err.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="page-container py-8 max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🏪</div>
                    <h1 className="text-3xl font-black text-gray-900">Start Selling on Zomitron</h1>
                    <p className="text-gray-500 mt-2">Set up your store and reach local customers within minutes</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Store Name*</label>
                                <input {...register('storeName', { required: 'Required' })} placeholder="My Store" className="input" />
                                {errors.storeName && <p className="text-error text-xs mt-1">{errors.storeName.message}</p>}
                            </div>
                            <div>
                                <label className="label">Business Phone*</label>
                                <input {...register('phone', { required: 'Required' })} placeholder="10-digit" className="input" />
                            </div>
                        </div>

                        <div>
                            <label className="label">Store Description</label>
                            <textarea {...register('storeDescription')} rows={3} placeholder="Tell customers about your store..." className="input resize-none" />
                        </div>

                        <div>
                            <label className="label">Store Address (Line 1)*</label>
                            <input {...register('addressLine1', { required: 'Required' })} placeholder="Shop/Floor/Building, Street" className="input" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="label">City*</label>
                                <input {...register('city', { required: 'Required' })} className="input" />
                            </div>
                            <div>
                                <label className="label">State*</label>
                                <input {...register('state', { required: 'Required' })} className="input" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="label">Pincode*</label>
                                <input {...register('pincode', { required: 'Required', pattern: { value: /^\d{6}$/, message: '6 digits' } })}
                                    maxLength={6} className="input" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="label mb-0">Google Map Pin Location</label>
                                <button type="button" onClick={useCurrentLocation} className="btn btn-secondary btn-sm">
                                    Use My Current Location
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={locationQuery}
                                    onChange={(e) => setLocationQuery(e.target.value)}
                                    className="input flex-1"
                                    placeholder="Search location (e.g. Sigra, Varanasi)"
                                />
                                <button type="button" onClick={searchLocation} disabled={searchingLocation} className="btn btn-secondary">
                                    {searchingLocation ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    {...register('lat')}
                                    value={manualLat}
                                    onChange={(e) => setCoordinates(e.target.value, manualLng)}
                                    placeholder="Latitude"
                                    className="input"
                                />
                                <input
                                    {...register('lng')}
                                    value={manualLng}
                                    onChange={(e) => setCoordinates(manualLat, e.target.value)}
                                    placeholder="Longitude"
                                    className="input"
                                />
                            </div>
                            <iframe
                                title="Vendor location preview"
                                src={mapUrl}
                                className="w-full h-56 rounded-2xl border border-gray-200"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-primary font-medium hover:underline inline-block"
                            >
                                Open in Google Maps
                            </a>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Bank Account Number*</label>
                                <input {...register('bankAccountNumber', { required: 'Required' })} className="input" />
                            </div>
                            <div>
                                <label className="label">IFSC Code*</label>
                                <input {...register('ifsc', { required: 'Required' })} className="input" placeholder="SBIN0001234" />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl text-sm text-blue-700 border border-blue-100">
                            <p className="font-semibold mb-1">ℹ️ What happens next?</p>
                            <p>Our team will review your application within 24-48 hours. You'll receive an email + WhatsApp notification once approved.</p>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full btn btn-primary btn-xl">
                            {isLoading ? 'Submitting...' : '🚀 Submit Vendor Application'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
