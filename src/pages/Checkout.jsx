import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    selectCartItems, selectCartSubtotal, selectCartTotal, selectCartDiscount, selectCouponCode, clearCart,
} from '../store/cartSlice';
import { selectCurrentUser } from '../store/authSlice';
import { useCreateOrderMutation, useGetPaymentConfigQuery, useCreateRazorpayOrderMutation, useVerifyRazorpayMutation } from '../store/api';
import { formatCurrency } from '../utils/deliveryUtils';
import toast from 'react-hot-toast';
import { useLocationDetection } from '../hooks/useLocation';

const PAYMENT_METHODS = [
    { value: 'razorpay', label: '💳 Razorpay (Cards/UPI/NetBanking)', icon: '₹' },
    { value: 'cod', label: '💵 Cash on Delivery', icon: '🏠' },
    { value: 'stripe', label: '💳 Stripe (International Cards)', icon: '$' },
];

export default function Checkout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartSubtotal);
    const total = useSelector(selectCartTotal);
    const discount = useSelector(selectCartDiscount);
    const couponCode = useSelector(selectCouponCode);
    const user = useSelector(selectCurrentUser);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [createOrder, { isLoading }] = useCreateOrderMutation();
    const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
    const [verifyRazorpay] = useVerifyRazorpayMutation();
    const { data: paymentConfig } = useGetPaymentConfigQuery();
    const addresses = user?.addresses || [];
    const [selectedAddressId, setSelectedAddressId] = useState(
        addresses.find((a) => a.isDefault)?._id || addresses[0]?._id || 'new'
    );
    const selectedAddress = useMemo(
        () => addresses.find((a) => a._id === selectedAddressId),
        [addresses, selectedAddressId]
    );
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [shouldPrefillFromDetected, setShouldPrefillFromDetected] = useState(false);
    const { location, detectLocation } = useLocationDetection();

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
            lat: '',
            lng: '',
        },
    });
    const watchLat = watch('lat');
    const watchLng = watch('lng');

    // Ensure selected address stays in sync with user data
    useEffect(() => {
        if (addresses.length === 0) {
            setSelectedAddressId('new');
            return;
        }
        const exists = addresses.some((a) => a._id === selectedAddressId);
        if (!exists) {
            const fallback = addresses.find((a) => a.isDefault) || addresses[0];
            setSelectedAddressId(fallback._id);
        }
    }, [addresses, selectedAddressId]);

    // Prefill form when address selection changes
    useEffect(() => {
        if (selectedAddressId && selectedAddressId !== 'new' && selectedAddress) {
            ['line1', 'line2', 'city', 'state', 'pincode', 'lat', 'lng'].forEach((key) => setValue(key, selectedAddress[key] || ''));
        }
        if (selectedAddressId === 'new') {
            ['line1', 'line2', 'city', 'state', 'pincode', 'lat', 'lng'].forEach((key) => setValue(key, ''));
        }
    }, [selectedAddressId, selectedAddress, setValue]);

    // Lazy-load Google Maps script
    useEffect(() => {
        if (window.google?.maps) { setMapLoaded(true); return; }
        const apiKey = window.GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;
        const existing = document.querySelector('script[data-google-maps]');
        if (existing) {
            existing.addEventListener('load', () => setMapLoaded(true), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.dataset.googleMaps = 'true';
        script.onload = () => setMapLoaded(true);
        document.body.appendChild(script);
    }, []);

    // Update map when coordinates change
    useEffect(() => {
        const latNum = parseFloat(watchLat);
        const lngNum = parseFloat(watchLng);
        if (!mapLoaded || !mapContainerRef.current || !window.google?.maps || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;
        const position = { lat: latNum, lng: lngNum };
        if (!mapRef.current) {
            mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
                center: position,
                zoom: 15,
                disableDefaultUI: true,
            });
        } else {
            mapRef.current.setCenter(position);
        }
        if (!markerRef.current) {
            markerRef.current = new window.google.maps.Marker({ map: mapRef.current });
        }
        markerRef.current.setPosition(position);
    }, [mapLoaded, watchLat, watchLng]);

    // Auto-detect location and prefill
    useEffect(() => {
        if (!shouldPrefillFromDetected) return;
        if (location?.lat && location?.lng) {
            setValue('lat', location.lat);
            setValue('lng', location.lng);
            setValue('city', location.city || '');
            setValue('state', location.state || '');
            setValue('pincode', location.pincode || '');
            setShouldPrefillFromDetected(false);
            toast.success('Location detected and filled');
        }
    }, [location, shouldPrefillFromDetected, setValue]);

    const handleAutoDetect = async () => {
        try {
            setDetectingLocation(true);
            setShouldPrefillFromDetected(true);
            await detectLocation();
        } catch {
            toast.error('Could not detect your location');
            setShouldPrefillFromDetected(false);
        } finally {
            setDetectingLocation(false);
        }
    };

    const handlePlaceOrder = async (formData) => {
        const orderPayload = {
            items: items.map((i) => ({ productId: i._id, qty: i.qty })),
            deliveryAddress: {
                ...formData,
                lat: formData.lat ? parseFloat(formData.lat) : undefined,
                lng: formData.lng ? parseFloat(formData.lng) : undefined,
            },
            guestEmail: formData.email,
            paymentMethod,
            couponCode,
        };

        try {
            const orderResult = await createOrder(orderPayload).unwrap();
            const orderId = orderResult.order._id;

            if (paymentMethod === 'razorpay' && paymentConfig?.razorpay?.keyId) {
                // Load Razorpay script
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                document.body.appendChild(script);
                await new Promise((res) => { script.onload = res; });

                const rzpOrder = await createRazorpayOrder({ orderId }).unwrap();
                const rzp = new window.Razorpay({
                    key: paymentConfig.razorpay.keyId,
                    amount: Math.round(total * 100),
                    currency: 'INR',
                    name: 'Zomitron',
                    description: `Order ${orderResult.order.orderNumber}`,
                    order_id: rzpOrder.razorpayOrderId,
                    handler: async (response) => {
                        await verifyRazorpay({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            orderId,
                        }).unwrap();
                        dispatch(clearCart());
                        toast.success('Payment successful! Order placed 🎉');
                        navigate(`/order-success/${orderId}`);
                    },
                    prefill: { name: formData.name, contact: formData.phone },
                    theme: { color: '#f97316' },
                });
                rzp.open();
            } else {
                // COD or other
                dispatch(clearCart());
                toast.success('Order placed successfully! 🎉');
                navigate(`/order-success/${orderId}`);
            }
        } catch (err) {
            toast.error(err.data?.message || 'Order failed. Please try again.');
        }
    };

    const handleInvalidSubmit = (formErrors) => {
        const firstError = Object.values(formErrors)[0];
        toast.error(firstError?.message || 'Please fill all required checkout details.');
    };

    if (items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="page-container py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

            <form onSubmit={handleSubmit(handlePlaceOrder, handleInvalidSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Delivery + Payment */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Delivery address */}
                        <div className="card p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">📦 Delivery Address</h2>
                            {addresses.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Saved addresses</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {addresses.map((addr, idx) => (
                                            <button
                                                type="button"
                                                key={addr._id || idx}
                                                onClick={() => setSelectedAddressId(addr._id)}
                                                className={`text-left border-2 rounded-xl p-3 transition-all hover:border-primary ${selectedAddressId === addr._id ? 'border-primary bg-orange-50' : 'border-gray-200'}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-sm text-gray-800">{addr.label || `Address ${idx + 1}`}</span>
                                                    {addr.isDefault && <span className="text-[10px] bg-gray-800 text-white rounded-full px-2 py-0.5">Default</span>}
                                                </div>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                                                    {addr.city}, {addr.state} - {addr.pincode}
                                                </p>
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAddressId('new')}
                                            className={`border-2 rounded-xl p-3 text-left flex items-center gap-2 justify-center h-full ${selectedAddressId === 'new' ? 'border-primary bg-orange-50' : 'border-dashed border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <span className="text-xl text-primary">+</span>
                                            <span className="text-sm font-medium text-gray-700">Add new address</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Name*</label>
                                    <input {...register('name', { required: 'Name required' })} className={`input ${errors.name ? 'input-error' : ''}`} />
                                    {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <label className="label">Phone*</label>
                                    <input {...register('phone', {
                                        required: 'Phone required',
                                        validate: (value) => {
                                            const digits = String(value || '').replace(/\D/g, '');
                                            return (digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))) || 'Enter valid 10-digit phone';
                                        },
                                    })}
                                        className={`input ${errors.phone ? 'input-error' : ''}`} />
                                    {errors.phone && <p className="text-error text-xs mt-1">{errors.phone.message}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="label">Email*</label>
                                    <input type="email" {...register('email', {
                                        required: 'Email required',
                                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter valid email' },
                                    })}
                                        className={`input ${errors.email ? 'input-error' : ''}`} />
                                    {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="label">Address Line 1*</label>
                                    <input {...register('line1', { required: 'Address required' })} placeholder="House/Flat no, Street"
                                        className={`input ${errors.line1 ? 'input-error' : ''}`} />
                                    {errors.line1 && <p className="text-error text-xs mt-1">{errors.line1.message}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="label">Address Line 2</label>
                                    <input {...register('line2')} placeholder="Locality, Landmark (optional)" className="input" />
                                </div>
                                <div>
                                    <label className="label">City*</label>
                                    <input {...register('city', { required: 'City required' })} className={`input ${errors.city ? 'input-error' : ''}`} />
                                    {errors.city && <p className="text-error text-xs mt-1">{errors.city.message}</p>}
                                </div>
                                <div>
                                    <label className="label">State*</label>
                                    <input {...register('state', { required: 'State required' })} className={`input ${errors.state ? 'input-error' : ''}`} />
                                    {errors.state && <p className="text-error text-xs mt-1">{errors.state.message}</p>}
                                </div>
                                <div>
                                    <label className="label">Pincode*</label>
                                    <input {...register('pincode', { required: 'Pincode required', pattern: { value: /^\d{6}$/, message: '6-digit pincode' } })}
                                        maxLength={6} className={`input ${errors.pincode ? 'input-error' : ''}`} />
                                    {errors.pincode && <p className="text-error text-xs mt-1">{errors.pincode.message}</p>}
                                </div>
                                <input type="hidden" {...register('lat')} />
                                <input type="hidden" {...register('lng')} />
                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="label mb-1">Location preview</p>
                                            <p className="text-[11px] text-gray-500">Use GPS to auto-fill and improve ETA accuracy.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAutoDetect}
                                            disabled={detectingLocation}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            {detectingLocation ? 'Detecting...' : 'Auto-detect'}
                                        </button>
                                    </div>
                                    <div
                                        ref={mapContainerRef}
                                        className="h-44 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center text-xs text-gray-500"
                                    >
                                        {(!mapLoaded || !watchLat || !watchLng) && (
                                            <span>Map appears once a location is set. Pick a saved address or auto-detect.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment method */}
                        <div className="card p-6">
                            <h2 className="font-bold text-gray-900 mb-5">💳 Payment Method</h2>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((pm) => (
                                    <label key={pm.value} className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === pm.value ? 'border-primary bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" value={pm.value} checked={paymentMethod === pm.value}
                                            onChange={() => setPaymentMethod(pm.value)} className="accent-primary w-4 h-4" />
                                        <span className="text-lg">{pm.icon}</span>
                                        <span className="font-medium text-sm text-gray-700">{pm.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div>
                        <div className="card p-6 sticky top-24">
                            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
                            <div className="space-y-2.5 text-sm max-h-48 overflow-y-auto mb-4">
                                {items.map((item) => (
                                    <div key={item._id} className="flex gap-3 items-center">
                                        <img src={item.images?.[0]} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt={item.title} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-xs line-clamp-2">{item.title}</p>
                                            <p className="text-gray-500 text-xs">Qty: {item.qty}</p>
                                        </div>
                                        <span className="font-semibold text-xs whitespace-nowrap">{formatCurrency((item.effectivePrice || item.price) * item.qty)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="divider mb-3" />
                            <div className="space-y-2 text-sm mb-5">
                                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({couponCode})</span><span>-{formatCurrency(discount)}</span></div>}
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span><span className="text-primary">{formatCurrency(total)}</span>
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full btn btn-primary btn-lg">
                                {isLoading ? 'Placing Order...' : `Place Order · ${formatCurrency(total)}`}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-3">🔒 Secure & Encrypted Payment</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
