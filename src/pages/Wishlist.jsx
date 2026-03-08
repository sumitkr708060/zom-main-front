import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../store/authSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
    const user = useSelector(selectCurrentUser);
    const wishlistIds = user?.wishlist || [];
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!wishlistIds.length) {
                setItems([]);
                setLoading(false);
                return;
            }
            try {
                const results = await Promise.all(
                    wishlistIds.map(async (id) => {
                        const res = await fetch(`/api/products/${id}`);
                        const data = await res.json();
                        return data?.product;
                    })
                );
                setItems(results.filter(Boolean));
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [wishlistIds]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                <Link to="/shop" className="text-sm text-primary font-medium">Continue Shopping →</Link>
            </div>

            {items.length === 0 ? (
                <div className="card p-8 text-center">
                    <p className="text-lg font-semibold text-gray-800 mb-2">No items saved yet</p>
                    <p className="text-gray-500 mb-4">Tap the heart on products to save them for later.</p>
                    <Link to="/shop" className="btn btn-primary btn-sm">Browse products</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
