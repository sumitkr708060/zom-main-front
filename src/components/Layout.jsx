import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import VendorSidebar from './VendorSidebar';
import AdminSidebar from './AdminSidebar';
import BottomNav from './BottomNav';

export default function Layout({ variant }) {
    const location = useLocation();

    if (variant === 'vendor') {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <VendorSidebar />
                <div className="flex-1 flex flex-col ml-0 md:ml-64 transition-all">
                    {/* Mobile top bar */}
                    <div className="md:hidden sticky top-0 z-30">
                        <Navbar />
                    </div>
                    <main className="flex-1 p-4 md:p-8">
                        <Outlet />
                    </main>
                    <div className="md:hidden">
                        <BottomNav />
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'admin') {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <AdminSidebar />
                <div className="flex-1 ml-0 md:ml-64 transition-all">
                    <div className="p-4 md:p-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">
                <Outlet />
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
}
