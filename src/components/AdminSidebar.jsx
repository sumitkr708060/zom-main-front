import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import {
    ChartBarIcon, UsersIcon, ShoppingBagIcon, ClipboardDocumentListIcon,
    TagIcon, BanknotesIcon, HomeIcon, ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', Icon: ChartBarIcon },
    { label: 'Vendors', href: '/admin/vendors', Icon: UsersIcon },
    { label: 'Orders', href: '/admin/orders', Icon: ClipboardDocumentListIcon },
    { label: 'Products', href: '/admin/products', Icon: ShoppingBagIcon },
    { label: 'Categories', href: '/admin/categories', Icon: TagIcon },
    { label: 'Users', href: '/admin/users', Icon: UsersIcon },
    { label: 'Delivery Radius', href: '/admin/delivery', Icon: HomeIcon },
    { label: 'Payouts', href: '/admin/payouts', Icon: BanknotesIcon },
];

export default function AdminSidebar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-secondary text-white flex flex-col z-40 hidden md:flex">
            <div className="p-6 border-b border-gray-700">
                <NavLink to="/shop" className="flex items-center gap-2">
                    <img src="/logo.svg" alt="Zomitron" className="h-9 w-auto" />
                    <p className="font-black text-white">ZOMITRON</p>
                    <div>
                        <p className="text-xs text-gray-400">Admin Panel</p>
                    </div>
                </NavLink>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ label, href, Icon }) => (
                    <NavLink key={href} to={href} className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`
                    }>
                        <Icon className="w-5 h-5" /> {label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700 space-y-1">
                <NavLink to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                    <HomeIcon className="w-5 h-5" /> View Store
                </NavLink>
                <button onClick={() => { dispatch(logout()); navigate('/'); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all w-full">
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
                </button>
            </div>
        </aside>
    );
}
