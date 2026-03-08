import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useGetAdminVendorsQuery, useApproveVendorMutation,
    useAdminUpdateVendorMutation, useAdminToggleVendorOpenMutation
} from '../../store/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import GoogleMapPicker from '../../components/GoogleMapPicker';
import toast from 'react-hot-toast';
import { PowerIcon, EyeIcon } from '@heroicons/react/24/solid';

export default function AdminVendors() {
    const navigate = useNavigate();
    const { data, isLoading, refetch } = useGetAdminVendorsQuery({});
    const [approveVendor, { isLoading: approving }] = useApproveVendorMutation();
    const [updateVendor, { isLoading: saving }] = useAdminUpdateVendorMutation();
    const [toggleVendorOpen, { isLoading: toggling }] = useAdminToggleVendorOpenMutation();
    const vendors = data?.vendors || [];
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    const [locationData, setLocationData] = useState(null);

    const handleApproval = async (id, approved) => {
        try {
            await approveVendor({ id, approved }).unwrap();
            toast.success(`Vendor ${approved ? 'approved' : 'suspended'}`);
            refetch();
        } catch { toast.error('Action failed'); }
    };

    const startEdit = (vendor) => {
        setEditing(vendor._id);
        setLocationData(null);
        setForm({
            storeName: vendor.storeName,
            phone: vendor.phone || '',
            email: vendor.email || '',
            pincode: vendor.pincode || '',
            city: vendor.city || '',
            commissionRate: vendor.commissionRate ?? '',
        });
    };

    const saveEdit = async (id) => {
        try {
            const payload = { id, ...form };
            if (locationData) {
                payload.lat = locationData.lat;
                payload.lng = locationData.lng;
                payload.location = {
                    type: 'Point',
                    coordinates: [locationData.lng, locationData.lat],
                };
                if (locationData.city) payload.city = locationData.city;
                if (locationData.pincode) payload.pincode = locationData.pincode;
            }
            await updateVendor(payload).unwrap();
            toast.success('Vendor updated');
            setEditing(null);
            setLocationData(null);
            refetch();
        } catch { toast.error('Update failed'); }
    };

    const cancelEdit = () => {
        setEditing(null);
        setLocationData(null);
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Vendor Management</h1>
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-left text-gray-500">
                                <th className="px-4 py-3">Vendor</th>
                                <th className="px-4 py-3">City</th>
                                <th className="px-4 py-3">Earnings</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {vendors.map((v) => (
                                <>
                                    <tr key={v._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            {editing === v._id ? (
                                                <div className="space-y-1">
                                                    <input className="input text-sm py-2" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
                                                    <input className="input text-sm py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-semibold text-gray-900">{v.storeName}</p>
                                                    <p className="text-gray-400 text-xs">{v.email}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {editing === v._id ? (
                                                <div className="space-y-1">
                                                    <input className="input text-sm py-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                                                    <input className="input text-sm py-2" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                                                </div>
                                            ) : v.city}
                                        </td>
                                        <td className="px-4 py-3 font-bold">₹{v.totalEarnings?.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 items-center">
                                                {v.approved ? <span className="badge badge-green">Active</span> : <span className="badge badge-orange">Pending</span>}
                                                <span className={`badge ${v.isOpen ? 'badge-green' : 'badge-red'}`}>{v.isOpen ? 'On' : 'Off'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => toggleVendorOpen({ id: v._id, isOpen: !v.isOpen }).unwrap().then(refetch).then(() => toast.success(`Store ${v.isOpen ? 'turned off' : 'turned on'}`)).catch(() => toast.error('Toggle failed'))}
                                                    disabled={toggling}
                                                    className={`btn btn-sm ${v.isOpen ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} flex items-center gap-1`}
                                                >
                                                    <PowerIcon className="w-4 h-4" /> {v.isOpen ? 'Off' : 'On'}
                                                </button>
                                                {!v.approved ? (
                                                    <button onClick={() => handleApproval(v._id, true)} disabled={approving} className="btn btn-sm bg-green-500 text-white hover:bg-green-600">✅ Approve</button>
                                                ) : (
                                                    <button onClick={() => handleApproval(v._id, false)} disabled={approving} className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200">Suspend</button>
                                                )}
                                                {editing === v._id ? (
                                                    <>
                                                        <button onClick={() => saveEdit(v._id)} disabled={saving} className="btn btn-sm btn-primary">Save</button>
                                                        <button onClick={cancelEdit} className="btn btn-sm btn-secondary">Cancel</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(v)} className="btn btn-sm btn-secondary">Edit</button>
                                                        <button
                                                            onClick={() => navigate(`/admin/vendors/${v._id}`)}
                                                            className="btn btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                                                            title="View full vendor details"
                                                        >
                                                            <EyeIcon className="w-4 h-4" /> View
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded map row while editing */}
                                    {editing === v._id && (
                                        <tr key={`${v._id}-map`}>
                                            <td colSpan={5} className="px-4 pb-4 bg-gray-50">
                                                <div className="border border-orange-200 rounded-xl p-4 bg-white">
                                                    <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                        </svg>
                                                        Update Store Location
                                                    </p>
                                                    <p className="text-xs text-gray-400 mb-3">Search or click on the map to update this vendor's store coordinates.</p>
                                                    <GoogleMapPicker
                                                        initialLat={v.location?.coordinates?.[1] || null}
                                                        initialLng={v.location?.coordinates?.[0] || null}
                                                        onLocationSelect={(loc) => {
                                                            setLocationData(loc);
                                                            setForm((f) => ({
                                                                ...f,
                                                                city: loc.city || f.city,
                                                                pincode: loc.pincode || f.pincode,
                                                            }));
                                                        }}
                                                        height="220px"
                                                    />
                                                    {locationData && (
                                                        <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                                            ✓ New location selected — will be saved when you click Save
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
