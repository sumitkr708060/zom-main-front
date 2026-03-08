import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ['Product', 'Vendor', 'Order', 'Category', 'Review', 'Cart', 'User'],
    endpoints: (builder) => ({
        // Auth
        login: builder.mutation({ query: (data) => ({ url: '/auth/login', method: 'POST', body: data }) }),
        register: builder.mutation({ query: (data) => ({ url: '/auth/register', method: 'POST', body: data }) }),
        googleAuth: builder.mutation({ query: (data) => ({ url: '/auth/google', method: 'POST', body: data }) }),
        getMe: builder.query({ query: () => '/auth/me', providesTags: ['User'] }),
        updateProfile: builder.mutation({ query: (data) => ({ url: '/auth/update-profile', method: 'PUT', body: data }), invalidatesTags: ['User'] }),
        changePassword: builder.mutation({ query: (data) => ({ url: '/auth/change-password', method: 'POST', body: data }) }),

        // Products
        getProducts: builder.query({
            query: (params) => ({ url: '/products', params }),
            providesTags: ['Product'],
        }),
        getFeaturedProducts: builder.query({
            query: (params) => ({ url: '/products/featured', params }),
            providesTags: ['Product'],
        }),
        searchProducts: builder.query({ query: (params) => ({ url: '/products/search', params }) }),
        getProduct: builder.query({ query: (id) => `/products/${id}`, providesTags: (r, e, id) => [{ type: 'Product', id }] }),
        createProduct: builder.mutation({
            query: (data) => ({ url: '/products', method: 'POST', body: data }),
            invalidatesTags: ['Product'],
        }),
        bulkUpsertProducts: builder.mutation({
            query: ({ data, params }) => ({ url: '/products/bulk-upload', method: 'POST', body: data, params }),
            invalidatesTags: ['Product'],
        }),
        updateProduct: builder.mutation({
            query: ({ id, data, ...rest }) => ({ url: `/products/${id}`, method: 'PUT', body: data ?? rest }),
            invalidatesTags: ['Product'],
        }),
        deleteProduct: builder.mutation({
            query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Product'],
        }),
        toggleWishlist: builder.mutation({
            query: (id) => ({ url: `/products/${id}/wishlist`, method: 'POST' }),
            invalidatesTags: ['User'],
        }),

        // Vendors
        getVendors: builder.query({ query: (params) => ({ url: '/vendors', params }), providesTags: ['Vendor'] }),
        getVendor: builder.query({ query: (id) => `/vendors/${id}`, providesTags: (r, e, id) => [{ type: 'Vendor', id }] }),
        getMyVendor: builder.query({ query: () => '/vendors/me', providesTags: ['Vendor'] }),
        registerVendor: builder.mutation({ query: (data) => ({ url: '/vendors/register', method: 'POST', body: data }), invalidatesTags: ['Vendor'] }),
        updateVendor: builder.mutation({ query: (data) => ({ url: '/vendors/me', method: 'PUT', body: data }), invalidatesTags: ['Vendor'] }),
        getVendorProducts: builder.query({
            query: ({ id, ...params }) => ({ url: `/vendors/${id}/products`, params }),
            providesTags: ['Product'],
        }),
        getVendorOrders: builder.query({ query: (params) => ({ url: '/vendors/me/orders', params }), providesTags: ['Order'] }),
        toggleVendorOpen: builder.mutation({ query: (data) => ({ url: '/vendors/me/open', method: 'PUT', body: data }), invalidatesTags: ['Vendor', 'Product'] }),
        getVendorEarnings: builder.query({ query: (params) => ({ url: '/vendors/me/earnings', params }) }),
        fulfillOrder: builder.mutation({
            query: ({ orderId, ...data }) => ({ url: `/vendors/orders/${orderId}/fulfill`, method: 'PUT', body: data }),
            invalidatesTags: ['Order'],
        }),
        requestWithdrawal: builder.mutation({ query: (data) => ({ url: '/vendors/me/withdrawal', method: 'POST', body: data }) }),

        // Orders
        createOrder: builder.mutation({ query: (data) => ({ url: '/orders', method: 'POST', body: data }), invalidatesTags: ['Order'] }),
        getMyOrders: builder.query({ query: (params) => ({ url: '/orders/my', params }), providesTags: ['Order'] }),
        getOrder: builder.query({ query: (id) => `/orders/${id}`, providesTags: (r, e, id) => [{ type: 'Order', id }] }),
        getOrderTracking: builder.query({ query: (id) => `/orders/${id}/track` }),
        updateOrderStatus: builder.mutation({
            query: ({ id, ...data }) => ({ url: `/orders/${id}/status`, method: 'PUT', body: data }),
            invalidatesTags: ['Order'],
        }),
        cancelOrder: builder.mutation({
            query: ({ id, ...data }) => ({ url: `/orders/${id}/cancel`, method: 'POST', body: data }),
            invalidatesTags: ['Order'],
        }),

        // Payments
        getPaymentConfig: builder.query({ query: () => '/payments/config' }),
        createStripeIntent: builder.mutation({ query: (data) => ({ url: '/payments/stripe/intent', method: 'POST', body: data }) }),
        createRazorpayOrder: builder.mutation({ query: (data) => ({ url: '/payments/razorpay/order', method: 'POST', body: data }) }),
        verifyRazorpay: builder.mutation({ query: (data) => ({ url: '/payments/razorpay/verify', method: 'POST', body: data }) }),

        // Categories
        getCategories: builder.query({ query: () => '/categories', providesTags: ['Category'] }),
        getFlatCategories: builder.query({ query: () => '/categories/flat', providesTags: ['Category'] }),
        getCategoryBySlug: builder.query({ query: (slug) => `/categories/${slug}` }),
        createCategory: builder.mutation({ query: (data) => ({ url: '/categories', method: 'POST', body: data }), invalidatesTags: ['Category'] }),
        updateCategory: builder.mutation({ query: ({ id, ...data }) => ({ url: `/categories/${id}`, method: 'PUT', body: data }), invalidatesTags: ['Category'] }),
        deleteCategory: builder.mutation({ query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }), invalidatesTags: ['Category'] }),

        // Reviews
        getProductReviews: builder.query({ query: ({ id, ...params }) => ({ url: `/reviews/product/${id}`, params }), providesTags: ['Review'] }),
        createReview: builder.mutation({ query: (data) => ({ url: '/reviews', method: 'POST', body: data }), invalidatesTags: ['Review', 'Product'] }),

        // Pincode
        validatePincode: builder.query({ query: ({ code, ...params }) => ({ url: `/pincode/${code}`, params }) }),
        validateDelivery: builder.mutation({ query: (data) => ({ url: '/pincode/validate-delivery', method: 'POST', body: data }) }),

        // Coupons
        validateCoupon: builder.query({ query: ({ code, ...params }) => ({ url: `/coupons/validate/${code}`, params }) }),

        // Admin
        getAdminDashboard: builder.query({ query: (params) => ({ url: '/admin/dashboard', params }) }),
        getAdminVendors: builder.query({ query: (params) => ({ url: '/admin/vendors', params }), providesTags: ['Vendor'] }),
        getAdminVendor: builder.query({ query: (id) => `/admin/vendors/${id}`, providesTags: (r, e, id) => [{ type: 'Vendor', id }] }),
        approveVendor: builder.mutation({ query: ({ id, ...data }) => ({ url: `/admin/vendors/approve/${id}`, method: 'PUT', body: data }), invalidatesTags: ['Vendor'] }),
        adminUpdateVendor: builder.mutation({ query: ({ id, ...data }) => ({ url: `/admin/vendors/${id}`, method: 'PUT', body: data }), invalidatesTags: ['Vendor'] }),
        adminToggleVendorOpen: builder.mutation({ query: ({ id, ...data }) => ({ url: `/admin/vendors/${id}/open`, method: 'PUT', body: data }), invalidatesTags: ['Vendor'] }),
        getAdminOrders: builder.query({ query: (params) => ({ url: '/admin/orders', params }), providesTags: ['Order'] }),
        getAdminProducts: builder.query({ query: (params) => ({ url: '/admin/products', params }), providesTags: ['Product'] }),
        approveProduct: builder.mutation({ query: ({ id, ...data }) => ({ url: `/admin/products/${id}/approve`, method: 'PUT', body: data }), invalidatesTags: ['Product'] }),
        getAdminPayouts: builder.query({ query: () => '/admin/payouts' }),
        processPayout: builder.mutation({ query: ({ vendorId, ...data }) => ({ url: `/admin/payouts/${vendorId}`, method: 'POST', body: data }) }),
        getAdminUsers: builder.query({ query: (params) => ({ url: '/admin/users', params }) }),
        updateAdminUserStatus: builder.mutation({ query: ({ id, ...data }) => ({ url: `/admin/users/${id}/status`, method: 'PUT', body: data }) }),

        // Location
        detectLocation: builder.query({ query: () => '/notifications/detect-location' }),
    }),
});

export const {
    useLoginMutation, useRegisterMutation, useGoogleAuthMutation, useGetMeQuery, useUpdateProfileMutation, useChangePasswordMutation,
    useGetProductsQuery, useGetFeaturedProductsQuery, useSearchProductsQuery, useGetProductQuery, useCreateProductMutation,
    useBulkUpsertProductsMutation, useUpdateProductMutation, useDeleteProductMutation, useToggleWishlistMutation,
    useGetVendorsQuery, useGetVendorQuery, useGetMyVendorQuery, useRegisterVendorMutation, useUpdateVendorMutation,
    useGetVendorProductsQuery, useGetVendorOrdersQuery, useGetVendorEarningsQuery, useFulfillOrderMutation, useRequestWithdrawalMutation, useToggleVendorOpenMutation,
    useCreateOrderMutation, useGetMyOrdersQuery, useGetOrderQuery, useGetOrderTrackingQuery, useUpdateOrderStatusMutation, useCancelOrderMutation,
    useGetPaymentConfigQuery, useCreateStripeIntentMutation, useCreateRazorpayOrderMutation, useVerifyRazorpayMutation,
    useGetCategoriesQuery, useGetFlatCategoriesQuery, useGetCategoryBySlugQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
    useGetProductReviewsQuery, useCreateReviewMutation,
    useValidatePincodeQuery, useValidateDeliveryMutation,
    useValidateCouponQuery,
    useGetAdminDashboardQuery, useGetAdminVendorsQuery, useGetAdminVendorQuery, useApproveVendorMutation, useAdminUpdateVendorMutation, useAdminToggleVendorOpenMutation, useGetAdminOrdersQuery,
    useGetAdminProductsQuery, useApproveProductMutation, useGetAdminPayoutsQuery, useProcessPayoutMutation, useGetAdminUsersQuery, useUpdateAdminUserStatusMutation,
    useDetectLocationQuery,
} = api;
