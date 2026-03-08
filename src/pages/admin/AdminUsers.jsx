import { useState } from 'react';
import { useGetAdminUsersQuery, useUpdateAdminUserStatusMutation } from '../../store/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminUsers() {
    const [roleFilter, setRoleFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const { data, isLoading, refetch } = useGetAdminUsersQuery({
        role: roleFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit: 50,
    });
    const [updateStatus, { isLoading: updating }] = useUpdateAdminUserStatusMutation();
    const users = data?.users || [];

    const toggleStatus = async (user) => {
        try {
            await updateStatus({ id: user._id, isActive: !user.isActive }).unwrap();
            toast.success(`${user.name || 'User'} ${user.isActive ? 'deactivated' : 'activated'}`);
            refetch();
        } catch {
            toast.error('Action failed');
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users ({data?.total || users.length})</h1>
                    <p className="text-sm text-gray-500">Admin-only view of registered users.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input text-sm w-40" />
                        <span className="text-gray-400 text-sm">to</span>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input text-sm w-40" />
                    </div>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input text-sm w-36">
                        <option value="">All roles</option>
                        <option value="customer">Customer</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => refetch()} className="btn btn-secondary btn-sm">Apply</button>
                    <button onClick={() => { setRoleFilter(''); setFromDate(''); setToDate(''); refetch(); }} className="btn btn-secondary btn-sm">Reset</button>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-left text-gray-500">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((u) => (
                                <tr key={u._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{u.name || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                                    <td className="px-4 py-3 capitalize">{u.role}</td>
                                    <td className="px-4 py-3">
                                        {u.isActive ? <span className="badge badge-green text-xs">Active</span> : <span className="badge badge-red text-xs">Inactive</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => toggleStatus(u)}
                                            disabled={updating}
                                            className={`btn btn-sm ${u.isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                        >
                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
