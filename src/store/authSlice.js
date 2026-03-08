import { createSlice } from '@reduxjs/toolkit';

const getUserFromStorage = () => {
    try { return JSON.parse(localStorage.getItem('zomitron_user')); } catch { return null; }
};
const getTokenFromStorage = () => localStorage.getItem('zomitron_token') || null;

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: getUserFromStorage(),
        token: getTokenFromStorage(),
        isAuthenticated: !!getTokenFromStorage(),
        loading: false,
        error: null,
    },
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            state.error = null;
            localStorage.setItem('zomitron_token', token);
            localStorage.setItem('zomitron_user', JSON.stringify(user));
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('zomitron_user', JSON.stringify(state.user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('zomitron_token');
            localStorage.removeItem('zomitron_user');
        },
        setLoading: (state, action) => { state.loading = action.payload; },
        setError: (state, action) => { state.error = action.payload; },
    },
});

export const { setCredentials, updateUser, logout, setLoading, setError } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectUserRole = (state) => state.auth.user?.role;
export default authSlice.reducer;
