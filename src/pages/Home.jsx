import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { ArrowRightIcon, MapPinIcon, BoltIcon } from '@heroicons/react/24/outline';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

import { selectLocation } from '../store/locationSlice';
import { useGetFeaturedProductsQuery, useGetCategoriesQuery } from '../store/api';
import ProductCard from '../components/ProductCard';
import { SkeletonGrid } from '../components/SkeletonCard';

const heroSlides = [
    { title: 'Shop Local, Delivered Fast', subtitle: 'Get products from vendors near you in as little as 1 hour', bg: 'from-orange-500 to-rose-600', emoji: '⚡', cta: 'Shop Now', href: '/shop' },
    { title: 'Fresh Electronics Near You', subtitle: 'Mobiles, laptops, and accessories from local stores', bg: 'from-blue-600 to-violet-600', emoji: '📱', cta: 'Browse Electronics', href: '/shop/electronics' },
    { title: 'Fashion For Every Style', subtitle: 'Discover trending clothes and accessories nearby', bg: 'from-pink-500 to-rose-500', emoji: '👗', cta: 'Explore Fashion', href: '/shop/fashion' },
];

const deliveryTimings = [
    { label: '⚡ 1 Hour', desc: 'Same city vendors', color: 'bg-green-50 border-green-200 text-green-700' },
];

export default function Home() {
    const location = useSelector(selectLocation);
    const { data: featuredData, isLoading: featuredLoading } = useGetFeaturedProductsQuery({
        lat: location.lat, lng: location.lng, limit: 10,
    });
    const { data: categoriesData } = useGetCategoriesQuery();
    const categories = categoriesData?.categories || [];
    const featuredProducts = featuredData?.products || [];

    return (
        <div>
            {/* Hero Slider */}
            <section>
                <Swiper
                    modules={[Autoplay, Pagination, EffectFade]}
                    effect="fade"
                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                    pagination={{ clickable: true }}
                    loop
                    className="h-64 sm:h-80 md:h-96"
                >
                    {heroSlides.map((slide, i) => (
                        <SwiperSlide key={i}>
                            <div className={`h-full bg-gradient-to-r ${slide.bg} flex items-center px-6 md:px-16`}>
                                <div className="max-w-lg">
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                        <div className="text-5xl md:text-6xl mb-4">{slide.emoji}</div>
                                        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">{slide.title}</h1>
                                        <p className="text-white/80 text-sm md:text-base mb-6">{slide.subtitle}</p>
                                        <Link to={slide.href} className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-2xl hover:bg-gray-100 transition-all shadow-lg">
                                            {slide.cta} <ArrowRightIcon className="w-4 h-4" />
                                        </Link>
                                    </motion.div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>

            {/* Delivery timings strip */}
            <section className="page-container py-6">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {deliveryTimings.map((t) => (
                        <div key={t.label} className={`flex-shrink-0 flex items-center gap-3 border rounded-2xl px-4 py-3 ${t.color}`}>
                            <div>
                                <p className="font-bold text-sm">{t.label}</p>
                                <p className="text-xs opacity-70">{t.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories carousel */}
            <section className="page-container pb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="section-title">Shop by Category</h2>
                    <Link to="/shop" className="text-primary text-sm font-medium hover:underline">View All →</Link>
                </div>
                <Swiper
                    slidesPerView="auto"
                    spaceBetween={12}
                    freeMode
                    grabCursor
                    className="!overflow-visible pb-2"
                >
                    {categories.map((cat) => (
                        <SwiperSlide key={cat._id} style={{ width: 'auto' }}>
                            <Link to={`/shop/${cat.slug}`} className="flex flex-col items-center gap-2 p-4 card-hover hover:border-primary/30 transition-all w-24">
                                <span className="text-3xl">{cat.icon || '🛒'}</span>
                                <span className="text-xs font-semibold text-center text-gray-700 leading-tight">{cat.name}</span>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>

            {/* Featured products */}
            {featuredProducts.length > 0 && (
                <section className="page-container pb-10">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="section-title text-xl sm:text-2xl">On Everybody&apos;s List</h2>
                        <Link to="/shop" className="text-primary text-sm font-medium hover:underline">Browse All →</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
                        {featuredProducts.slice(0, 10).map((product) => (
                            <div key={product._id} className="min-w-[220px] max-w-[240px] snap-start">
                                <ProductCard product={product} distanceKm={product.distance ? product.distance / 1000 : undefined} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured products grid */}
            <section className="page-container pb-12">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="section-title flex items-center gap-2">
                            <BoltIcon className="w-6 h-6 text-primary" /> Nearby Featured Products
                        </h2>
                        <p className="section-subtitle text-sm">Handpicked from vendors within {location.city || 'your area'}</p>
                    </div>
                    <Link to="/shop?featured=true" className="text-primary text-sm font-medium hover:underline hidden sm:block">See All →</Link>
                </div>

                {featuredLoading ? (
                    <SkeletonGrid count={8} />
                ) : featuredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">📍</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No products found nearby</h3>
                        <p className="text-gray-500 mb-6">Try changing your location or expanding the search radius.</p>
                        <Link to="/shop" className="btn btn-primary btn-lg">Browse All Products</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product._id} product={product} distanceKm={product.distance ? product.distance / 1000 : undefined} />
                        ))}
                    </div>
                )}
            </section>

            {/* Become a Vendor CTA */}
            <section className="page-container pb-12">
                <div className="rounded-3xl gradient-dark p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Sell on Zomitron 🏪</h2>
                        <p className="text-gray-400 mb-6">Join 1000+ vendors earning daily. Set up your store in minutes and reach thousands of local customers.</p>
                        <Link to="/vendor/register" className="btn btn-primary btn-lg">Start Selling Today →</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        {[['10%', 'Low Commission'], ['1hr', 'Fast Delivery'], ['∞', 'Products'], ['100%', 'Secure Payments']].map(([val, label]) => (
                            <div key={label} className="bg-white/10 rounded-2xl p-4">
                                <div className="text-2xl font-black text-white">{val}</div>
                                <div className="text-xs text-gray-400 mt-1">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
