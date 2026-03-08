import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetOrderQuery } from '../store/api';
import { formatCurrency } from '../utils/deliveryUtils';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrderSuccess() {
    const { id } = useParams();
    const { data, isLoading } = useGetOrderQuery(id);
    const order = data?.order;

    if (isLoading) return <LoadingSpinner fullscreen />;

    return (
        <div className="page-container py-16 flex flex-col items-center text-center max-w-lg mx-auto">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 text-5xl"
            >✅</motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Order Placed! 🎉</h1>
                <p className="text-gray-500 mb-1">Your order has been confirmed</p>
                {order && (
                    <p className="font-bold text-primary mb-6">Order #{order.orderNumber} · {formatCurrency(order.total)}</p>
                )}
                <div className="card p-5 text-left mb-8">
                    <h3 className="font-semibold mb-3 text-gray-900">What's next?</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>📧 Confirmation email sent to your inbox</li>
                        <li>📱 WhatsApp notification sent</li>
                        <li>🏪 Vendor has been notified to prepare your order</li>
                        <li>🚚 Delivery estimate shown in order tracking</li>
                    </ul>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                    <Link to={`/orders/${id}`} className="btn btn-primary btn-lg">Track Order</Link>
                    <Link to="/shop" className="btn btn-secondary btn-lg">Continue Shopping</Link>
                </div>
            </motion.div>
        </div>
    );
}
