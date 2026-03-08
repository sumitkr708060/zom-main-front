import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCreateReviewMutation, useGetOrderQuery } from '../store/api';
import { useSocket } from '../hooks/useSocket';
import { formatCurrency, formatDate } from '../utils/deliveryUtils';
import DeliveryBadge from '../components/DeliveryBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDeliveryInfo } from '../utils/deliveryUtils';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

export default function OrderTracking() {
    const { id } = useParams();
    const { data, isLoading, refetch } = useGetOrderQuery(id);
    const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();
    const [reviewForm, setReviewForm] = useState({});
    const [submitted, setSubmitted] = useState({});
    const { subscribeToOrder } = useSocket({
        onOrderUpdate: ({ orderId }) => { if (orderId === id) refetch(); },
    });

    useEffect(() => { if (id) subscribeToOrder(id); }, [id, subscribeToOrder]);

    if (isLoading) return <LoadingSpinner />;
    const order = data?.order;
    if (!order) return (
        <div className="page-container py-20 text-center">
            <h2 className="text-xl font-bold mb-4">Order not found</h2>
            <Link to="/orders" className="btn btn-primary">My Orders</Link>
        </div>
    );

    const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
    const deliveryInfo = order.deliveryDistance ? getDeliveryInfo(order.deliveryDistance) : null;
    const handleReviewChange = (productId, field, value) => {
        setReviewForm((prev) => ({
            ...prev,
            [productId]: { ...prev[productId], [field]: value },
        }));
    };

    const handleImagesChange = (productId, fileList) => {
        const files = Array.from(fileList || []).slice(0, 3);
        handleReviewChange(productId, 'images', files);
    };

    const submitReview = async (item) => {
        const productId = item.productId?._id || item.productId;
        const form = reviewForm[productId] || {};
        if (!form.rating) return toast.error('Please select a rating');
        const fd = new FormData();
        fd.append('productId', productId);
        fd.append('orderId', order._id);
        fd.append('rating', form.rating);
        if (form.comment) fd.append('comment', form.comment);
        (form.images || []).forEach((file) => fd.append('images', file));

        try {
            await createReview(fd).unwrap();
            toast.success('Review submitted! Thank you 😊');
            setSubmitted((prev) => ({ ...prev, [productId]: true }));
        } catch (err) {
            toast.error(err?.data?.message || 'Could not submit review');
        }
    };

    return (
        <div className="page-container py-8 max-w-3xl">
            {/* Header */}
            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                        <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(order.total)}</p>
                        {deliveryInfo && <DeliveryBadge info={deliveryInfo} size="md" />}
                    </div>
                </div>
                {order.trackingCode && (
                    <p className="text-sm text-gray-600">🚚 Tracking: <strong>{order.trackingCode}</strong></p>
                )}
            </div>

            {/* Progress tracker */}
            <div className="card p-6 mb-6">
                <h2 className="font-bold text-gray-900 mb-6">Order Status</h2>
                <div className="relative">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
                        <div className="h-full bg-primary transition-all duration-700"
                            style={{ width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between relative">
                        {STATUS_STEPS.map((status, i) => {
                            const done = i <= currentStep;
                            return (
                                <div key={status} className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all z-10 ${done ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-xs text-center capitalize hidden sm:block ${done ? 'text-primary font-medium' : 'text-gray-400'}`}>
                                        {status.replace('_', ' ')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Delivery address */}
            <div className="card p-5 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">📦 Delivery Address</h3>
                <p className="text-sm text-gray-600">
                    {order.deliveryAddress?.name} · {order.deliveryAddress?.phone}<br />
                    {order.deliveryAddress?.line1}, {order.deliveryAddress?.line2 && `${order.deliveryAddress.line2}, `}
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                </p>
                {order.estimatedDelivery && (
                    <p className="text-sm text-primary font-medium mt-2">
                        ⏰ Estimated delivery: {formatDate(order.estimatedDelivery)}
                    </p>
                )}
            </div>

            {/* Items */}
            <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                    {order.items?.map((item) => (
                        <div key={item._id} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-3">
                            <div className="flex gap-3 items-center">
                                <img src={item.image || item.productId?.images?.[0]} className="w-14 h-14 rounded-xl object-cover" alt={item.title} />
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900 line-clamp-2">{item.title}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.qty} × {formatCurrency(item.price)}</p>
                                </div>
                                <span className="font-bold text-sm">{formatCurrency(item.price * item.qty)}</span>
                            </div>

                            {order.orderStatus === 'delivered' && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    {submitted[item.productId?._id || item.productId] ? (
                                        <div className="text-green-700 text-sm font-medium">Thanks! Your review is submitted.</div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-semibold text-gray-900">Rate this product</p>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((s) => {
                                                        const productId = item.productId?._id || item.productId;
                                                        const selected = (reviewForm[productId]?.rating || 0) >= s;
                                                        return (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                onClick={() => handleReviewChange(productId, 'rating', s)}
                                                                className="p-0.5"
                                                            >
                                                                <StarIcon className={`w-5 h-5 ${selected ? 'text-yellow-400' : 'text-gray-300'}`} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <textarea
                                                rows={3}
                                                placeholder="Share your experience"
                                                className="input w-full text-sm"
                                                value={reviewForm[item.productId?._id || item.productId]?.comment || ''}
                                                onChange={(e) => handleReviewChange(item.productId?._id || item.productId, 'comment', e.target.value)}
                                            />
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                <label className="btn btn-secondary btn-sm cursor-pointer">
                                                    Add Photos
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => handleImagesChange(item.productId?._id || item.productId, e.target.files)}
                                                    />
                                                </label>
                                                <p className="text-xs text-gray-500">Up to 3 photos. Helps others know what they'll get.</p>
                                                {(reviewForm[item.productId?._id || item.productId]?.images || []).length > 0 && (
                                                    <div className="flex gap-2">
                                                        {reviewForm[item.productId?._id || item.productId].images.map((file, idx) => (
                                                            <span key={idx} className="text-xs bg-white border border-gray-200 rounded px-2 py-1">
                                                                {file.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={isSubmitting}
                                                    onClick={() => submitReview(item)}
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between font-bold">
                    <span>Total</span><span className="text-primary">{formatCurrency(order.total)}</span>
                </div>
            </div>
        </div>
    );
}
