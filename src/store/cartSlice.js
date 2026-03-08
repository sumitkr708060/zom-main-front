import { createSlice } from '@reduxjs/toolkit';
import { getDeliveryInfo } from '../utils/deliveryUtils';

const getCartFromStorage = () => {
    try { return JSON.parse(localStorage.getItem('zomitron_cart')) || []; } catch { return []; }
};

const saveCartToStorage = (items) => {
    localStorage.setItem('zomitron_cart', JSON.stringify(items));
};

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: getCartFromStorage(),
        couponCode: null,
        discount: 0,
    },
    reducers: {
        addToCart: (state, action) => {
            const { product, qty = 1 } = action.payload;
            const existing = state.items.find((i) => i._id === product._id);
            if (existing) {
                existing.qty = Math.min(existing.qty + qty, product.stock);
            } else {
                state.items.push({ ...product, qty });
            }
            saveCartToStorage(state.items);
        },
        removeFromCart: (state, action) => {
            state.items = state.items.filter((i) => i._id !== action.payload);
            saveCartToStorage(state.items);
        },
        updateQty: (state, action) => {
            const { id, qty } = action.payload;
            const item = state.items.find((i) => i._id === id);
            if (item) {
                item.qty = qty;
                if (qty <= 0) state.items = state.items.filter((i) => i._id !== id);
            }
            saveCartToStorage(state.items);
        },
        clearCart: (state) => {
            state.items = [];
            state.couponCode = null;
            state.discount = 0;
            localStorage.removeItem('zomitron_cart');
        },
        applyCoupon: (state, action) => {
            state.couponCode = action.payload.code;
            state.discount = action.payload.discount;
        },
        removeCoupon: (state) => {
            state.couponCode = null;
            state.discount = 0;
        },
    },
});

export const { addToCart, removeFromCart, updateQty, clearCart, applyCoupon, removeCoupon } = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.items.reduce((sum, i) => sum + i.qty, 0);
export const selectCartSubtotal = (state) =>
    state.cart.items.reduce((sum, i) => sum + (i.effectivePrice || i.price) * i.qty, 0);
export const selectCartDiscount = (state) => state.cart.discount;
export const selectCartTotal = (state) => {
    const subtotal = selectCartSubtotal(state);
    return Math.max(0, subtotal - state.cart.discount);
};
export const selectCouponCode = (state) => state.cart.couponCode;

export default cartSlice.reducer;
