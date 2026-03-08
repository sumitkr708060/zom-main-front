import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ShoppingCartIcon, HeartIcon, StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon, StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { addToCart } from '../store/cartSlice';
import { formatCurrency, getDeliveryInfo } from '../utils/deliveryUtils';
import DeliveryBadge from './DeliveryBadge';
import toast from 'react-hot-toast';
import { useToggleWishlistMutation } from '../store/api';
import { selectCurrentUser, selectIsAuthenticated, updateUser } from '../store/authSlice';

export default function ProductCard({ product, distanceKm }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const [toggleWishlist] = useToggleWishlistMutation();
    const effectivePrice = product.effectivePrice || product.discountPrice || product.price;
    const discountPercent = product.discountPercent ||
        (product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0);

    const deliveryInfo = product.deliveryInfo || (distanceKm !== undefined ? getDeliveryInfo(distanceKm) : null);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock <= 0) return toast.error('Out of stock');
        dispatch(addToCart({ product: { ...product, effectivePrice }, qty: 1 }));
        toast.success('Added to cart! 🛒', { duration: 2000 });
    };

    const wishlisted = user?.wishlist?.includes(product._id);
    const handleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error('Login to save items to your wishlist');
            navigate('/login');
            return;
        }
        try {
            const res = await toggleWishlist(product._id).unwrap();
            const inWishlist = res?.inWishlist;
            const next = inWishlist
                ? [...(user?.wishlist || []), product._id]
                : (user?.wishlist || []).filter((id) => id !== product._id);
            dispatch(updateUser({ wishlist: next }));
            toast.success(inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
        } catch {
            toast.error('Could not update wishlist');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -2 }}
        >
            <Link to={`/product/${product._id}`} className="product-card block">
                {/* Image */}
                <div className="relative overflow-hidden bg-gray-50 aspect-square">
                    <img
                        src={product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
                        alt={product.title}
                        className="product-card-img"
                        loading="lazy"
                    />
                    {/* Discount badge */}
                    {discountPercent > 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {discountPercent}% OFF
                        </div>
                    )}
                    {/* Featured badge */}
                    {product.isFeatured && (
                        <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">⚡ Hot</div>
                    )}
                    <button
                        onClick={handleWishlist}
                        className="absolute bottom-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm border border-gray-100"
                        aria-label="Toggle wishlist"
                    >
                        {wishlisted ? (
                            <HeartIcon className="w-5 h-5 text-red-500" />
                        ) : (
                            <HeartOutlineIcon className="w-5 h-5 text-gray-500" />
                        )}
                    </button>
                    {/* Out of stock overlay */}
                    {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Out of Stock</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-3">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 leading-snug">{product.title}</h3>

                    {/* Rating */}
                    {product.ratings?.count > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <StarIcon key={s} className={`w-3 h-3 ${s <= Math.round(product.ratings.average) ? 'text-yellow-400' : 'text-gray-200'}`} />
                                ))}
                            </div>
                            <span className="text-xs text-gray-500">({product.ratings.count})</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-price text-base">{formatCurrency(effectivePrice)}</span>
                        {discountPercent > 0 && (
                            <span className="text-price-old">{formatCurrency(product.price)}</span>
                        )}
                    </div>

                    {/* Delivery badge + distance */}
                    <div className="flex items-center justify-between">
                        {deliveryInfo ? (
                            <DeliveryBadge info={deliveryInfo} />
                        ) : (
                            <span className="text-xs text-gray-400">{product.city}</span>
                        )}
                    </div>

                    {/* Add to cart */}
                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                        className="w-full mt-3 btn btn-sm btn-primary gap-1.5 text-xs"
                    >
                        <ShoppingCartIcon className="w-4 h-4" />
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </Link>
        </motion.div>
    );
}
