import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import {
    ChartBarIcon, ShoppingBagIcon, ClipboardDocumentListIcon,
    UserCircleIcon, BanknotesIcon, HomeIcon, ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navItems = [
    { label: 'Overview', href: '/vendor/dashboard', Icon: ChartBarIcon },
    { label: 'Products', href: '/vendor/products', Icon: ShoppingBagIcon },
    { label: 'Orders', href: '/vendor/orders', Icon: ClipboardDocumentListIcon },
    { label: 'Earnings', href: '/vendor/earnings', Icon: BanknotesIcon },
    { label: 'Store Profile', href: '/vendor/profile', Icon: UserCircleIcon },
];

export default function VendorSidebar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <NavLink to="/shop" className="flex items-center gap-2">
                    <img src="/logo.svg" alt="Zomitron" className="h-9 w-auto" />
                    <p className="font-black text-white">ZOMITRON</p>
                    <div>
                        <p className="text-xs text-gray-400">Vendor Dashboard</p>
                    </div>
                </NavLink>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ label, href, Icon }) => (
                    <NavLink key={href} to={href} className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`
                    }>
                        <Icon className="w-5 h-5" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom actions */}
            <div className="p-4 border-t border-gray-800 space-y-1">
                <NavLink to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                    <HomeIcon className="w-5 h-5" /> Back to Store
                </NavLink>
                <button onClick={() => { dispatch(logout()); navigate('/'); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all w-full">
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
                </button>
            </div>
        </aside>
    );
}
