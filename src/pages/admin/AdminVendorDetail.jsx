import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAdminVendorQuery, useAdminUpdateVendorMutation } from '../../store/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import GoogleMapPicker from '../../components/GoogleMapPicker';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PencilIcon, MapPinIcon, CheckCircleIcon, XCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const toCommissionPercent = (rate) => {
    if (rate === null || rate === undefined || Number.isNaN(rate)) return '';
    return String(Math.round(Number(rate) * 10000) / 100);
};

const buildEditForm = (vendor) => ({
    storeName: vendor?.storeName || '',
    storeDescription: vendor?.storeDescription || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    gstin: vendor?.gstin || '',
    city: vendor?.address?.city || vendor?.city || '',
    state: vendor?.address?.state || vendor?.state || '',
    pincode: vendor?.address?.pincode || vendor?.pincode || '',
    addressLine1: vendor?.address?.line1 || '',
    addressLine2: vendor?.address?.line2 || '',
    commissionRatePct: toCommissionPercent(vendor?.commissionRate ?? 0),
    accountName: vendor?.bankDetails?.accountName || '',
    accountNumber: vendor?.bankDetails?.accountNumber || '',
    ifscCode: vendor?.bankDetails?.ifscCode || vendor?.bankDetails?.ifsc || '',
    bankName: vendor?.bankDetails?.bankName || '',
    upiId: vendor?.bankDetails?.upiId || '',
});

export default function AdminVendorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, refetch } = useGetAdminVendorQuery(id);
    const [updateVendor, { isLoading: saving }] = useAdminUpdateVendorMutation();
    const vendor = data?.vendor;

    const [showMapEditor, setShowMapEditor] = useState(false);
    const [showMapSection, setShowMapSection] = useState(false);
    const [locationData, setLocationData] = useState(null);

    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [detailForm, setDetailForm] = useState(null);

    if (isLoading) return <LoadingSpinner />;
    if (!vendor) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-gray-500">Vendor not found.</p>
            <button onClick={() => navigate('/admin/vendors')} className="btn btn-secondary">Back to Vendors</button>
        </div>
    );

    const lat = vendor.location?.coordinates?.[1];
    const lng = vendor.location?.coordinates?.[0];

    const startDetailsEdit = () => {
        setDetailForm(buildEditForm(vendor));
        setIsEditingDetails(true);
    };

    const cancelDetailsEdit = () => {
        setIsEditingDetails(false);
        setDetailForm(null);
    };

    const handleDetailChange = (key, value) => {
        setDetailForm((prev) => ({ ...prev, [key]: value }));
    };

    const saveDetails = async () => {
        if (!detailForm) return;

        const commissionPct = Number.parseFloat(detailForm.commissionRatePct);
        if (Number.isNaN(commissionPct) || commissionPct < 0 || commissionPct > 100) {
            toast.error('Commission must be between 0 and 100');
            return;
        }
        if (!detailForm.storeName.trim()) {
            toast.error('Store name is required');
            return;
        }
        if (!detailForm.addressLine1.trim()) {
            toast.error('Address line 1 is required');
            return;
        }
        if (!detailForm.city.trim() || !detailForm.state.trim()) {
            toast.error('City and state are required');
            return;
        }
        if (!/^\d{6}$/.test(String(detailForm.pincode || '').trim())) {
            toast.error('Pincode must be 6 digits');
            return;
        }

        try {
            await updateVendor({
                id: vendor._id,
                storeName: detailForm.storeName.trim(),
                storeDescription: detailForm.storeDescription.trim(),
                phone: detailForm.phone.trim(),
                email: detailForm.email.trim(),
                gstin: detailForm.gstin.trim(),
                city: detailForm.city.trim(),
                state: detailForm.state.trim(),
                pincode: detailForm.pincode.trim(),
                commissionRate: commissionPct / 100,
                address: {
                    line1: detailForm.addressLine1.trim(),
                    line2: detailForm.addressLine2.trim(),
                    city: detailForm.city.trim(),
                    state: detailForm.state.trim(),
                    pincode: detailForm.pincode.trim(),
                },
                bankDetails: {
                    accountName: detailForm.accountName.trim(),
                    accountNumber: detailForm.accountNumber.trim(),
                    ifscCode: detailForm.ifscCode.trim(),
                    bankName: detailForm.bankName.trim(),
                    upiId: detailForm.upiId.trim(),
                },
            }).unwrap();

            toast.success('Vendor details updated');
            setIsEditingDetails(false);
            setDetailForm(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to update vendor details');
        }
    };

    const saveLocation = async () => {
        if (!locationData) return;
        try {
            await updateVendor({
                id: vendor._id,
                lat: locationData.lat,
                lng: locationData.lng,
                location: { type: 'Point', coordinates: [locationData.lng, locationData.lat] },
                ...(locationData.city && { city: locationData.city }),
                ...(locationData.state && { state: locationData.state }),
                ...(locationData.pincode && { pincode: locationData.pincode }),
                ...(locationData.city || locationData.state || locationData.pincode
                    ? {
                        address: {
                            line1: vendor.address?.line1 || vendor.storeName || 'Store Address',
                            line2: vendor.address?.line2 || '',
                            city: locationData.city || vendor.address?.city || vendor.city || '',
                            state: locationData.state || vendor.address?.state || vendor.state || '',
                            pincode: locationData.pincode || vendor.address?.pincode || vendor.pincode || '',
                        },
                    }
                    : {}),
            }).unwrap();
            toast.success('Vendor location updated');
            setShowMapEditor(false);
            setLocationData(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to update location');
        }
    };

    const StatusBadge = ({ condition, trueLabel, falseLabel, trueClass = 'bg-green-100 text-green-700', falseClass = 'bg-red-100 text-red-600' }) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${condition ? trueClass : falseClass}`}>
            {condition ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
            {condition ? trueLabel : falseLabel}
        </span>
    );

    const InfoRow = ({ label, value }) => {
        const hasValue = !(value === undefined || value === null || String(value).trim() === '');
        if (!hasValue) return null;
        return (
            <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800 text-right max-w-xs">{value}</span>
            </div>
        );
    };

    const maskAccountNumber = (num) => {
        if (!num || num.length < 4) return num;
        return '•'.repeat(num.length - 4) + num.slice(-4);
    };

    const fullAddress = [
        vendor.address?.line1,
        vendor.address?.line2,
        vendor.address?.city || vendor.city,
        vendor.address?.state || vendor.state,
        vendor.address?.pincode || vendor.pincode,
    ].filter(Boolean).join(', ');

    return (
        <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/vendors')} className="btn btn-secondary btn-sm flex items-center gap-2">
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{vendor.storeName}</h1>
                    <p className="text-sm text-gray-400">{vendor.email || vendor.userId?.email}</p>
                </div>
            </div>

            <div className="flex gap-3 flex-wrap mb-6">
                <StatusBadge condition={vendor.approved} trueLabel="Approved" falseLabel="Pending Approval" />
                <StatusBadge condition={vendor.isOpen} trueLabel="Store Open" falseLabel="Store Closed" />
                <StatusBadge condition={vendor.isActive} trueLabel="Active" falseLabel="Inactive" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-5 space-y-1">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-gray-700">Store Details</h2>
                        {!isEditingDetails ? (
                            <button onClick={startDetailsEdit} className="btn btn-sm btn-secondary flex items-center gap-1">
                                <PencilIcon className="w-3.5 h-3.5" /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={cancelDetailsEdit} className="btn btn-sm btn-secondary">Cancel</button>
                                <button onClick={saveDetails} disabled={saving} className="btn btn-sm btn-primary">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    {!isEditingDetails && (
                        <>
                            <InfoRow label="Store Name" value={vendor.storeName} />
                            <InfoRow label="Email" value={vendor.email} />
                            <InfoRow label="Phone" value={vendor.phone} />
                            <InfoRow label="Address Line 1" value={vendor.address?.line1} />
                            <InfoRow label="Address Line 2" value={vendor.address?.line2} />
                            <InfoRow label="City" value={vendor.address?.city || vendor.city} />
                            <InfoRow label="State" value={vendor.address?.state || vendor.state} />
                            <InfoRow label="Pincode" value={vendor.address?.pincode || vendor.pincode} />
                            <InfoRow label="Full Address" value={fullAddress} />
                            <InfoRow label="GSTIN" value={vendor.gstin} />
                            <InfoRow label="Commission Rate" value={`${toCommissionPercent(vendor.commissionRate ?? 0)}%`} />
                            {vendor.storeDescription && (
                                <div className="py-2">
                                    <p className="text-sm text-gray-500 mb-1">Description</p>
                                    <p className="text-sm text-gray-700">{vendor.storeDescription}</p>
                                </div>
                            )}
                        </>
                    )}

                    {isEditingDetails && detailForm && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    className="input"
                                    placeholder="Store name"
                                    value={detailForm.storeName}
                                    onChange={(e) => handleDetailChange('storeName', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="Business phone"
                                    value={detailForm.phone}
                                    onChange={(e) => handleDetailChange('phone', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="Store email"
                                    value={detailForm.email}
                                    onChange={(e) => handleDetailChange('email', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="GSTIN"
                                    value={detailForm.gstin}
                                    onChange={(e) => handleDetailChange('gstin', e.target.value)}
                                />
                                <input
                                    className="input sm:col-span-2"
                                    placeholder="Address line 1"
                                    value={detailForm.addressLine1}
                                    onChange={(e) => handleDetailChange('addressLine1', e.target.value)}
                                />
                                <input
                                    className="input sm:col-span-2"
                                    placeholder="Address line 2"
                                    value={detailForm.addressLine2}
                                    onChange={(e) => handleDetailChange('addressLine2', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="City"
                                    value={detailForm.city}
                                    onChange={(e) => handleDetailChange('city', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="State"
                                    value={detailForm.state}
                                    onChange={(e) => handleDetailChange('state', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="Pincode"
                                    maxLength={6}
                                    value={detailForm.pincode}
                                    onChange={(e) => handleDetailChange('pincode', e.target.value)}
                                />
                                <input
                                    className="input"
                                    placeholder="Commission % (0-100)"
                                    value={detailForm.commissionRatePct}
                                    onChange={(e) => handleDetailChange('commissionRatePct', e.target.value)}
                                />
                                <textarea
                                    className="input sm:col-span-2 resize-none"
                                    rows={3}
                                    placeholder="Store description"
                                    value={detailForm.storeDescription}
                                    onChange={(e) => handleDetailChange('storeDescription', e.target.value)}
                                />
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Bank Details</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        className="input"
                                        placeholder="Account name"
                                        value={detailForm.accountName}
                                        onChange={(e) => handleDetailChange('accountName', e.target.value)}
                                    />
                                    <input
                                        className="input"
                                        placeholder="Account number"
                                        value={detailForm.accountNumber}
                                        onChange={(e) => handleDetailChange('accountNumber', e.target.value)}
                                    />
                                    <input
                                        className="input"
                                        placeholder="IFSC code"
                                        value={detailForm.ifscCode}
                                        onChange={(e) => handleDetailChange('ifscCode', e.target.value)}
                                    />
                                    <input
                                        className="input"
                                        placeholder="Bank name"
                                        value={detailForm.bankName}
                                        onChange={(e) => handleDetailChange('bankName', e.target.value)}
                                    />
                                    <input
                                        className="input sm:col-span-2"
                                        placeholder="UPI ID"
                                        value={detailForm.upiId}
                                        onChange={(e) => handleDetailChange('upiId', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Owner Account</h2>
                        <InfoRow label="Name" value={vendor.userId?.name} />
                        <InfoRow label="Email" value={vendor.userId?.email} />
                        <InfoRow label="Phone" value={vendor.userId?.phone} />
                        <InfoRow label="Registered" value={vendor.userId?.createdAt ? new Date(vendor.userId.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />
                    </div>

                    <div className="card p-5">
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Financials & Stats</h2>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="rounded-xl bg-orange-50 p-3 text-center">
                                <p className="text-lg font-bold text-orange-600">₹{(vendor.totalEarnings || 0).toLocaleString()}</p>
                                <p className="text-xs text-gray-500">Total Earnings</p>
                            </div>
                            <div className="rounded-xl bg-blue-50 p-3 text-center">
                                <p className="text-lg font-bold text-blue-600">₹{(vendor.balance || 0).toLocaleString()}</p>
                                <p className="text-xs text-gray-500">Current Balance</p>
                            </div>
                            <div className="rounded-xl bg-purple-50 p-3 text-center">
                                <p className="text-lg font-bold text-purple-600">{vendor.totalOrders || 0}</p>
                                <p className="text-xs text-gray-500">Total Orders</p>
                            </div>
                            <div className="rounded-xl bg-green-50 p-3 text-center">
                                <p className="text-lg font-bold text-green-600">{vendor.totalProducts || 0}</p>
                                <p className="text-xs text-gray-500">Products</p>
                            </div>
                        </div>
                        {vendor.ratings?.count > 0 && (
                            <InfoRow label="Rating" value={`${vendor.ratings.average?.toFixed(1)} ⭐ (${vendor.ratings.count} reviews)`} />
                        )}
                        <InfoRow label="Withdrawn" value={vendor.totalWithdrawn ? `₹${vendor.totalWithdrawn.toLocaleString()}` : null} />
                    </div>
                </div>
            </div>

            {(vendor.bankDetails?.accountNumber || vendor.bankDetails?.upiId || vendor.bankDetails?.ifscCode) && (
                <div className="card p-5 mt-6">
                    <h2 className="text-base font-semibold text-gray-700 mb-3">Bank Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                        <InfoRow label="Account Name" value={vendor.bankDetails.accountName} />
                        <InfoRow label="Account Number" value={maskAccountNumber(vendor.bankDetails.accountNumber)} />
                        <InfoRow label="IFSC Code" value={vendor.bankDetails.ifscCode || vendor.bankDetails.ifsc} />
                        <InfoRow label="Bank Name" value={vendor.bankDetails.bankName} />
                        <InfoRow label="UPI ID" value={vendor.bankDetails.upiId} />
                    </div>
                </div>
            )}

            <div className="card p-5 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-orange-500" />
                        Store Location
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMapSection((prev) => !prev)}
                            className="btn btn-sm btn-secondary flex items-center gap-1"
                            title={showMapSection ? 'Hide map' : 'Show map'}
                        >
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showMapSection ? 'rotate-180' : ''}`} />
                            {showMapSection ? 'Hide Map' : 'Show Map'}
                        </button>
                        <button
                            onClick={() => {
                                setShowMapSection(true);
                                setShowMapEditor(!showMapEditor);
                                setLocationData(null);
                            }}
                            className="btn btn-sm btn-secondary flex items-center gap-1"
                        >
                            <PencilIcon className="w-3.5 h-3.5" />
                            {showMapEditor ? 'Cancel Edit' : 'Edit Location'}
                        </button>
                    </div>
                </div>

                {!showMapSection && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        Map is hidden by default. Click "Show Map" to view vendor location.
                    </div>
                )}

                {showMapSection && lat && lng && !showMapEditor && (
                    <div>
                        <p className="text-xs text-gray-400 mb-2">
                            Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
                        </p>
                        <GoogleMapPicker
                            initialLat={lat}
                            initialLng={lng}
                            readOnly={true}
                            height="300px"
                        />
                    </div>
                )}

                {showMapSection && !lat && !lng && !showMapEditor && (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
                        No location set for this vendor yet. Click "Edit Location" to add one.
                    </div>
                )}

                {showMapSection && showMapEditor && (
                    <div>
                        <p className="text-xs text-gray-400 mb-3">
                            Search or click/drag the map to update the vendor's store pinpoint location.
                        </p>
                        <GoogleMapPicker
                            initialLat={lat || null}
                            initialLng={lng || null}
                            onLocationSelect={setLocationData}
                            height="300px"
                            forceEmbed
                        />
                        {locationData && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-green-700">New location ready to save</p>
                                    <p className="text-xs text-green-600 truncate max-w-xs">{locationData.address}</p>
                                </div>
                                <button
                                    onClick={saveLocation}
                                    disabled={saving}
                                    className="btn btn-sm btn-primary ml-4"
                                >
                                    {saving ? 'Saving...' : 'Save Location'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 text-xs text-gray-400 flex gap-6">
                {vendor.createdAt && <span>Created: {new Date(vendor.createdAt).toLocaleString('en-IN')}</span>}
                {vendor.updatedAt && <span>Last Updated: {new Date(vendor.updatedAt).toLocaleString('en-IN')}</span>}
            </div>
        </div>
    );
}
