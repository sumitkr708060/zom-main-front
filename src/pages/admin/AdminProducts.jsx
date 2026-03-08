import { useRef, useState } from 'react';
import {
    useGetAdminProductsQuery,
    useApproveProductMutation,
    useDeleteProductMutation,
    useBulkUpsertProductsMutation,
    useGetAdminVendorsQuery,
} from '../../store/api';
import { formatCurrency } from '../../utils/deliveryUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminProducts() {
    const [vendorFilter, setVendorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading, refetch } = useGetAdminProductsQuery({
        vendorId: vendorFilter || undefined,
        isApproved: statusFilter || undefined,
        page,
        limit: 25,
    });
    const { data: vendorsData } = useGetAdminVendorsQuery({ limit: 200 });
    const vendors = vendorsData?.vendors || [];

    const [approveProduct] = useApproveProductMutation();
    const [deleteProduct] = useDeleteProductMutation();
    const [bulkUpsert, { isLoading: uploading }] = useBulkUpsertProductsMutation();
    const bulkInputRef = useRef(null);
    const bulkUpdateRef = useRef(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [pendingFile, setPendingFile] = useState(null);
    const [uploadErrors, setUploadErrors] = useState([]);
    const products = data?.products || [];
    const total = data?.total || products.length;
    const pages = data?.pages || 1;

    const parsePreview = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const lines = (reader.result || '').toString().split(/\r?\n/).filter(Boolean);
            if (lines.length === 0) return resolve([]);
            const headers = lines[0].split(',').map((h) => h.trim());
            const rows = lines.slice(1, 6).map((line) => line.split(',').map((c) => c.trim()));
            resolve([headers, ...rows]);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });

    const onPick = async (file) => {
        if (!file) return;
        if (!vendorFilter) {
            toast.error('Select a vendor before uploading CSV');
            return;
        }
        setPendingFile(file);
        try {
            const preview = await parsePreview(file);
            setPreviewRows(preview);
        } catch {
            setPreviewRows([]);
        }
    };

    const confirmUpload = async (mode = 'upsert') => {
        if (!pendingFile || !vendorFilter) return;
        const formData = new FormData();
        formData.append('csv', pendingFile);
        formData.append('vendorId', vendorFilter);
        formData.append('mode', mode);
        try {
            const res = await bulkUpsert({ data: formData, params: { vendorId: vendorFilter, mode } }).unwrap();
            setUploadErrors(res?.errors || []);
            toast.success(res?.message || `${res?.inserted || 0} added, ${res?.updated || 0} updated`);
            setPreviewRows([]);
            setPendingFile(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'CSV import failed');
            setUploadErrors(err?.data?.errors || []);
        } finally {
            if (bulkInputRef.current) bulkInputRef.current.value = '';
            if (bulkUpdateRef.current) bulkUpdateRef.current.value = '';
        }
    };

    if (isLoading) return <LoadingSpinner />;
    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products ({total})</h1>
                    <p className="text-sm text-gray-500">Add / approve / bulk edit vendor products</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select value={vendorFilter} onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }} className="input text-sm w-44">
                        <option value="">All vendors</option>
                        {vendors.map((v) => <option key={v._id} value={v._id}>{v.storeName}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input text-sm w-40">
                        <option value="">Status</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending</option>
                    </select>
                    <Link to="/admin/products/add" className="btn btn-primary">+ Add Product</Link>
                    <button className="btn btn-secondary" onClick={() => bulkInputRef.current?.click()} disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Bulk CSV (add)'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => bulkUpdateRef.current?.click()} disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Bulk CSV (edit)'}
                    </button>
                </div>
            </div>

            <input ref={bulkInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => onPick(e.target.files?.[0])} />
            <input ref={bulkUpdateRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => onPick(e.target.files?.[0])} />
            <p className="text-xs text-gray-500 mb-3">CSV headers supported: Name/Title, Regular price, Sale price, Stock, Images (comma separated), SKU, Categories, Tags, Pincode. For edits include Product ID or SKU.</p>
            {previewRows.length > 0 && (
                <div className="card p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="font-semibold">Preview (first 5 rows)</p>
                            <p className="text-xs text-gray-500">{pendingFile?.name}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => { setPreviewRows([]); setPendingFile(null); if (bulkInputRef.current) bulkInputRef.current.value=''; if (bulkUpdateRef.current) bulkUpdateRef.current.value=''; }}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={() => confirmUpload('upsert')} disabled={uploading}>Upload</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => confirmUpload('update')} disabled={uploading}>Update by SKU/ID</button>
                        </div>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-xs border">
                            <tbody>
                                {previewRows.map((row, idx) => (
                                    <tr key={idx} className="border-b">
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-2 py-1 whitespace-nowrap border-r">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {uploadErrors.length > 0 && (
                        <div className="mt-3 text-xs text-red-600">
                            <p className="font-semibold">Errors:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                {uploadErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                            {uploadErrors.length > 5 && <p>...and {uploadErrors.length - 5} more</p>}
                        </div>
                    )}
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-left text-gray-500">
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Vendor</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Stock</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.map((p) => (
                                <tr key={p._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <img src={p.images?.[0]} className="w-10 h-10 rounded-xl object-cover" alt={p.title} />
                                            <p className="font-medium text-gray-900 line-clamp-1 max-w-[160px]">{p.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{p.vendorId?.storeName}</td>
                                    <td className="px-4 py-3 font-bold">{formatCurrency(p.discountPrice || p.price)}</td>
                                    <td className="px-4 py-3">{p.stock}</td>
                                    <td className="px-4 py-3">
                                        {p.isApproved ? <span className="badge badge-green text-xs">Approved</span> : <span className="badge badge-orange text-xs">Pending</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5">
                                            {!p.isApproved && (
                                                <button onClick={async () => { await approveProduct({ id: p._id, approved: true }); refetch(); toast.success('Approved'); }}
                                                    className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200 text-xs">✅</button>
                                            )}
                                            <Link to={`/admin/products/edit/${p._id}`} className="btn btn-sm btn-secondary text-xs">Edit</Link>
                                            <button onClick={async () => { if (confirm('Delete?')) { await deleteProduct(p._id); refetch(); toast.success('Deleted'); } }}
                                                className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200 text-xs">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {pages > 1 && (
                    <div className="p-4 flex justify-center gap-2">
                        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm">← Prev</button>
                        <span className="text-sm text-gray-600 self-center">{page}/{pages}</span>
                        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm">Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
