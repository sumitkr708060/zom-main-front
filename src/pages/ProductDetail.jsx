import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ShoppingCartIcon, HeartIcon, StarIcon, MapPinIcon, TruckIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon, MinusIcon, PlusIcon, ShareIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useGetProductQuery, useGetProductReviewsQuery, useToggleWishlistMutation, useValidatePincodeQuery } from '../store/api';
import { addToCart } from '../store/cartSlice';
import { selectLocation } from '../store/locationSlice';
import DeliveryBadge from '../components/DeliveryBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, getDeliveryInfo, validatePincode } from '../utils/deliveryUtils';
import { haversineDistance } from '../utils/geoUtils';
import toast from 'react-hot-toast';
import { selectCurrentUser, selectIsAuthenticated, updateUser } from '../store/authSlice';

// Simple star rating display
const StarRating = ({ rating, count }) => (
    <div className="flex items-center gap-1.5">
        <div className="flex">
            {[1, 2, 3, 4, 5].map(s => (
                <StarIcon key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} />
            ))}
        </div>
        <span className="text-sm text-gray-600">{rating.toFixed(1)} ({count} reviews)</span>
    </div>
);

// Pincode checker widget
function PincodeChecker({ vendorLat, vendorLng }) {
    const [pincode, setPincode] = useState('');
    const [check, setCheck] = useState(null);
    const [loading, setLoading] = useState(false);

    const checkDelivery = async (e) => {
        e.preventDefault();
        if (!validatePincode(pincode)) return toast.error('Enter a valid 6-digit pincode');
        setLoading(true);
        try {
            const res = await fetch(`/api/pincode/${pincode}?vendorLat=${vendorLat}&vendorLng=${vendorLng}`);
            const data = await res.json();
            setCheck(data);
        } catch { toast.error('Could not validate pincode'); }
        finally { setLoading(false); }
    };

    return (
        <div className="border border-gray-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><TruckIcon className="w-5 h-5 text-primary" /> Check Delivery</h3>
            <form onSubmit={checkDelivery} className="flex gap-2">
                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/, '').slice(0, 6))}
                    placeholder="Enter 6-digit pincode" maxLength={6} className="input flex-1 text-sm py-2" />
                <button type="submit" disabled={loading} className="btn btn-primary px-4 text-sm">
                    {loading ? '...' : 'Check'}
                </button>
            </form>
            {check && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                    {check.deliveryAvailable === false ? (
                        <p className="text-red-600 text-sm flex items-center gap-2">❌ Delivery not available to this pincode (out of 100km range)</p>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-green-600 text-sm font-medium flex items-center gap-2">
                                <CheckIcon className="w-4 h-4" /> Delivery available to {check.city}
                            </p>
                            {check.deliveryInfo && (
                                <p className="text-gray-600 text-sm">{check.deliveryInfo.etaLabel} · ₹{check.deliveryInfo.deliveryCharge} delivery charge</p>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useSelector(selectLocation);
    const user = useSelector(selectCurrentUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const [selectedImage, setSelectedImage] = useState(0);
    const [qty, setQty] = useState(1);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [variationChoice, setVariationChoice] = useState({});

    const { data, isLoading } = useGetProductQuery(id);
    const { data: reviewData } = useGetProductReviewsQuery({ id, page: 1, limit: 5 });
    const [toggleWishlist] = useToggleWishlistMutation();
    const product = data?.product;
    const reviews = reviewData?.reviews || [];

    // Variation helpers
    const variationAttributes = useMemo(() => {
        const attrs = [];
        const seen = new Set();

        // Attributes explicitly marked for variation
        (product?.attributes || []).forEach((a) => {
            if (a.forVariation !== false && !seen.has(a.key)) {
                attrs.push(a);
                seen.add(a.key);
            }
        });

        // Fallback: infer attribute keys from variation definitions
        (product?.variations || []).forEach((v) => {
            (v.attributes || []).forEach((a) => {
                if (!seen.has(a.key)) {
                    attrs.push({ key: a.key, name: a.key, forVariation: true });
                    seen.add(a.key);
                }
            });
        });

        return attrs;
    }, [product?.attributes, product?.variations]);

    const attributeOptions = useMemo(() => {
        const map = {};

        // Collect options from variations
        (product?.variations || []).forEach((v) => {
            (v.attributes || []).forEach((attr) => {
                if (!map[attr.key]) map[attr.key] = new Set();
                map[attr.key].add(attr.value);
            });
        });

        // Also collect inline options defined on attributes (pipe- or comma-separated)
        (product?.attributes || []).forEach((attr) => {
            if (attr.value) {
                const parts = attr.value.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
                if (parts.length) {
                    if (!map[attr.key]) map[attr.key] = new Set();
                    parts.forEach((p) => map[attr.key].add(p));
                }
            }
        });

        return Object.fromEntries(Object.entries(map).map(([k, set]) => [k, Array.from(set)]));
    }, [product?.variations, product?.attributes]);

    useEffect(() => {
        if (product?.productType !== 'variable' || !product?.variations?.length) return;
        // Preselect first variation
        const firstVar = product.variations[0];
        setSelectedVariation(firstVar);
        const initialChoice = {};
        (firstVar.attributes || []).forEach((a) => { initialChoice[a.key] = a.value; });
        setVariationChoice(initialChoice);
        if (firstVar.image) setSelectedImage(-1); // flag to show variation image
    }, [product?.productType, product?.variations]);

    useEffect(() => {
        // If user clears selection, reset image to gallery first image
        if (!selectedVariation) setSelectedImage(0);
    }, [selectedVariation]);

    const wishlisted = user?.wishlist?.includes(product?._id);
    const handleWishlist = async () => {
        if (!product?._id) return;
        if (!isAuthenticated) {
            toast.error('Login to save products to wishlist');
            navigate('/login');
            return;
        }
        try {
            const res = await toggleWishlist(product._id).unwrap();
            const inWishlist = res?.inWishlist;
            const next = inWishlist
                ? [...(user?.wishlist || []), product._id]
                : (user?.wishlist || []).filter((pid) => pid !== product._id);
            dispatch(updateUser({ wishlist: next }));
            toast.success(inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
        } catch {
            toast.error('Could not update wishlist');
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (!product) {
        return (
            <div className="page-container py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Product not found</h2>
                <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
            </div>
        );
    }

    const basePrice = product.discountPrice || product.price;
    const variationPrice = selectedVariation ? (selectedVariation.discountPrice || selectedVariation.price) : null;
    const effectivePrice = variationPrice || basePrice;
    const listPrice = selectedVariation ? (selectedVariation.price || product.price) : product.price;
    const discountPercent = listPrice && effectivePrice && effectivePrice < listPrice
        ? Math.round(((listPrice - effectivePrice) / listPrice) * 100)
        : 0;

    let distanceKm = null;
    let deliveryInfo = null;
    if (product.location?.coordinates && location.lat) {
        const [vendorLng, vendorLat] = product.location.coordinates;
        distanceKm = haversineDistance(location.lat, location.lng, vendorLat, vendorLng);
        deliveryInfo = getDeliveryInfo(distanceKm);
    }

    const effectiveStock = selectedVariation ? (selectedVariation.stock ?? 0) : product.stock;

    const displayedImage = selectedVariation?.image && selectedImage === -1
        ? selectedVariation.image
        : product.images[selectedImage >= 0 ? selectedImage : 0];

    const handleVariationChange = (attrKey, value) => {
        const next = { ...variationChoice, [attrKey]: value };
        setVariationChoice(next);
        const match = product.variations.find((v) => {
            const attrs = v.attributes || [];
            if (attrs.length === 0) return false;
            return attrs.every((a) => next[a.key] === a.value) && Object.keys(next).length >= attrs.length;
        });
        setSelectedVariation(match || null);
        setSelectedImage(match?.image ? -1 : 0);
    };

    const handleAddToCart = () => {
        if (product.productType === 'variable' && !selectedVariation) {
            return toast.error('Select a variation');
        }
        if ((effectiveStock ?? 0) <= 0) return toast.error('Out of stock');
        const productPayload = {
            ...product,
            effectivePrice,
            selectedVariation,
        };
        dispatch(addToCart({ product: productPayload, qty }));
        toast.success(`${qty}× ${product.title}${selectedVariation ? ` (${selectedVariation.title})` : ''} added to cart! 🛒`);
    };

    return (
        <div className="page-container py-6">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
                <Link to="/" className="hover:text-primary">Home</Link> /
                <Link to="/shop" className="hover:text-primary">Shop</Link> /
                {product.categoryInfo && <Link to={`/shop/${product.categoryInfo.slug}`} className="hover:text-primary">{product.categoryInfo.name}</Link>}
                {product.categoryInfo && '/'} <span className="text-gray-700 line-clamp-1">{product.title}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Image gallery */}
                <div>
                    <div className="aspect-square rounded-3xl overflow-hidden bg-gray-50 mb-3 border border-gray-100 relative">
                        <motion.img
                            key={displayedImage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={displayedImage}
                            alt={product.title}
                            className="w-full h-full object-contain p-4 md:p-6"
                        />
                        <button
                            onClick={handleWishlist}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50"
                            aria-label="Toggle wishlist"
                        >
                            {wishlisted ? (
                                <HeartIcon className="w-6 h-6 text-red-500" />
                            ) : (
                                <HeartOutlineIcon className="w-6 h-6 text-gray-500" />
                            )}
                        </button>
                    </div>
                    {product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {product.images.map((img, i) => (
                                <button key={i} onClick={() => setSelectedImage(i)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product info */}
                <div className="space-y-5">
                    {/* Title & vendor */}
                    <div>
                        {product.vendor && (
                            <Link to={`/vendor/${product.vendorId}`} className="flex items-center gap-2 mb-2 text-sm text-gray-500 hover:text-primary">
                                <img src={product.vendor.storeLogo || `https://ui-avatars.com/api/?name=${product.vendor.storeName}&background=f97316&color=fff`}
                                    className="w-6 h-6 rounded-full" alt={product.vendor.storeName} />
                                {product.vendor.storeName}
                                {distanceKm !== null && <span className="badge badge-gray ml-1">{distanceKm.toFixed(1)}km away</span>}
                            </Link>
                        )}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.title}</h1>
                    </div>

                    {/* Rating */}
                    {product.ratings?.count > 0 && <StarRating rating={product.ratings.average} count={product.ratings.count} />}

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-gray-900">{formatCurrency(effectivePrice)}</span>
                        {discountPercent > 0 && (
                            <>
                                <span className="text-lg text-gray-400 line-through">{formatCurrency(listPrice)}</span>
                                <span className="badge bg-green-100 text-green-700 text-sm font-bold">{discountPercent}% OFF</span>
                            </>
                        )}
                    </div>

                    {/* Variations */}
                    {product.productType === 'variable' && (product.variations?.length > 0) && (
                        <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                            <h4 className="font-semibold text-gray-900">Choose options</h4>
                            <div className="space-y-3">
                                {variationAttributes.map((attr) => (
                                    <div key={attr.key} className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800">{attr.key}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(attributeOptions[attr.key] || attr.value.split('|').map((s) => s.trim()).filter(Boolean)).map((opt) => (
                                                <button
                                                    type="button"
                                                    key={opt}
                                                    onClick={() => handleVariationChange(attr.key, opt)}
                                                    className={`px-3 py-2 rounded-xl border transition ${variationChoice[attr.key] === opt ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-gray-200 hover:border-primary/60'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedVariation ? (
                                <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-sm text-gray-700 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedVariation.title}</p>
                                        <p className="text-gray-600">{selectedVariation.attributes?.map((a) => `${a.key}: ${a.value}`).join(' · ')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCurrency(selectedVariation.discountPrice || selectedVariation.price)}</p>
                                        <p className="text-xs text-gray-500">Stock: {selectedVariation.stock ?? '—'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-red-500">Select options to view availability.</p>
                            )}
                        </div>
                    )}

                    {/* Delivery info */}
                    {deliveryInfo && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl">
                            <TruckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                                <DeliveryBadge info={deliveryInfo} size="md" />
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Delivery charge: {deliveryInfo.deliveryCharge === 0 ? 'FREE' : `₹${deliveryInfo.deliveryCharge}`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Stock */}
                    <div>
                        {effectiveStock > 10 ? (
                            <span className="badge badge-green">✅ In Stock ({effectiveStock} available)</span>
                        ) : effectiveStock > 0 ? (
                            <span className="badge badge-orange">⚠️ Only {effectiveStock} left!</span>
                        ) : (
                            <span className="badge badge-red">❌ Out of Stock</span>
                        )}
                    </div>

                    {/* Qty + Add to cart */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:bg-gray-50 transition-colors">
                                <MinusIcon className="w-4 h-4" />
                            </button>
                            <span className="px-5 font-semibold text-gray-900 min-w-[2.5rem] text-center">{qty}</span>
                            <button onClick={() => setQty(Math.min(effectiveStock || 1, qty + 1))} className="p-3 hover:bg-gray-50 transition-colors">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={handleAddToCart} disabled={(effectiveStock ?? 0) <= 0}
                            className="flex-1 btn btn-primary btn-lg gap-2">
                            <ShoppingCartIcon className="w-5 h-5" />
                            {(effectiveStock ?? 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>

                    {/* Pincode checker */}
                    {product.location?.coordinates && (
                        <PincodeChecker vendorLat={product.location.coordinates[1]} vendorLng={product.location.coordinates[0]} />
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                    </div>
                </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews ({reviewData?.total || 0})</h2>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="card p-5">
                                <div className="flex items-start gap-3">
                                    <img src={review.customerId?.avatar || `https://ui-avatars.com/api/?name=${review.customerId?.name}`}
                                        className="w-10 h-10 rounded-full" alt={review.customerId?.name} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm text-gray-900">{review.customerId?.name}</p>
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(s => <StarIcon key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`} />)}
                                            </div>
                                        </div>
                                        {review.isVerifiedPurchase && <span className="badge badge-green text-xs mb-1">✅ Verified Purchase</span>}
                                        <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                                        {review.images?.length > 0 && (
                                            <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
                                                {review.images.map((img, idx) => (
                                                    <img key={idx} src={img} alt="Review" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                                                ))}
                                            </div>
                                        )}
                                        {review.vendorReply && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded-xl text-sm">
                                                <p className="font-medium text-blue-800">Seller's reply:</p>
                                                <p className="text-blue-600">{review.vendorReply.comment}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
