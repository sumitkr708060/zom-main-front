import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from './store/authSlice';
import { useLocationDetection } from './hooks/useLocation';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const OTPVerify = lazy(() => import('./pages/OTPVerify'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Profile = lazy(() => import('./pages/Profile'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

// Vendor pages
const VendorRegister = lazy(() => import('./pages/vendor/VendorRegister'));
const VendorOverview = lazy(() => import('./pages/vendor/VendorOverview'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorProductForm = lazy(() => import('./pages/vendor/VendorProductForm'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'));
const VendorEarnings = lazy(() => import('./pages/vendor/VendorEarnings'));

// Admin pages
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminPayouts = lazy(() => import('./pages/admin/AdminPayouts'));
const AdminDeliverySettings = lazy(() => import('./pages/admin/AdminDeliverySettings'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminVendorDetail = lazy(() => import('./pages/admin/AdminVendorDetail'));

const NotFound = lazy(() => import('./pages/NotFound'));

// Protected route components
const ProtectedRoute = ({ children, roles }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectCurrentUser);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
    return children;
};

const GuestRoute = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export default function App() {
    // Initialize location detection on app load
    useLocationDetection();

    return (
        <Suspense fallback={<LoadingSpinner fullscreen />}>
            <Routes>
                {/* Public routes with main layout */}
                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/shop" replace />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/shop/:category" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/order/:id/track" element={<OrderTracking />} />

                    {/* Auth routes */}
                    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                    <Route path="/verify-otp" element={<OTPVerify />} />

                    {/* Customer protected */}
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                    <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                    <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

                    {/* Vendor register (authenticated user) */}
                    <Route path="/vendor/register" element={<ProtectedRoute><VendorRegister /></ProtectedRoute>} />
                </Route>

                {/* Vendor dashboard (sidebar layout) */}
                <Route path="/vendor/*" element={<ProtectedRoute roles={['vendor', 'admin']}><Layout variant="vendor" /></ProtectedRoute>}>
                    <Route path="dashboard" element={<VendorOverview />} />
                    <Route path="products" element={<VendorProducts />} />
                    <Route path="products/add" element={<VendorProductForm />} />
                    <Route path="products/edit/:id" element={<VendorProductForm />} />
                    <Route path="orders" element={<VendorOrders />} />
                    <Route path="profile" element={<VendorProfile />} />
                    <Route path="earnings" element={<VendorEarnings />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Admin panel */}
                <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><Layout variant="admin" /></ProtectedRoute>}>
                    <Route path="dashboard" element={<AdminOverview />} />
                    <Route path="vendors" element={<AdminVendors />} />
                    <Route path="vendors/:id" element={<AdminVendorDetail />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/add" element={<AdminProductForm />} />
                    <Route path="products/edit/:id" element={<AdminProductForm />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="delivery" element={<AdminDeliverySettings />} />
                    <Route path="payouts" element={<AdminPayouts />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
}
