import { useState } from 'react';
import { useGetVendorOrdersQuery, useFulfillOrderMutation } from '../../store/api';
import { formatCurrency, formatDate } from '../../utils/deliveryUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const statusChipClass = (status) => {
    if (status === 'delivered') return 'bg-green-100 text-green-700';
    if (status === 'cancelled') return 'bg-red-100 text-red-700';
    if (status === 'shipped' || status === 'out_for_delivery') return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-100 text-orange-700';
};

export default function VendorOrders() {
    const [page, setPage] = useState(1);
    const { data, isLoading, refetch } = useGetVendorOrdersQuery({ page });
    const [fulfillOrder, { isLoading: fulfilling }] = useFulfillOrderMutation();
    const orders = data?.orders || [];

    const handleFulfill = async (orderId, status) => {
        try {
            await fulfillOrder({ orderId, status }).unwrap();
            toast.success('Order updated!');
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to update order');
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders ({data?.total || 0})</h1>
            {orders.length === 0 ? (
                <div className="text-center py-16 card">
                    <div className="text-5xl mb-4">📋</div>
                    <h2 className="text-xl font-bold mb-2">No orders yet</h2>
                    <p className="text-gray-500">Orders will appear here when customers buy from you.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((o) => (
                        <div key={o._id} className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-bold text-gray-900">#{o.orderNumber}</p>
                                    <p className="text-sm text-gray-500">{formatDate(o.createdAt)} · {o.customerId?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-gray-900">{formatCurrency(o.vendorSubtotal || 0)}</p>
                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusChipClass(o.vendorStatus || o.orderStatus)}`}>
                                        {(o.vendorStatus || o.orderStatus || 'pending').replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                                {o.items?.slice(0, 3).map((item) => (
                                    <div key={item._id} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                        <img src={item.image} className="w-8 h-8 rounded-lg object-cover" alt={item.title} />
                                        <span className="text-xs text-gray-700 whitespace-nowrap">{item.title?.slice(0, 20)}… × {item.qty}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Delivery address */}
                            <p className="text-xs text-gray-500 mb-3">
                                📦 {o.deliveryAddress?.line1}, {o.deliveryAddress?.city}
                            </p>

                            {/* Action buttons */}
                            <div className="flex gap-3 flex-wrap items-center">
                                <label className="text-xs text-gray-500">Update status</label>
                                <select
                                    value={o.vendorStatus || o.orderStatus || 'pending'}
                                    onChange={(e) => handleFulfill(o._id, e.target.value)}
                                    disabled={fulfilling}
                                    className="text-xs rounded-xl border border-gray-200 px-3 py-2 focus:border-primary outline-none capitalize cursor-pointer"
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
