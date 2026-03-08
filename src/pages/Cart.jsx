import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import {
    selectCartItems, selectCartSubtotal, selectCartTotal, selectCartDiscount, selectCouponCode,
    removeFromCart, updateQty, clearCart, applyCoupon, removeCoupon,
} from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import { formatCurrency } from '../utils/deliveryUtils';
import DeliveryBadge from '../components/DeliveryBadge';
import { useValidateCouponQuery } from '../store/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Cart() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartSubtotal);
    const total = useSelector(selectCartTotal);
    const discount = useSelector(selectCartDiscount);
    const couponCode = useSelector(selectCouponCode);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const [couponInput, setCouponInput] = useState('');
    const [checkingCoupon, setCheckingCoupon] = useState(false);

    const applyCouponCode = async () => {
        if (!couponInput.trim()) return;
        setCheckingCoupon(true);
        try {
            const res = await fetch(`/api/coupons/validate/${couponInput.trim().toUpperCase()}?orderAmount=${subtotal}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('zomitron_token')}` },
            });
            const data = await res.json();
            if (data.success) {
                dispatch(applyCoupon({ code: couponInput.toUpperCase(), discount: data.discount }));
                toast.success(`Coupon applied! You save ${formatCurrency(data.discount)} 🎉`);
            } else {
                toast.error(data.message || 'Invalid coupon');
            }
        } catch { toast.error('Could not validate coupon'); }
        finally { setCheckingCoupon(false); }
    };

    if (items.length === 0) {
        return (
            <div className="page-container py-20 text-center">
                <div className="text-7xl mb-6">🛒</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet. Start shopping!</p>
                <Link to="/shop" className="btn btn-primary btn-xl">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div className="page-container py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Your Cart ({items.length} items)</h1>
                <button onClick={() => { dispatch(clearCart()); toast('Cart cleared'); }} className="text-sm text-red-500 hover:underline">Clear Cart</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart items */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div key={item._id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="card p-4 flex gap-4 items-start">
                                <Link to={`/product/${item._id}`} className="flex-shrink-0">
                                    <img src={item.images?.[0]} alt={item.title} className="w-20 h-20 rounded-2xl object-cover bg-gray-50" />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/product/${item._id}`} className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-primary">{item.title}</Link>
                                    {item.vendor?.storeName && <p className="text-xs text-gray-400 mt-0.5">🏪 {item.vendor.storeName}</p>}
                                    {item.deliveryInfo && <DeliveryBadge info={item.deliveryInfo} size="sm" />}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                            <button onClick={() => dispatch(updateQty({ id: item._id, qty: item.qty - 1 }))} className="p-2 hover:bg-gray-50">
                                                <MinusIcon className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="px-3 font-semibold text-sm">{item.qty}</span>
                                            <button onClick={() => dispatch(updateQty({ id: item._id, qty: item.qty + 1 }))} className="p-2 hover:bg-gray-50">
                                                <PlusIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{formatCurrency((item.effectivePrice || item.price) * item.qty)}</p>
                                            {item.qty > 1 && <p className="text-xs text-gray-400">{formatCurrency(item.effectivePrice || item.price)} each</p>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => dispatch(removeFromCart(item._id))} className="flex-shrink-0 p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Order summary */}
                <div>
                    <div className="card p-6 sticky top-24">
                        <h2 className="font-bold text-gray-900 mb-5 text-lg">Order Summary</h2>
                        <div className="space-y-3 text-sm mb-4">
                            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                            {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>- {formatCurrency(discount)}</span></div>}
                            <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-green-600">Calculated at checkout</span></div>
                            <div className="divider" />
                            <div className="flex justify-between text-base"><span className="font-bold text-gray-900">Total</span><span className="font-black text-xl text-gray-900">{formatCurrency(total)}</span></div>
                        </div>

                        {/* Coupon */}
                        {!couponCode ? (
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        placeholder="Coupon code" className="input text-sm py-2 flex-1" />
                                    <button onClick={applyCouponCode} disabled={checkingCoupon} className="btn btn-secondary text-sm px-3">
                                        {checkingCoupon ? '...' : 'Apply'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mb-4 p-2.5 bg-green-50 rounded-xl text-sm border border-green-100">
                                <span className="text-green-700 font-medium">🎉 {couponCode} applied</span>
                                <button onClick={() => dispatch(removeCoupon())} className="text-red-500 text-xs hover:underline">Remove</button>
                            </div>
                        )}

                        <button onClick={() => isAuthenticated ? navigate('/checkout') : navigate('/login')}
                            className="w-full btn btn-primary btn-lg mb-3">
                            {isAuthenticated ? 'Proceed to Checkout →' : 'Login to Checkout'}
                        </button>
                        <Link to="/shop" className="block w-full btn btn-secondary text-sm text-center">Continue Shopping</Link>

                        {/* Trust badges */}
                        <div className="mt-4 flex gap-4 text-xs text-gray-400 justify-center">
                            <span>🔒 Secure</span><span>↩️ Easy Returns</span><span>💳 Safe Pay</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
