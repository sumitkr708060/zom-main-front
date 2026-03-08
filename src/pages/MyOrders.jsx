import { Link } from 'react-router-dom';
import { useGetMyOrdersQuery } from '../store/api';
import { formatCurrency, formatDate } from '../utils/deliveryUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import DeliveryBadge from '../components/DeliveryBadge';
import { getDeliveryInfo } from '../utils/deliveryUtils';

const statusColors = {
    pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-blue',
    shipped: 'badge-blue', out_for_delivery: 'badge-orange', delivered: 'badge-green',
    cancelled: 'badge-red',
};

export default function MyOrders() {
    const { data, isLoading } = useGetMyOrdersQuery({});
    const orders = data?.orders || [];

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="page-container py-8 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

            {orders.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
                    <p className="text-gray-500 mb-6">When you place an order, it'll show up here.</p>
                    <Link to="/shop" className="btn btn-primary btn-lg">Start Shopping</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order._id} className="card p-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <p className="font-bold text-gray-900">Order #{order.orderNumber}</p>
                                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg text-gray-900">{formatCurrency(order.total)}</p>
                                    <span className={`badge ${statusColors[order.orderStatus] || 'badge-gray'} capitalize text-xs`}>
                                        {order.orderStatus?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Items preview */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
                                {order.items?.slice(0, 4).map((item) => (
                                    <img key={item._id} src={item.image} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt={item.title} />
                                ))}
                                {order.items?.length > 4 && (
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                                        +{order.items.length - 4}
                                    </div>
                                )}
                            </div>

                            <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm w-full text-center">
                                {order.orderStatus === 'delivered' ? 'View Order →' : 'Track Order →'}
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
