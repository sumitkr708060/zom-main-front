import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../../store/api';
import { useGetAdminVendorsQuery } from '../../store/api';
import { formatCurrency, formatDate } from '../../utils/deliveryUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { selectToken } from '../../store/authSlice';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [statusFilter, setStatusFilter] = useState('');
    const [vendorFilter, setVendorFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [search, setSearch] = useState('');
    const { data, isLoading, refetch } = useGetAdminOrdersQuery({
        page,
        limit,
        status: statusFilter || undefined,
        vendorId: vendorFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        search: search || undefined,
    });
    const [updateStatus] = useUpdateOrderStatusMutation();
    const orders = data?.orders || [];
    const token = useSelector(selectToken);
    const { data: vendorsData } = useGetAdminVendorsQuery({ limit: 200 });
    const vendors = vendorsData?.vendors || [];

    const handleStatusChange = async (orderId, status) => {
        try {
            await updateStatus({ id: orderId, status }).unwrap();
            toast.success('Status updated');
            refetch();
        } catch { toast.error('Update failed'); }
    };

    if (isLoading) return <LoadingSpinner />;
    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders ({data?.total || 0})</h1>
                    <p className="text-sm text-gray-500">Moderate orders, filter, and download invoices.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Show</label>
                        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="input text-sm w-24">
                            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order #" className="input text-sm w-40" />
                    <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="input text-sm w-44">
                        <option value="">All stores</option>
                        {vendors.map((v) => <option key={v._id} value={v._id}>{v.storeName}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input text-sm w-36">
                        <option value="">All status</option>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input text-sm w-36" />
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input text-sm w-36" />
                    <button onClick={() => { setPage(1); refetch(); }} className="btn btn-secondary btn-sm">Filter</button>
                    <button onClick={() => { setStatusFilter(''); setVendorFilter(''); setFromDate(''); setToDate(''); setSearch(''); setPage(1); refetch(); }} className="btn btn-secondary btn-sm">Reset</button>
                </div>
            </div>
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-left text-gray-500">
                                <th className="px-4 py-3">Order</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Store</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((o) => (
                                <tr key={o._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-primary">#{o.orderNumber}</td>
                                    <td className="px-4 py-3">{o.customerId?.name || 'Guest'}</td>
                                    <td className="px-4 py-3 text-gray-500">{o.vendorIds?.[0]?.storeName || '—'}</td>
                                    <td className="px-4 py-3 font-bold">{formatCurrency(o.total)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${o.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {o.orderStatus?.replace(/_/g, ' ') || 'pending'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 capitalize">{o.paymentStatus || 'pending'}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                                    <td className="px-4 py-3 space-x-2">
                                        <select value={o.orderStatus} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                                            className="text-xs rounded-xl border border-gray-200 px-2 py-1 focus:border-primary outline-none capitalize cursor-pointer">
                                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                        </select>
                                        <Link to={`/orders/${o._id}`} className="btn btn-secondary btn-sm">View</Link>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/admin/orders/${o._id}/invoice`, {
                                                        headers: { Authorization: token ? `Bearer ${token}` : '' },
                                                    });
                                                    if (!res.ok) throw new Error('Download failed');
                                                    const blob = await res.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `invoice-${o.orderNumber || o._id}.pdf`;
                                                    a.target = '_blank';
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                } catch (err) {
                                                    toast.error(err.message || 'Could not download');
                                                }
                                            }}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Invoice
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data?.pages > 1 && (
                    <div className="p-4 flex justify-center gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm">← Prev</button>
                        <span className="text-sm text-gray-600 self-center">{page}/{data.pages}</span>
                        <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm">Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
