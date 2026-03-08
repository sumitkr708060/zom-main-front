import { useGetMyVendorQuery, useGetVendorEarningsQuery } from '../../store/api';
import { formatCurrency } from '../../utils/deliveryUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { useToggleVendorOpenMutation } from '../../store/api';
import { PowerIcon } from '@heroicons/react/24/solid';

const Stat = ({ label, value, icon }) => (
    <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{icon}</span>
        </div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
);

export default function VendorOverview() {
    const { data: vendorData, isLoading } = useGetMyVendorQuery();
    const { data: earningsData } = useGetVendorEarningsQuery({});
    const [toggleVendorOpen, { isLoading: toggling }] = useToggleVendorOpenMutation();
    const vendor = vendorData?.vendor;
    const earnings = earningsData?.data;

    if (isLoading) return <LoadingSpinner />;
    if (!vendor) return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold mb-4">No vendor profile found</h2>
            <Link to="/vendor/register" className="btn btn-primary">Register as Vendor</Link>
        </div>
    );

    return (
        <div>
            {/* Approval banner */}
            {!vendor.approved && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                    <p className="font-semibold text-yellow-800">⏳ Your vendor application is under review</p>
                    <p className="text-yellow-600 text-sm mt-1">You'll be notified once approved. Usually takes 24-48 hours.</p>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{vendor.storeName}</h1>
                    <p className="text-gray-500 text-sm">{vendor.city}, {vendor.state}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toggleVendorOpen({ isOpen: !vendor.isOpen })}
                        disabled={toggling}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shadow-sm border ${
                            vendor.isOpen ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                    >
                        <PowerIcon className="w-4 h-4" />
                        {vendor.isOpen ? 'Store On' : 'Store Off'}
                    </button>
                    {vendor.approved && <span className="badge badge-green">✅ Approved</span>}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Stat label="Total Earnings" value={formatCurrency(vendor.totalEarnings || 0)} icon="💰" />
                <Stat label="Available Balance" value={formatCurrency(vendor.balance || 0)} icon="🏦" />
                <Stat label="Total Products" value={vendor.totalProducts || 0} icon="📦" />
                <Stat label="This Month" value={formatCurrency(earnings?.thisMonth || 0)} icon="📈" />
            </div>

            {/* Recent orders */}
            {earnings?.recentOrders?.length > 0 && (
                <div className="card p-5">
                    <h2 className="font-bold text-gray-900 mb-4">Recent Orders</h2>
                    <div className="space-y-2">
                        {earnings.recentOrders.map((o) => (
                            <div key={o._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm">
                                <span className="font-medium">#{o.orderNumber}</span>
                                <span className="font-bold">{formatCurrency(o.vendorSubtotal || o.total)}</span>
                                <span className="badge badge-blue capitalize">{o.orderStatus}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
