import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ShoppingBagIcon, ShoppingCartIcon, UserIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, ShoppingBagIcon as ShoppingBagIconSolid, ShoppingCartIcon as ShoppingCartIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';
import { useSelector } from 'react-redux';
import { selectCartCount } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';

const navItems = [
    { label: 'Home', href: '/', Icon: HomeIcon, ActiveIcon: HomeIconSolid },
    { label: 'Shop', href: '/shop', Icon: ShoppingBagIcon, ActiveIcon: ShoppingBagIconSolid },
    { label: 'Cart', href: '/cart', Icon: ShoppingCartIcon, ActiveIcon: ShoppingCartIconSolid, showBadge: true },
    { label: 'Account', href: '/profile', Icon: UserIcon, ActiveIcon: UserIconSolid, authHref: '/login' },
];

export default function BottomNav() {
    const location = useLocation();
    const cartCount = useSelector(selectCartCount);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    return (
        <nav className="bottom-nav safe-area-bottom">
            <div className="flex items-stretch h-16">
                {navItems.map(({ label, href, Icon, ActiveIcon, showBadge, authHref }) => {
                    const to = (!isAuthenticated && authHref) ? authHref : href;
                    const isActive = location.pathname === href;
                    return (
                        <Link key={href} to={to} className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                            <div className="relative">
                                {isActive ? <ActiveIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                {showBadge && cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{label}</span>
                            {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
