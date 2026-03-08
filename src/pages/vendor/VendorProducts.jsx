import { useRef, useState } from 'react';
import { useGetMyVendorQuery, useGetVendorProductsQuery, useDeleteProductMutation, useBulkUpsertProductsMutation } from '../../store/api';
import { formatCurrency } from '../../utils/deliveryUtils';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function VendorProducts() {
    const { data: vendorData } = useGetMyVendorQuery();
    const vendorId = vendorData?.vendor?._id;
    const { data, isLoading, refetch } = useGetVendorProductsQuery({ id: vendorId }, { skip: !vendorId });
    const [deleteProduct] = useDeleteProductMutation();
    const [bulkUpsert, { isLoading: uploading }] = useBulkUpsertProductsMutation();
    const products = data?.products || [];
    const fallbackImage = 'https://via.placeholder.com/400x300?text=No+Image';
    const fileInputRef = useRef(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [pendingFile, setPendingFile] = useState(null);

    const getImageSrc = (src) => {
        if (!src) return fallbackImage;
        if (src.startsWith('http://') || src.startsWith('https://')) return src;
        return src.startsWith('/') ? src : `/${src}`;
    };

    const parsePreview = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result || '';
            const lines = text.toString().split(/\r?\n/).filter(Boolean);
            if (lines.length === 0) return resolve([]);
            const headers = lines[0].split(',').map((h) => h.trim());
            const rows = lines.slice(1, 6).map((line) => line.split(',').map((c) => c.trim()));
            resolve([headers, ...rows]);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });

    const onFilePick = async (file) => {
        if (!file) return;
        setPendingFile(file);
        try {
            const preview = await parsePreview(file);
            setPreviewRows(preview);
        } catch {
            setPreviewRows([]);
        }
    };

    const [uploadErrors, setUploadErrors] = useState([]);

    const confirmUpload = async () => {
        if (!pendingFile) return;
        const formData = new FormData();
        formData.append('csv', pendingFile);
        try {
            const res = await bulkUpsert({ data: formData }).unwrap();
            setUploadErrors(res?.errors || []);
            toast.success(res?.message || `Uploaded (${res?.inserted || 0} added, ${res?.updated || 0} updated)`);
            setPreviewRows([]);
            setPendingFile(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Upload failed');
            setUploadErrors(err?.data?.errors || []);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Products ({products.length})</h1>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Bulk CSV'}
                    </button>
                    <Link to="/vendor/products/add" className="btn btn-primary">+ Add Product</Link>
                </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => onFilePick(e.target.files?.[0])} />
            <p className="text-xs text-gray-500 mb-4">Use CSV headers: Name, Regular price, Sale price, Stock, Images, SKU, Categories, Pincode. Include SKU to update existing items.</p>
            {previewRows.length > 0 && (
                <div className="card p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="font-semibold">Preview (first 5 rows)</p>
                            <p className="text-xs text-gray-500">{pendingFile?.name}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => { setPreviewRows([]); setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value=''; }}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={confirmUpload} disabled={uploading}>Upload</button>
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

            {products.length === 0 ? (
                <div className="text-center py-20 card">
                    <div className="text-5xl mb-4">📦</div>
                    <h2 className="text-xl font-bold mb-2">No products yet</h2>
                    <p className="text-gray-500 mb-4">Start adding products to your store.</p>
                    <Link to="/vendor/products/add" className="btn btn-primary">Add First Product</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                        <div key={p._id} className="card p-4 hover:shadow-lg transition">
                            <div className="aspect-[4/3] w-full rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden mb-3">
                                <img
                                    src={getImageSrc(p.images?.[0])}
                                    onError={(e) => { e.currentTarget.src = fallbackImage; }}
                                    className="h-full w-full object-contain"
                                    alt={p.title}
                                />
                            </div>
                            <h3 className="font-semibold text-base text-gray-900 line-clamp-2 mb-2">{p.title}</h3>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-primary text-lg">{formatCurrency(p.discountPrice || p.price)}</span>
                                <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                            </div>
                            <div className="flex gap-2">
                                <Link to={`/vendor/products/edit/${p._id}`} className="flex-1 btn btn-secondary btn-sm text-center">Edit</Link>
                                <button onClick={async () => {
                                    if (confirm(`Delete "${p.title}"?`)) {
                                        await deleteProduct(p._id);
                                        refetch();
                                        toast.success('Product deleted');
                                    }
                                }} className="btn btn-sm bg-red-100 text-red-600">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
