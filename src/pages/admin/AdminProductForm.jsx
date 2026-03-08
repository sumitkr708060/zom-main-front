import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    useCreateProductMutation,
    useUpdateProductMutation,
    useGetFlatCategoriesQuery,
    useGetProductQuery,
    useGetAdminVendorsQuery,
} from '../../store/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const { data: categoriesData } = useGetFlatCategoriesQuery();
    const { data: productData, isLoading: loadingProduct } = useGetProductQuery(id, { skip: !isEdit });
    const { data: vendorsData, isLoading: loadingVendors } = useGetAdminVendorsQuery({ limit: 200 });

    const [createProduct, { isLoading: creating }] = useCreateProductMutation();
    const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

    const product = productData?.product;
    const vendors = vendorsData?.vendors || [];
    const [attributes, setAttributes] = useState([]);
    const [variations, setVariations] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            unit: 'piece',
            manageStock: true,
            allowBackorders: false,
            soldIndividually: false,
            taxStatus: 'taxable',
            taxClass: 'standard',
            commissionMode: 'global',
        },
    });

    const productType = watch('productType');

    const categories = useMemo(
        () => (categoriesData?.categories || [])
            .filter((c) => c?.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name)),
        [categoriesData]
    );

    useEffect(() => {
        if (!isEdit || !product) return;
        reset({
            title: product.title,
            description: product.description,
            price: product.price,
            discountPrice: product.discountPrice || '',
            stock: product.stock,
            pincode: product.pincode,
            sku: product.sku || '',
            unit: product.unit || 'piece',
            weight: product.weight || '',
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            imageUrls: Array.isArray(product.images) ? product.images.join(', ') : '',
            vendorId: product.vendorId?._id || product.vendorId,
            manageStock: product.manageStock ?? true,
            allowBackorders: product.allowBackorders ?? false,
            soldIndividually: product.soldIndividually ?? false,
            taxStatus: product.taxStatus || 'taxable',
            taxClass: product.taxClass || 'standard',
            commissionMode: product.commissionMode || 'global',
            commissionValue: product.commissionValue || '',
        });
        const cats = product.categories?.length
            ? product.categories.map((c) => c._id || c).filter(Boolean)
            : [product.category?._id || product.category].filter(Boolean);
        setSelectedCategories(cats);
        setAttributes(product.attributes || []);
        setVariations(product.variations || []);
    }, [isEdit, product, reset]);

    useEffect(() => {
        if (productType !== 'variable') return;
        const total = variations.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
        setValue('stock', total);
    }, [variations, productType, setValue]);

    const handleVariationFile = (file, idx) => {
        if (!file) return;
        setVariations((prev) => prev.map((v, i) => i === idx ? { ...v, imageFile: file, image: v.image || file.name } : v));
    };

    const toggleCategory = (id) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        setValue('categories', selectedCategories);
    }, [selectedCategories, setValue]);

    const onSubmit = async (formValues) => {
        if (!formValues.vendorId) {
            toast.error('Select vendor');
            return;
        }
        if (selectedCategories.length === 0) {
            toast.error('Select at least one category');
            return;
        }
        try {
            const formData = new FormData();
            Object.entries({
                title: formValues.title,
                description: formValues.description,
                price: formValues.price,
                stock: formValues.stock,
                category: selectedCategories[0],
                unit: formValues.unit,
                discountPrice: formValues.discountPrice,
                weight: formValues.weight,
                pincode: formValues.pincode,
                tags: formValues.tags,
                sku: formValues.sku,
                vendorId: formValues.vendorId,
                manageStock: formValues.manageStock ? 'true' : 'false',
                allowBackorders: formValues.allowBackorders ? 'true' : 'false',
                soldIndividually: formValues.soldIndividually ? 'true' : 'false',
                taxStatus: formValues.taxStatus || 'taxable',
                taxClass: formValues.taxClass || 'standard',
                commissionMode: formValues.commissionMode,
                commissionValue: formValues.commissionValue,
            }).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, v); });
            selectedCategories.forEach((id) => formData.append('categories', id));

            const variationUploads = [];
            const cleanedVariations = variations.map((v) => {
                const { imageFile, ...rest } = v;
                if (imageFile) variationUploads.push(imageFile);
                return { ...rest, attributes: v.attributes || [] };
            }).filter((v) => v.title);

            const files = formValues.images;
            const hasGlobalImages = files && files.length > 0;
            if (hasGlobalImages) Array.from(files).forEach((f) => formData.append('images', f));
            else if (variationUploads.length > 0) variationUploads.forEach((f) => formData.append('images', f));
            else if (formValues.imageUrls) formData.append('imageUrls', formValues.imageUrls);
            else {
                const urlsFromVariations = cleanedVariations.map((v) => v.image).filter(Boolean);
                if (urlsFromVariations.length) formData.append('imageUrls', urlsFromVariations.join(', '));
            }

            if (attributes.length > 0) formData.append('attributes', JSON.stringify(attributes.filter(a => a.key && a.value)));
            if (cleanedVariations.length > 0) formData.append('variations', JSON.stringify(cleanedVariations));
            variationUploads.forEach((file) => formData.append('variationImages', file));

            if (isEdit) {
                await updateProduct({ id, data: formData }).unwrap();
                toast.success('Product updated');
            } else {
                await createProduct(formData).unwrap();
                toast.success('Product created');
            }
            navigate('/admin/products');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to save product');
        }
    };

    if (loadingProduct || loadingVendors) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product to Vendor'}</h1>
                <p className="text-sm text-gray-500">Attach products directly to a vendor, or bulk import from the list view.</p>
            </div>

            <div className="card p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="label">Vendor*</label>
                            <select {...register('vendorId', { required: 'Vendor is required' })} className="input">
                                <option value="">Select vendor</option>
                                {vendors.map((v) => <option key={v._id} value={v._id}>{v.storeName}</option>)}
                            </select>
                            {errors.vendorId && <p className="text-error text-xs mt-1">{errors.vendorId.message}</p>}
                        </div>
                        <div>
                            <label className="label">Categories*</label>
                            <div className="card border border-gray-200 p-3 max-h-56 overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {categories.map((c) => (
                                        <label key={c._id} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4"
                                                checked={selectedCategories.includes(c._id)}
                                                onChange={() => toggleCategory(c._id)}
                                            />
                                            <span>{c.icon || '📦'} {c.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Pick one or more; first selected becomes the primary category.</p>
                        </div>
                    </div>

                    <div>
                        <label className="label">Title*</label>
                        <input className="input" {...register('title', { required: 'Title required' })} />
                        {errors.title && <p className="text-error text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="label">Description*</label>
                        <textarea className="input resize-none" rows={4} {...register('description', { required: 'Description required' })} />
                        {errors.description && <p className="text-error text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="label">Price*</label>
                            <input type="number" step="0.01" className="input" {...register('price', { required: 'Price required' })} />
                        </div>
                        <div>
                            <label className="label">Discount Price</label>
                            <input type="number" step="0.01" className="input" {...register('discountPrice')} />
                        </div>
                        {productType !== 'variable' ? (
                            <div>
                                <label className="label">Stock*</label>
                                <input type="number" min="0" className="input" {...register('stock', { required: 'Stock required' })} />
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600 flex items-end pb-1">
                                Stock is handled in variations.
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="label">Unit</label>
                            <input className="input" {...register('unit')} placeholder="piece / kg / litre" />
                        </div>
                        <div>
                            <label className="label">Pincode</label>
                            <input className="input" maxLength={6} {...register('pincode')} />
                        </div>
                        <div>
                            <label className="label">SKU</label>
                            <input className="input" {...register('sku')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="label">Weight (kg)</label>
                            <input type="number" step="0.01" className="input" {...register('weight')} />
                        </div>
                        <div>
                            <label className="label">Tags</label>
                            <input className="input" placeholder="comma separated" {...register('tags')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="label">Product Type</label>
                            <select {...register('productType')} className="input">
                                <option value="simple">Simple product</option>
                                <option value="grouped">Grouped product</option>
                                <option value="external">External/Affiliate product</option>
                                <option value="variable">Variable product</option>
                            </select>
                        </div>
                        {productType === 'external' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="label">External URL</label>
                                    <input {...register('externalUrl')} className="input" placeholder="https://partner-link" />
                                </div>
                                <div>
                                    <label className="label">Button Text</label>
                                    <input {...register('externalButtonText')} className="input" placeholder="Buy Now" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {productType !== 'variable' && (
                            <div className="card border border-gray-100 p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Inventory</h4>
                                <label className="label">SKU</label>
                                <input className="input mb-3" {...register('sku')} placeholder="SKU" />
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 mb-2">
                                    <input type="checkbox" {...register('manageStock')} className="checkbox" />
                                    Manage stock
                                </label>
                                <label className="label">Stock Qty</label>
                                <input type="number" min="0" className="input mb-3" {...register('stock', { required: 'Stock required' })} />
                                <label className="label">Allow Backorders?</label>
                                <select className="input mb-3" {...register('allowBackorders')}>
                                    <option value="false">Do not allow</option>
                                    <option value="true">Allow</option>
                                </select>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" {...register('soldIndividually')} className="checkbox" />
                                    Sold individually
                                </label>
                            </div>
                        )}

                        <div className="card border border-gray-100 p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Tax</h4>
                            <label className="label">Tax Status</label>
                            <select className="input mb-3" {...register('taxStatus')}>
                                <option value="taxable">Taxable</option>
                                <option value="shipping">Shipping only</option>
                                <option value="none">None</option>
                            </select>
                            <label className="label">Tax Class</label>
                            <select className="input" {...register('taxClass')}>
                                <option value="standard">Standard</option>
                                <option value="gst_5">5% GST Uttar Pradesh</option>
                                <option value="gst_12">12% GST Uttar Pradesh</option>
                                <option value="gst_18">18% GST Uttar Pradesh</option>
                                <option value="zero">Zero rate</option>
                            </select>
                        </div>
                    </div>

                    <div className="card border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Attributes</h4>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttributes((prev) => [...prev, { key: '', value: '', visible: true, forVariation: false }])}>+ Add attribute</button>
                        </div>
                        {attributes.length === 0 && <p className="text-xs text-gray-500">No attributes added.</p>}
                        <div className="space-y-3">
                            {attributes.map((attr, idx) => (
                                <div key={idx} className="space-y-2 border border-gray-100 rounded-xl p-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input className="input" placeholder="Name (e.g., Color)" value={attr.key}
                                            onChange={(e) => setAttributes(attributes.map((a, i) => i === idx ? { ...a, key: e.target.value } : a))} />
                                        <input className="input" placeholder="Values (e.g., Red | Blue)" value={attr.value}
                                            onChange={(e) => setAttributes(attributes.map((a, i) => i === idx ? { ...a, value: e.target.value } : a))} />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <label className="inline-flex items-center gap-2">
                                            <input type="checkbox" checked={attr.visible ?? true}
                                                onChange={(e) => setAttributes(attributes.map((a, i) => i === idx ? { ...a, visible: e.target.checked } : a))} />
                                            Visible on product page
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                            <input type="checkbox" checked={attr.forVariation ?? false}
                                                onChange={(e) => setAttributes(attributes.map((a, i) => i === idx ? { ...a, forVariation: e.target.checked } : a))} />
                                            Used for variations
                                        </label>
                                        <button type="button" className="text-red-500 text-xs" onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}>Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card border border-gray-100 p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Commission (admin only)</h4>
                        <label className="label">Commission Mode</label>
                        <select className="input mb-3" {...register('commissionMode')}>
                            <option value="global">By global rule</option>
                            <option value="percent">Percent</option>
                            <option value="fixed">Fixed</option>
                            <option value="percent_fixed">Percent + Fixed</option>
                        </select>
                        <label className="label">Commission Value</label>
                        <input type="number" step="0.01" className="input" {...register('commissionValue')} placeholder="e.g., 10 for 10% or fixed amount" />
                    </div>

                    {productType === 'variable' && (
                        <div className="card border border-gray-100 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">Variations</h4>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVariations((prev) => [...prev, { title: '', price: '', discountPrice: '', stock: '', sku: '', image: '', attributes: [] }])}>+ Add variation</button>
                            </div>
                            {variations.length === 0 && <p className="text-xs text-gray-500">No variations added.</p>}
                            <div className="space-y-3">
                                {variations.map((v, idx) => (
                                    <div key={idx} className="space-y-2 border border-gray-100 rounded-xl p-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input className="input" placeholder="Variation name (e.g., Size M)" value={v.title}
                                                onChange={(e) => setVariations(variations.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} />
                                            <input className="input" placeholder="SKU" value={v.sku || ''} onChange={(e) => setVariations(variations.map((x, i) => i === idx ? { ...x, sku: e.target.value } : x))} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <input className="input" type="number" placeholder="Price" value={v.price || ''} onChange={(e) => setVariations(variations.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))} />
                                            <input className="input" type="number" placeholder="Discount price" value={v.discountPrice || ''} onChange={(e) => setVariations(variations.map((x, i) => i === idx ? { ...x, discountPrice: e.target.value } : x))} />
                                            <input className="input" type="number" placeholder="Stock" value={v.stock || ''} onChange={(e) => setVariations(variations.map((x, i) => i === idx ? { ...x, stock: e.target.value } : x))} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input className="input" placeholder="Image URL" value={v.image || ''} onChange={(e) => setVariations(variations.map((x, i) => i === idx ? { ...x, image: e.target.value } : x))} />
                                            <div>
                                                <input type="file" accept="image/*" className="input py-2" onChange={(e) => handleVariationFile(e.target.files?.[0], idx)} />
                                                {v.imageFile && <p className="text-xs text-gray-500 mt-1">Selected: {v.imageFile.name}</p>}
                                            </div>
                                        </div>
                                        <button type="button" className="text-red-500 text-xs" onClick={() => setVariations(variations.filter((_, i) => i !== idx))}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {productType !== 'variable' && (
                        <>
                            <div>
                                <label className="label">Upload Images</label>
                                <input type="file" multiple accept="image/*" className="input py-2" {...register('images')} />
                                <p className="text-xs text-gray-500 mt-1">Or paste URLs below</p>
                            </div>

                            <div>
                                <label className="label">Image URLs</label>
                                <textarea rows={3} className="input resize-none" {...register('imageUrls')} placeholder="https://example.com/a.jpg, https://example.com/b.jpg" />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/products')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={creating || updating}>
                            {isEdit ? (updating ? 'Saving...' : 'Save') : (creating ? 'Creating...' : 'Create')}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
                    CSV tip: headers like <code>Name</code>, <code>Regular price</code>, <code>Sale price</code>, <code>Stock</code>, <code>Images</code>, <code>SKU</code>, <code>Categories</code>, <code>Pincode</code>.
                </div>
            </div>
        </div>
    );
}
