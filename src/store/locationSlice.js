import { createSlice } from '@reduxjs/toolkit';

const getLocationFromStorage = () => {
    try { return JSON.parse(sessionStorage.getItem('zomitron_location')); } catch { return null; }
};

const DEFAULT_LOCATION = { lat: 25.4358, lng: 81.8463, city: 'Prayagraj', state: 'Uttar Pradesh', pincode: '211001', source: 'default' };

const locationSlice = createSlice({
    name: 'location',
    initialState: {
        ...DEFAULT_LOCATION,
        ...(getLocationFromStorage() || {}),
        radius: 100, // km
        loading: false,
        error: null,
        detected: !!getLocationFromStorage(),
    },
    reducers: {
        setLocation: (state, action) => {
            Object.assign(state, action.payload, { detected: true, error: null });
            sessionStorage.setItem('zomitron_location', JSON.stringify(action.payload));
        },
        setRadius: (state, action) => { state.radius = action.payload; },
        setLocationLoading: (state, action) => { state.loading = action.payload; },
        setLocationError: (state, action) => { state.error = action.payload; },
        resetLocation: (state) => {
            Object.assign(state, DEFAULT_LOCATION, { detected: false });
            sessionStorage.removeItem('zomitron_location');
        },
    },
});

export const { setLocation, setRadius, setLocationLoading, setLocationError, resetLocation } = locationSlice.actions;
export const selectLocation = (state) => state.location;
export const selectRadius = (state) => state.location.radius;
export const selectCity = (state) => state.location.city;
export default locationSlice.reducer;
