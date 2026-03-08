import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { setLocation } from '../store/locationSlice';
import { useLocationDetection } from '../hooks/useLocation';
import toast from 'react-hot-toast';

export default function LocationPicker({ onClose }) {
    const dispatch = useDispatch();
    const { detectLocation, setManualLocation } = useLocationDetection();
    const currentLocation = useSelector((s) => s.location);
    const [pincode, setPincode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDetect = async () => {
        setLoading(true);
        try {
            const loc = await detectLocation(true);
            if (loc && (loc.city || loc.pincode)) {
                const label = [loc.city, loc.pincode].filter(Boolean).join(' ');
                toast.success(label ? `Delivering to ${label}` : 'Location detected');
                onClose();
            } else {
                toast.error('Could not detect a deliverable location. Try entering pincode.');
            }
        } catch {
            toast.error('Could not detect location. Try entering pincode.');
        } finally {
            setLoading(false);
        }
    };

    const handlePincodeSubmit = async (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(pincode)) return toast.error('Enter a valid 6-digit pincode');
        setLoading(true);
        try {
            const res = await setManualLocation(pincode);
            if (res?.success) {
                toast.success('Location updated!');
                onClose();
            } else {
                toast.error('We currently do not deliver to this pincode.');
            }
        } catch {
            toast.error('We currently do not deliver to this pincode.');
        } finally {
            setLoading(false);
        }
    };

    const popularCities = [
        { name: 'Prayagraj', pincode: '211001', lat: 25.4358, lng: 81.8463 },
        { name: 'Lucknow', pincode: '226001', lat: 26.8467, lng: 80.9462 },
        { name: 'Bangalore', pincode: '560001', lat: 12.9716, lng: 77.5946 },
        { name: 'Mumbai', pincode: '400001', lat: 18.9388, lng: 72.8354 },
        { name: 'New Delhi', pincode: '110001', lat: 28.6139, lng: 77.2090 },
        { name: 'Varanasi', pincode: '221001', lat: 25.3176, lng: 82.9739 },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="card w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Choose Delivery Location</h2>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Current location */}
                    {currentLocation.city && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-4 border border-orange-100">
                            <MapPinIcon className="w-5 h-5 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Current: {currentLocation.city}</p>
                                <p className="text-xs text-gray-500">{currentLocation.state} {currentLocation.pincode}</p>
                            </div>
                        </div>
                    )}

                    {/* Detect button */}
                    <button onClick={handleDetect} disabled={loading}
                        className="w-full btn btn-primary btn-lg mb-4 gap-2">
                        {loading ? '🔍 Detecting...' : '📍 Use My Current Location'}
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-sm text-gray-400 font-medium">or enter pincode</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Pincode form */}
                    <form onSubmit={handlePincodeSubmit} className="flex gap-2 mb-6">
                        <input
                            type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit pincode" maxLength={6}
                            className="input flex-1"
                        />
                        <button type="submit" disabled={loading} className="btn btn-primary px-4">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </button>
                    </form>

                    {/* Popular cities */}
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Popular Cities</p>
                        <div className="grid grid-cols-3 gap-2">
                            {popularCities.map((city) => (
                                <button key={city.pincode}
                                    onClick={() => {
                                        dispatch(setLocation({ lat: city.lat, lng: city.lng, city: city.name, pincode: city.pincode, source: 'manual' }));
                                        toast.success(`Location set to ${city.name}`);
                                        onClose();
                                    }}
                                    className="p-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary/40 hover:bg-orange-50 transition-all text-center">
                                    {city.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
