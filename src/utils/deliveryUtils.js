export const getDeliveryInfo = (distanceKm) => {
    if (distanceKm <= 5) return { eta: '1 hour', etaLabel: '⚡ 1 Hr', badge: '1hr', color: 'green', deliveryCharge: 0 };
    if (distanceKm <= 60) return { eta: '2 hours', etaLabel: '🚀 2 Hr', badge: '2hr', color: 'blue', deliveryCharge: Math.round(29 + (distanceKm - 5) * 0.36) };
    if (distanceKm <= 100) return { eta: '1 day', etaLabel: '📦 1 Day', badge: '1day', color: 'orange', deliveryCharge: Math.round(50 + (distanceKm - 60) * 0.725) };
    if (distanceKm <= 500) return { eta: '2-3 days', etaLabel: '🚚 2-3 Days', badge: '2-3days', color: 'gray', deliveryCharge: Math.round(80 + (distanceKm - 100) * 0.175) };
    return { eta: '5-7 days', etaLabel: '📬 5-7 Days', badge: '5-7days', color: 'red', deliveryCharge: 150 };
};

export const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
};

export const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const validatePincode = (pin) => /^\d{6}$/.test(pin);

export const getDeliveryBadgeClass = (badge) => {
    const map = { '1hr': 'delivery-1hr', '2hr': 'delivery-2hr', '1day': 'delivery-1day' };
    return map[badge] || 'delivery-slow';
};
