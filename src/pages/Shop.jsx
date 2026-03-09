import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { selectLocation, selectRadius } from '../store/locationSlice';
import { useGetProductsQuery, useGetCategoriesQuery } from '../store/api';
import ProductCard from '../components/ProductCard';
import { SkeletonGrid } from '../components/SkeletonCard';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories';
import { loadRadiusSettings } from '../utils/radiusSettings';

const SORT_OPTIONS = [
    { value: 'nearest', label: '📍 Nearest First' },
    { value: 'price_asc', label: '💰 Price: Low to High' },
    { value: 'price_desc', label: '💰 Price: High to Low' },
    { value: 'newest', label: '🆕 Newest First' },
    { value: 'rating', label: '⭐ Best Rated' },
    { value: 'popular', label: '🔥 Most Popular' },
];

export default function Shop() {
    const navigate = useNavigate();
    const { category: categoryParam } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useSelector(selectLocation);
    const radius = useSelector(selectRadius);
    const [filterOpen, setFilterOpen] = useState(false);
    const [page, setPage] = useState(1);

    const [filters, setFilters] = useState({
        category: categoryParam || searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sort: searchParams.get('sort') || 'nearest',
        search: searchParams.get('search') || '',
        radius: (() => {
            const settings = loadRadiusSettings();
            const city = (location.city || '').toLowerCase();
            return settings.byCity[city] ?? settings.defaultRadius ?? radius;
        })(),
    });

    const queryParams = {
        lat: location.lat, lng: location.lng, radius: filters.radius,
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        page, limit: 20,
    };

    const { data, isLoading, isFetching } = useGetProductsQuery(queryParams);
    const { data: catData } = useGetCategoriesQuery();
    const categories = useMemo(() => {
        const source = (catData?.categories && catData.categories.length > 0)
            ? catData.categories
            : DEFAULT_CATEGORIES;
        return source.filter((c) => c?.isActive !== false);
    }, [catData]);

    const childMap = useMemo(() => {
        const map = {};
        categories.forEach((c) => {
            const parentId = c.parent?._id || c.parent;
            if (parentId) {
                map[parentId] = map[parentId] || [];
                map[parentId].push(c);
            }
        });
        return map;
    }, [categories]);

    const topLevelCategories = useMemo(() => {
        const seen = new Set();
        return categories
            .filter((c) => !c.parent) // root only
            .filter((c) => {
                const name = (c.name || '').trim();
                if (!name) return false;
                if (name.toLowerCase() === 'all') return false;      // drop duplicate All
                if (name.toLowerCase() === 'general') return false;  // drop General
                if (name.includes('>')) return false;                // drop breadcrumb-y names
                if (/^all\s*>/i.test(name)) return false;            // drop All > ...
                return true;
            })
            // Deduplicate by slug
            .filter((c) => {
                const slug = c.slug || c.name;
                if (seen.has(slug)) return false;
                seen.add(slug);
                return true;
            });
    }, [categories]);

    const products = data?.products || [];
    const totalPages = data?.pages || 1;
    const total = data?.total || 0;

    const heroSlides = [
        {
            title: 'Shop local. Fast delivery.',
            subtitle: location.city ? `Handpicked vendors in ${location.city}` : 'Pick what you need, we deliver quick.',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
        },
        {
            title: 'Weekend Electronics Fest',
            subtitle: 'Save on laptops, phones, and accessories from trusted vendors.',
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
        },
        {
            title: 'Groceries in minutes',
            subtitle: 'Fresh essentials delivered from stores near you.',
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        },
    ];

    const [slide, setSlide] = useState(0);
    const slideCount = heroSlides.length;

    const nextSlide = () => setSlide((s) => (s + 1) % slideCount);
    const prevSlide = () => setSlide((s) => (s - 1 + slideCount) % slideCount);

    // Basic touch swipe
    const touchData = useRef({ startX: 0, endX: 0 });
    const onTouchStart = (e) => { touchData.current.startX = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        touchData.current.endX = e.changedTouches[0].clientX;
        const delta = touchData.current.endX - touchData.current.startX;
        if (Math.abs(delta) > 40) {
            if (delta < 0) nextSlide(); else prevSlide();
        }
    };

    const miniBanners = [
        {
            title: 'Electronics Fest',
            subtitle: 'Up to 20% off on laptops and phones from verified vendors.',
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
            color: 'from-sky-500/90 to-blue-600/90',
        },
        {
            title: 'Groceries in minutes',
            subtitle: 'Fresh essentials delivered from stores near you.',
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
            color: 'from-emerald-500/90 to-green-600/90',
        },
    ];

    const selectedCategory = categories.find((cat) => cat.slug === filters.category);

    useEffect(() => { setPage(1); }, [filters]);
    useEffect(() => {
        const settings = loadRadiusSettings();
        const city = (location.city || '').toLowerCase();
        setFilters((prev) => ({
            ...prev,
            category: categoryParam || searchParams.get('category') || '',
            radius: settings.byCity[city] ?? settings.defaultRadius ?? radius,
        }));
    }, [categoryParam, location.city, radius, searchParams]);

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        const sp = new URLSearchParams(searchParams);
        if (key === 'category') {
            sp.delete('category');
            const query = sp.toString();
            navigate(
                {
                    pathname: value ? `/shop/${value}` : '/',
                    search: query ? `?${query}` : '',
                },
                { replace: true }
            );
            return;
        }

        if (value) sp.set(key, value);
        else sp.delete(key);
        setSearchParams(sp, { replace: true });
    };

    const hexToRgba = (hex, alpha) => {
        const safeHex = String(hex || '').replace('#', '');
        if (safeHex.length !== 6) return `rgba(59, 130, 246, ${alpha})`;
        const r = parseInt(safeHex.slice(0, 2), 16);
        const g = parseInt(safeHex.slice(2, 4), 16);
        const b = parseInt(safeHex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const FilterPanel = () => (
        <div className="space-y-6">
            {/* Categories */}
            <div>
                <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
                <div className="space-y-2">
                    <button onClick={() => updateFilter('category', '')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${!filters.category ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                        All Categories
                    </button>
                    {topLevelCategories.map((cat) => (
                        <button key={cat._id || cat.slug} onClick={() => updateFilter('category', cat.slug)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${filters.category === cat.slug ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                            <span>{cat.icon || '📦'}</span> {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price range */}
            <div>
                <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                <div className="flex gap-2">
                    <input type="number" placeholder="Min ₹" value={filters.minPrice}
                        onChange={(e) => updateFilter('minPrice', e.target.value)}
                        className="input text-sm py-2 px-3" />
                    <input type="number" placeholder="Max ₹" value={filters.maxPrice}
                        onChange={(e) => updateFilter('maxPrice', e.target.value)}
                        className="input text-sm py-2 px-3" />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                    {[[0, 500], [500, 2000], [2000, 10000], [10000, 50000]].map(([min, max]) => (
                        <button key={min} onClick={() => { updateFilter('minPrice', min); updateFilter('maxPrice', max); }}
                            className="text-xs px-3 py-1.5 border border-gray-200 rounded-full hover:border-primary hover:text-primary transition-colors">
                            ₹{min.toLocaleString()} – ₹{max.toLocaleString()}
                        </button>
                    ))}
                </div>
            </div>

            {/* (Radius slider hidden as requested) */}
        </div>
    );

    return (
        <div className="page-container py-6">
            {/* Banner */}
            <div
                className="relative overflow-hidden mb-8 rounded-3xl bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 text-white"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div className="p-5 sm:p-10 grid gap-6 sm:grid-cols-[1.1fr_0.9fr] items-center">
                    <div className="transition-all duration-300" key={heroSlides[slide].title + '-text'}>
                        <p className="text-sm uppercase tracking-widest opacity-80">Featured</p>
                        <h2 className="text-3xl sm:text-4xl font-black leading-tight mt-2">{heroSlides[slide].title}</h2>
                        <p className="mt-3 text-white/80 text-sm sm:text-base">{heroSlides[slide].subtitle}</p>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setFilters((f) => ({ ...f, sort: 'nearest' }))}
                                className="btn btn-primary bg-white text-orange-600 border-white hover:bg-orange-50">
                                Shop now
                            </button>
                            <button onClick={() => setFilterOpen(true)} className="btn btn-secondary text-white border-white/30 hover:bg-white/10">
                                Filter by category
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/10 blur-3xl" />
                        <img
                            src={heroSlides[slide].image}
                            alt={heroSlides[slide].title}
                            className="relative w-full h-48 sm:h-64 lg:h-80 object-cover rounded-2xl shadow-2xl border border-white/20 transition-all duration-300"
                        />
                    </div>
                </div>

                {/* Slider controls */}
                <button
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 w-9 h-9 rounded-full shadow hover:bg-white"
                >
                    ‹
                </button>
                <button
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 w-9 h-9 rounded-full shadow hover:bg-white"
                >
                    ›
                </button>

                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {heroSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setSlide(i)}
                            className={`h-2.5 w-2.5 rounded-full transition-all ${i === slide ? 'bg-white' : 'bg-white/50'}`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Secondary banners */}
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
                {miniBanners.map((b, idx) => (
                    <div key={idx} className={`relative overflow-hidden rounded-2xl text-white bg-gradient-to-r ${b.color}`}>
                        <div className="p-4 sm:p-5 grid gap-3 grid-cols-[1.1fr_0.9fr] items-center">
                            <div>
                                <p className="text-xs uppercase tracking-widest opacity-80">Featured</p>
                                <h3 className="text-lg sm:text-xl font-bold">{b.title}</h3>
                                <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">{b.subtitle}</p>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/10 blur-2xl" />
                                <img
                                    src={b.image}
                                    alt={b.title}
                                    className="relative w-full h-28 sm:h-32 object-cover rounded-xl border border-white/20 shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {selectedCategory?.name || 'All Products'}
                    </h1>
                    <p className="text-gray-500 text-sm">{total} products near {location.city || 'you'}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Sort */}
                    <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
                        className="input text-sm py-2 pl-3 pr-8 w-auto cursor-pointer hidden sm:block">
                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {/* Filter toggle */}
                    <button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 btn btn-secondary text-sm">
                        <FunnelIcon className="w-4 h-4" /> Filters
                    </button>
                </div>
            </div>

            {/* Category tabs */}
            <div className="mb-6">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                    <button
                        onClick={() => updateFilter('category', '')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${
                            !filters.category ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
                        }`}
                    >
                        <span>✨</span>
                        <span>All</span>
                    </button>
                    {topLevelCategories.map((cat) => {
                        const isActive = filters.category === cat.slug;
                        const color = cat.themeColor || '#3b82f6';
                        const children = childMap[cat._id] || [];
                        const hasChildren = children.length > 0;
                        return (
                            <div key={cat._id || cat.slug} className="relative group">
                                <button
                                    onClick={() => updateFilter('category', cat.slug)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all"
                                    style={{
                                        color: isActive ? '#ffffff' : color,
                                        borderColor: isActive ? color : hexToRgba(color, 0.35),
                                        background: isActive
                                            ? `linear-gradient(135deg, ${color}, ${hexToRgba(color, 0.85)})`
                                            : `linear-gradient(135deg, ${hexToRgba(color, 0.09)}, ${hexToRgba(color, 0.18)})`,
                                    }}
                                >
                                    <span>{cat.icon || '📦'}</span>
                                    <span>{cat.name}</span>
                                    {hasChildren && <span className="text-xs opacity-70">▾</span>}
                                </button>
                                {hasChildren && (
                                    <div className="absolute left-0 mt-2 z-30 min-w-[220px] rounded-2xl border border-gray-200 bg-white shadow-xl p-3 space-y-2 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all">
                                        {children.map((sub) => (
                                            <button
                                                key={sub._id || sub.slug}
                                                onClick={() => updateFilter('category', sub.slug)}
                                                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                                            >
                                                <span>{sub.icon || '•'}</span>
                                                <span>{sub.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-6">
                {/* Sidebar filters (desktop) */}
                <aside className="w-64 flex-shrink-0 hidden lg:block">
                    <div className="card p-5 sticky top-20"><FilterPanel /></div>
                </aside>

                {/* Product grid */}
                <div className="flex-1 min-w-0">
                    {isLoading || isFetching ? (
                        <SkeletonGrid count={12} />
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🔍</div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No products found</h2>
                            <p className="text-gray-500 mb-2">Try a different category or adjust price filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.map((product) => (
                                    <ProductCard key={product._id} product={product}
                                        distanceKm={product.distanceKm !== undefined ? product.distanceKm : (product.distance ? product.distance / 1000 : undefined)} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8">
                                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm">← Prev</button>
                                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm">Next →</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Mobile filter drawer */}
            <AnimatePresence>
                {filterOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setFilterOpen(false)} />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed left-0 top-0 h-screen w-72 bg-white z-50 p-6 overflow-y-auto lg:hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg">Filters</h3>
                                <button onClick={() => setFilterOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <FilterPanel />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
