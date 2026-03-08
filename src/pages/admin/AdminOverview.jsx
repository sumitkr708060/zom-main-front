import { useGetAdminDashboardQuery } from '../../store/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/deliveryUtils';

const Stat = ({ label, value, icon, color }) => (
    <div className={`card p-5 border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
            </div>
            <span className="text-3xl">{icon}</span>
        </div>
    </div>
);

export default function AdminOverview() {
    const { data, isLoading } = useGetAdminDashboardQuery({});
    if (isLoading) return <LoadingSpinner />;
    const stats = data?.stats || data?.data || {};

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Stat label="Total Revenue" value={formatCurrency(stats.revenue || 0)} icon="💰" color="border-green-500" />
                <Stat label="Total Orders" value={stats.totalOrders || 0} icon="📦" color="border-blue-500" />
                <Stat label="Active Vendors" value={stats.totalVendors || 0} icon="🏪" color="border-orange-500" />
                <Stat label="Total Users" value={stats.totalUsers || 0} icon="👥" color="border-purple-500" />
            </div>

            {/* Recent orders */}
            {data?.recentOrders?.length > 0 && (
                <div className="card p-5">
                    <h2 className="font-bold text-gray-900 mb-4">Recent Orders</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-gray-500 border-b border-gray-100">
                                <th className="pb-2">Order #</th><th className="pb-2">Customer</th>
                                <th className="pb-2">Amount</th><th className="pb-2">Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.recentOrders.map((o) => (
                                    <tr key={o._id} className="hover:bg-gray-50">
                                        <td className="py-2 font-medium">#{o.orderNumber}</td>
                                        <td className="py-2">{o.customerId?.name || 'Guest'}</td>
                                        <td className="py-2 font-bold">{formatCurrency(o.total)}</td>
                                        <td className="py-2"><span className="badge badge-blue capitalize">{o.orderStatus}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
