import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import locationReducer from './locationSlice';
import { api } from './api';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        location: locationReducer,
        [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
});

export default store;
