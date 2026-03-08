import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon, ShoppingCartIcon, UserIcon, MapPinIcon,
    Bars3Icon, XMarkIcon, ChevronDownIcon, BellIcon, HeartIcon,
} from '@heroicons/react/24/outline';
import { selectIsAuthenticated, selectCurrentUser, logout } from '../store/authSlice';
import { selectCartCount } from '../store/cartSlice';
import { selectLocation } from '../store/locationSlice';
import { useLocationDetection } from '../hooks/useLocation';
import LocationPicker from './LocationPicker';
import toast from 'react-hot-toast';

export default function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectCurrentUser);
    const cartCount = useSelector(selectCartCount);
    const userLocation = useSelector(selectLocation);
    const { detectLocation } = useLocationDetection();

    const [search, setSearch] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
    };

    const handleLogout = () => {
        dispatch(logout());
        toast.success('Logged out successfully');
        navigate('/');
        setUserMenuOpen(false);
    };

    return (
        <>
            <header className="navbar">
                {/* Top strip */}
                <div className="border-b border-gray-100">
                    <div className="page-container flex items-center justify-between h-16 gap-3">
                        {/* Logo + brand */}
                        <Link to="/shop" className="flex items-center gap-2 flex-shrink-0">
                            <img src="/logo.svg" alt="Zomitron" className="h-10 w-auto" />
                            <span className="font-black text-xl text-gray-900 block sm:block">ZOMITRON</span>
                        </Link>

                        {/* Location pill */}
                        <button
                            onClick={() => setLocationPickerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-orange-50 transition-all text-sm max-w-[200px] flex-shrink-0 ml-2 sm:ml-4"
                        >
                            <MapPinIcon className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate text-gray-700 font-medium">{userLocation.city || 'Set Location'}</span>
                            <ChevronDownIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        </button>

                        {/* Search bar (desktop) */}
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products near you..."
                                    className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all"
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
                                    <MagnifyingGlassIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </form>

                        {/* Right actions */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Cart */}
                            <Link to="/cart" className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <ShoppingCartIcon className="w-6 h-6 text-gray-700" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User menu */}
                            {isAuthenticated ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=f97316&color=fff`}
                                            alt={user?.name} className="w-8 h-8 rounded-full object-cover" />
                                        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-56 card py-2 z-50"
                        >
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                <span className="badge badge-orange mt-1 capitalize">{user?.role}</span>
                            </div>
                            <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <UserIcon className="w-4 h-4" /> Profile
                            </Link>
                            <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                📦 My Orders
                            </Link>
                            <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                ❤️ Wishlist
                            </Link>
                            <Link to="/cart" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                🛒 Cart
                            </Link>
                            <Link to="/checkout" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                💳 Checkout
                            </Link>
                            {user?.role === 'vendor' && (
                                <Link to="/vendor/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    🏪 Vendor Dashboard
                                </Link>
                            )}
                            {user?.role === 'admin' && (
                                <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    👑 Admin Panel
                                </Link>
                            )}
                            {!['vendor', 'admin'].includes(user?.role) && (
                                <Link to="/vendor/register" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-medium hover:bg-orange-50 transition-colors">
                                    🏪 Become a Vendor
                                </Link>
                            )}
                            <div className="border-t border-gray-100 mt-1">
                                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                                    🚪 Logout
                                </button>
                            </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link to="/login" className="btn btn-sm btn-secondary hidden sm:inline-flex">Login</Link>
                                    <Link to="/register" className="btn btn-sm btn-primary">Register</Link>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Mobile search */}
                <div className="md:hidden border-b border-gray-100 bg-white px-4 pb-3">
                    <form onSubmit={handleSearch} className="relative">
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products near you..." className="input text-sm py-2.5 pr-12" />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg">
                            <MagnifyingGlassIcon className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden bg-white border-b border-gray-200"
                        >
                            <div className="page-container py-4 flex flex-col divide-y divide-gray-100">
                                {(() => {
                                    const items = [
                                        { label: 'Shop', to: '/shop' },
                                        { label: 'Cart', to: '/cart' },
                                        { label: 'Checkout', to: '/checkout' },
                                    ];
                                    if (isAuthenticated) {
                                        const common = [
                                            { label: 'My Orders', to: '/orders' },
                                            { label: 'Wishlist', to: '/wishlist' },
                                            { label: 'Profile', to: '/profile' },
                                            { label: 'Logout', action: handleLogout, danger: true },
                                        ];
                                        items.push(...common);
                                        if (user?.role === 'vendor') items.push({ label: 'Vendor Dashboard', to: '/vendor/dashboard' });
                                        if (user?.role === 'admin') items.push({ label: 'Admin Panel', to: '/admin/dashboard' });
                                    } else {
                                        items.push(
                                            { label: 'My Orders', to: '/login' },
                                            { label: 'Wishlist', to: '/login' },
                                            { label: 'Login', to: '/login' },
                                            { label: 'Register', to: '/register' },
                                        );
                                    }
                                    return items.map((item, idx) => item.action ? (
                                        <button
                                            key={`action-${idx}`}
                                            onClick={() => { item.action(); setMobileMenuOpen(false); }}
                                            className={`py-3 text-sm text-left px-1 ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-800 hover:bg-gray-50'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ) : (
                                        <Link
                                            key={item.to + idx}
                                            to={item.to}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="py-3 text-sm text-gray-800 hover:bg-gray-50 px-1"
                                        >
                                            {item.label}
                                        </Link>
                                    ));
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Location Picker Modal */}
            {locationPickerOpen && <LocationPicker onClose={() => setLocationPickerOpen(false)} />}
        </>
    );
}
