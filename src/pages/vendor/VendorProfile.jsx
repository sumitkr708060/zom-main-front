import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    useChangePasswordMutation,
    useGetMyVendorQuery,
    useUpdateVendorMutation,
} from '../../store/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import GoogleMapPicker from '../../components/GoogleMapPicker';
import toast from 'react-hot-toast';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function VendorProfile() {
    const { data, isLoading, refetch } = useGetMyVendorQuery();
    const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();
    const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();
    const vendor = data?.vendor;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            storeName: '',
            storeDescription: '',
            phone: '',
            email: '',
            gstin: '',
            address: {
                line1: '',
                line2: '',
                city: '',
                state: '',
                pincode: '',
            },
            bankDetails: {
                accountName: '',
                accountNumber: '',
                ifscCode: '',
                bankName: '',
                upiId: '',
            },
        },
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        watch: watchPassword,
        formState: { errors: passwordErrors },
    } = useForm({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const [locationData, setLocationData] = useState(null);
    const [showMapSection, setShowMapSection] = useState(false);

    useEffect(() => {
        if (!vendor) return;
        reset({
            storeName: vendor.storeName || '',
            storeDescription: vendor.storeDescription || '',
            phone: vendor.phone || '',
            email: vendor.email || '',
            gstin: vendor.gstin || '',
            address: {
                line1: vendor.address?.line1 || '',
                line2: vendor.address?.line2 || '',
                city: vendor.address?.city || vendor.city || '',
                state: vendor.address?.state || vendor.state || '',
                pincode: vendor.address?.pincode || vendor.pincode || '',
            },
            bankDetails: {
                accountName: vendor.bankDetails?.accountName || '',
                accountNumber: vendor.bankDetails?.accountNumber || '',
                ifscCode: vendor.bankDetails?.ifscCode || vendor.bankDetails?.ifsc || '',
                bankName: vendor.bankDetails?.bankName || '',
                upiId: vendor.bankDetails?.upiId || '',
            },
        });
    }, [vendor, reset]);

    const initialLat = vendor?.location?.coordinates?.[1] || null;
    const initialLng = vendor?.location?.coordinates?.[0] || null;

    const onSubmit = async (formData) => {
        try {
            const nextAddress = {
                line1: (formData.address?.line1 || '').trim(),
                line2: (formData.address?.line2 || '').trim(),
                city: (formData.address?.city || '').trim(),
                state: (formData.address?.state || '').trim(),
                pincode: (formData.address?.pincode || '').trim(),
            };

            if (locationData?.address && !nextAddress.line1) nextAddress.line1 = locationData.address;
            if (locationData?.city) nextAddress.city = locationData.city;
            if (locationData?.state) nextAddress.state = locationData.state;
            if (locationData?.pincode) nextAddress.pincode = locationData.pincode;

            const payload = {
                storeName: formData.storeName,
                storeDescription: formData.storeDescription,
                phone: formData.phone,
                email: formData.email,
                gstin: formData.gstin,
                city: nextAddress.city,
                state: nextAddress.state,
                pincode: nextAddress.pincode,
                address: nextAddress,
                bankDetails: {
                    accountName: (formData.bankDetails?.accountName || '').trim(),
                    accountNumber: (formData.bankDetails?.accountNumber || '').trim(),
                    ifscCode: (formData.bankDetails?.ifscCode || '').trim(),
                    bankName: (formData.bankDetails?.bankName || '').trim(),
                    upiId: (formData.bankDetails?.upiId || '').trim(),
                },
            };

            if (locationData) {
                payload.lat = locationData.lat;
                payload.lng = locationData.lng;
                payload.location = {
                    type: 'Point',
                    coordinates: [locationData.lng, locationData.lat],
                };
            }

            await updateVendor(payload).unwrap();
            toast.success('Vendor profile updated');
            setLocationData(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Update failed');
        }
    };

    const onPasswordSubmit = async (formData) => {
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('New password and confirm password must match');
            return;
        }

        try {
            await changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            }).unwrap();
            toast.success('Password changed successfully');
            resetPasswordForm();
        } catch (err) {
            toast.error(err?.data?.message || 'Password update failed');
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Profile</h1>

            <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Account</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{vendor?.userId?.name || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{vendor?.userId?.email || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{vendor?.userId?.phone || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Registered</p>
                        <p className="font-medium text-gray-900">
                            {vendor?.userId?.createdAt
                                ? new Date(vendor.userId.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '-'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Details</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Store Name*</label>
                            <input {...register('storeName', { required: 'Store name is required' })} className="input" />
                            {errors.storeName && <p className="text-error text-xs mt-1">{errors.storeName.message}</p>}
                        </div>
                        <div>
                            <label className="label">Business Phone</label>
                            <input {...register('phone')} className="input" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Store Contact Email</label>
                            <input {...register('email')} className="input" />
                        </div>
                        <div>
                            <label className="label">GSTIN</label>
                            <input {...register('gstin')} className="input" />
                        </div>
                    </div>

                    <div>
                        <label className="label">Store Description</label>
                        <textarea {...register('storeDescription')} rows={3} className="input resize-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="label">Address Line 1*</label>
                            <input {...register('address.line1', { required: 'Address line 1 is required' })} className="input" />
                            {errors.address?.line1 && <p className="text-error text-xs mt-1">{errors.address.line1.message}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Address Line 2</label>
                            <input {...register('address.line2')} className="input" />
                        </div>
                        <div>
                            <label className="label">City*</label>
                            <input {...register('address.city', { required: 'City is required' })} className="input" />
                            {errors.address?.city && <p className="text-error text-xs mt-1">{errors.address.city.message}</p>}
                        </div>
                        <div>
                            <label className="label">State*</label>
                            <input {...register('address.state', { required: 'State is required' })} className="input" />
                            {errors.address?.state && <p className="text-error text-xs mt-1">{errors.address.state.message}</p>}
                        </div>
                        <div>
                            <label className="label">Pincode*</label>
                            <input
                                {...register('address.pincode', {
                                    required: 'Pincode is required',
                                    pattern: { value: /^\d{6}$/, message: 'Pincode must be 6 digits' },
                                })}
                                maxLength={6}
                                className="input"
                            />
                            {errors.address?.pincode && <p className="text-error text-xs mt-1">{errors.address.pincode.message}</p>}
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="label mb-0">Store Location on Map</label>
                                <p className="text-xs text-gray-500">Search or pin exact store location. This is used for delivery and distance checks.</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary flex items-center gap-1"
                                onClick={() => setShowMapSection((prev) => !prev)}
                            >
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showMapSection ? 'rotate-180' : ''}`} />
                                {showMapSection ? 'Hide Map' : 'Show Map'}
                            </button>
                        </div>

                        {showMapSection && (
                            <div className="mt-3">
                                <GoogleMapPicker
                                    initialLat={initialLat}
                                    initialLng={initialLng}
                                    onLocationSelect={setLocationData}
                                    height="260px"
                                    forceEmbed
                                />
                                {locationData && (
                                    <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                        New location selected. Save profile to apply this location.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Bank Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Account Name</label>
                                <input {...register('bankDetails.accountName')} className="input" />
                            </div>
                            <div>
                                <label className="label">Account Number</label>
                                <input {...register('bankDetails.accountNumber')} className="input" />
                            </div>
                            <div>
                                <label className="label">IFSC Code</label>
                                <input {...register('bankDetails.ifscCode')} className="input" />
                            </div>
                            <div>
                                <label className="label">Bank Name</label>
                                <input {...register('bankDetails.bankName')} className="input" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="label">UPI ID</label>
                                <input {...register('bankDetails.upiId')} className="input" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={updating} className="w-full btn btn-primary">
                        {updating ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>

            <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                        <label className="label">Current Password*</label>
                        <input
                            type="password"
                            {...registerPassword('currentPassword', { required: 'Current password is required' })}
                            className="input"
                        />
                        {passwordErrors.currentPassword && <p className="text-error text-xs mt-1">{passwordErrors.currentPassword.message}</p>}
                    </div>

                    <div>
                        <label className="label">New Password*</label>
                        <input
                            type="password"
                            {...registerPassword('newPassword', {
                                required: 'New password is required',
                                minLength: { value: 6, message: 'Minimum 6 characters' },
                            })}
                            className="input"
                        />
                        {passwordErrors.newPassword && <p className="text-error text-xs mt-1">{passwordErrors.newPassword.message}</p>}
                    </div>

                    <div>
                        <label className="label">Confirm New Password*</label>
                        <input
                            type="password"
                            {...registerPassword('confirmPassword', {
                                required: 'Confirm your new password',
                                validate: (value) => value === watchPassword('newPassword') || 'Passwords do not match',
                            })}
                            className="input"
                        />
                        {passwordErrors.confirmPassword && <p className="text-error text-xs mt-1">{passwordErrors.confirmPassword.message}</p>}
                    </div>

                    <button type="submit" disabled={changingPassword} className="w-full btn btn-secondary">
                        {changingPassword ? 'Updating...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
