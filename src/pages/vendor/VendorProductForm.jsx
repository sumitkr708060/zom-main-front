import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCreateProductMutation, useGetFlatCategoriesQuery, useGetMyVendorQuery, useGetProductQuery, useUpdateProductMutation } from '../../store/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VendorProductForm() {
    const navigate = useNavigate();
    const { id: productId } = useParams();
    const isEdit = Boolean(productId);
    const [createProduct, { isLoading }] = useCreateProductMutation();
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const { data: categoriesData } = useGetFlatCategoriesQuery();
    const { data: vendorData } = useGetMyVendorQuery();
    const { data: productData, isLoading: isLoadingProduct } = useGetProductQuery(productId, { skip: !isEdit });
    const product = productData?.product;
    const [attributes, setAttributes] = useState([]);
    const [variations, setVariations] = useState([]);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            pincode: vendorData?.vendor?.pincode || '',
            unit: 'piece',
            manageStock: true,
            allowBackorders: false,
            soldIndividually: false,
            taxStatus: 'taxable',
            taxClass: 'standard',
            productType: 'simple',
        },
    });

    const productType = watch('productType');

    const categories = useMemo(
        () => (categoriesData?.categories || [])
            .filter((c) => c?.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name)),
        [categoriesData]
    );

    const generateVariations = () => {
        // Prefer attributes marked for variations; if none are marked, use all attributes that have values.
        let varAttrs = attributes.filter((a) => (a.forVariation ?? true) && a.key && a.value);
        if (varAttrs.length === 0) {
            varAttrs = attributes.filter((a) => a.key && a.value);
        }

        const optionSets = varAttrs.map((a) => ({
            key: a.key.trim(),
            options: a.value.split(/[,|]/).map(s => s.trim()).filter(Boolean),
        })).filter(s => s.key && s.options.length > 0);

        if (optionSets.length === 0) {
            return toast.error('Add attribute options before generating variations');
        }

        // Cartesian product of option sets
        const combos = [[]];
        optionSets.forEach(({ key, options }) => {
            const next = [];
            combos.forEach((c) => options.forEach((opt) => next.push([...c, { key, value: opt }])));
            combos.splice(0, combos.length, ...next);
        });

        const newVars = combos.map((combo) => ({
            title: combo.map(c => `${c.key}:${c.value}`).join(' / '),
            price: '',
            discountPrice: '',
            stock: '',
            sku: '',
            image: '',
            attributes: combo,
        }));

        setVariations(newVars);
        toast.success(`Generated ${newVars.length} variations`);
    };

    useEffect(() => {
        if (!isEdit || !product) return;
        reset({
            title: product.title || '',
            description: product.description || '',
            price: product.price ?? '',
            discountPrice: product.discountPrice ?? '',
            stock: product.stock ?? '',
            category: product.category?._id || product.category || '',
            unit: product.unit || 'piece',
            pincode: product.pincode || '',
            sku: product.sku || '',
            weight: product.weight ?? '',
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
            imageUrls: Array.isArray(product.images) ? product.images.join(', ') : '',
            manageStock: product.manageStock ?? true,
            allowBackorders: product.allowBackorders ?? false,
            soldIndividually: product.soldIndividually ?? false,
            taxStatus: product.taxStatus || 'taxable',
            taxClass: product.taxClass || 'standard',
            productType: product.productType || 'simple',
            externalUrl: product.externalUrl || '',
            externalButtonText: product.externalButtonText || '',
        });
        setAttributes(product.attributes || []);
        setVariations(product.variations || []);
    }, [isEdit, product, reset]);

    // Sync parent stock when variable product so validation passes even when inventory UI is hidden
    useEffect(() => {
        if (productType !== 'variable') return;
        const totalStock = variations.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
        setValue('stock', totalStock);
    }, [variations, productType, setValue]);

    const handleVariationFile = (file, idx) => {
        if (!file) return;
        setVariations((prev) => prev.map((v, i) => i === idx ? { ...v, imageFile: file, image: v.image || file.name } : v));
    };

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('price', data.price);
            formData.append('stock', data.stock);
            formData.append('category', data.category);
            formData.append('unit', data.unit || 'piece');
            if (data.discountPrice) formData.append('discountPrice', data.discountPrice);
            if (data.weight) formData.append('weight', data.weight);
            if (data.pincode) formData.append('pincode', data.pincode);
            if (data.tags) formData.append('tags', data.tags);
            if (data.sku) formData.append('sku', data.sku);
            formData.append('manageStock', data.manageStock ? 'true' : 'false');
            formData.append('allowBackorders', data.allowBackorders ? 'true' : 'false');
            formData.append('soldIndividually', data.soldIndividually ? 'true' : 'false');
            formData.append('taxStatus', data.taxStatus || 'taxable');
            formData.append('taxClass', data.taxClass || 'standard');
            formData.append('productType', data.productType || 'simple');
            if (data.externalUrl) formData.append('externalUrl', data.externalUrl);
            if (data.externalButtonText) formData.append('externalButtonText', data.externalButtonText);
            if (attributes.length > 0) formData.append('attributes', JSON.stringify(attributes.filter(a => a.key && a.value)));

            const variationUploads = [];
            const cleanedVariations = variations.map((v) => {
                const { imageFile, ...rest } = v;
                if (imageFile) variationUploads.push(imageFile);
                return { ...rest, attributes: v.attributes || [] };
            }).filter((v) => v.title);

            if (cleanedVariations.length > 0) formData.append('variations', JSON.stringify(cleanedVariations));
            variationUploads.forEach((file) => formData.append('variationImages', file));

            const files = data.images;
            const hasGlobalImages = files && files.length > 0;
            if (hasGlobalImages) {
                Array.from(files).forEach((file) => formData.append('images', file));
            } else if (variationUploads.length > 0) {
                variationUploads.forEach((file) => formData.append('images', file));
            } else if (data.imageUrls?.trim()) {
                formData.append('imageUrls', data.imageUrls.trim());
            } else {
                const urlsFromVariations = cleanedVariations.map((v) => v.image).filter(Boolean);
                if (urlsFromVariations.length) formData.append('imageUrls', urlsFromVariations.join(', '));
            }

            if (isEdit) {
                await updateProduct({ id: productId, data: formData }).unwrap();
                toast.success('Product updated successfully');
            } else {
                await createProduct(formData).unwrap();
                toast.success('Product added successfully');
            }
            navigate('/vendor/products');
        } catch (err) {
            toast.error(err?.data?.message || (isEdit ? 'Could not update product' : 'Could not add product'));
        }
    };

    if (isEdit && isLoadingProduct) return <LoadingSpinner />;

    return (
        <div className="max-w-3xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
                <p className="text-gray-500 text-sm mt-1">{isEdit ? 'Update details for your existing product.' : 'Add product details for your store catalog.'}</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="label">Product Title*</label>
                        <input {...register('title', { required: 'Title is required' })} className="input" placeholder="e.g. Apple iPhone 15 128GB" />
                        {errors.title && <p className="text-error text-xs mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="label">Description*</label>
                        <textarea {...register('description', { required: 'Description is required' })} rows={4} className="input resize-none" />
                        {errors.description && <p className="text-error text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="label">Price*</label>
                            <input type="number" step="0.01" min="0" {...register('price', { required: 'Price required' })} className="input" />
                            {errors.price && <p className="text-error text-xs mt-1">{errors.price.message}</p>}
                        </div>
                        <div>
                            <label className="label">Discount Price</label>
                            <input type="number" step="0.01" min="0" {...register('discountPrice')} className="input" />
                        </div>
                        {productType !== 'variable' ? (
                            <div>
                                <label className="label">Stock*</label>
                                <input type="number" min="0" {...register('stock', { required: 'Stock required' })} className="input" />
                                {errors.stock && <p className="text-error text-xs mt-1">{errors.stock.message}</p>}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600 flex items-end pb-1">
                                Stock is calculated per variation.
                            </div>
                        )}
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="label">Category*</label>
                            <select {...register('category', { required: 'Category is required' })} className="input">
                                <option value="">Select category</option>
                                {categories.map((c) => (
                                    <option key={c._id} value={c._id}>{`${c.icon || '📦'} ${c.name}`}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-error text-xs mt-1">{errors.category.message}</p>}
                        </div>
                        <div>
                            <label className="label">Unit</label>
                            <input {...register('unit')} className="input" placeholder="piece / kg / litre" />
                        </div>
                        <div>
                            <label className="label">Pincode</label>
                            <input maxLength={6} {...register('pincode', { pattern: { value: /^\d{6}$/, message: '6 digits' } })} className="input" />
                            {errors.pincode && <p className="text-error text-xs mt-1">{errors.pincode.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="label">SKU</label>
                            <input {...register('sku')} className="input" placeholder="Optional SKU code" />
                        </div>
                        <div>
                            <label className="label">Weight (kg)</label>
                            <input type="number" step="0.01" min="0" {...register('weight')} className="input" />
                        </div>
                    </div>

                    <div>
                        <label className="label">Tags (comma separated)</label>
                        <input {...register('tags')} className="input" placeholder="mobile, apple, 5g" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {productType !== 'variable' && (
                            <div className="card border border-gray-100 p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Inventory</h4>
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 mb-2">
                                    <input type="checkbox" {...register('manageStock')} className="checkbox" />
                                    Manage stock
                                </label>
                                <label className="label">Stock Qty</label>
                                <input type="number" min="0" {...register('stock', { required: 'Stock required' })} className="input mb-3" />
                                <label className="label">Allow Backorders?</label>
                                <select {...register('allowBackorders')} className="input mb-3">
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
                            <select {...register('taxStatus')} className="input mb-3">
                                <option value="taxable">Taxable</option>
                                <option value="shipping">Shipping only</option>
                                <option value="none">None</option>
                            </select>
                            <label className="label">Tax Class</label>
                            <select {...register('taxClass')} className="input">
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

                    {productType === 'variable' && (
                        <div className="card border border-gray-100 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900">Variations</h4>
                                <div className="flex gap-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={generateVariations}>Generate variations</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVariations((prev) => [...prev, { title: '', price: '', discountPrice: '', stock: '', sku: '', image: '', attributes: [] }])}>+ Add manually</button>
                                </div>
                            </div>
                            {variations.length === 0 && <p className="text-xs text-gray-500">No variations added.</p>}
                            <div className="space-y-3">
                                {variations.map((v, idx) => (
                                    <div key={idx} className="space-y-2 border border-gray-100 rounded-xl p-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input className="input" placeholder="Variation name" value={v.title}
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
                                        <div className="text-xs text-gray-500 flex items-center">Attributes: {v.attributes?.map(a => `${a.key}:${a.value}`).join(', ')}</div>
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
                                <input type="file" multiple accept="image/*" {...register('images')} className="input py-2" />
                                <p className="text-xs text-gray-500 mt-1">You can upload files or paste image URLs below.</p>
                            </div>

                            <div>
                                <label className="label">Image URLs (fallback)</label>
                                <textarea
                                    {...register('imageUrls')}
                                    rows={3}
                                    className="input resize-none"
                                    placeholder="https://example.com/1.jpg, https://example.com/2.jpg"
                                />
                                <p className="text-xs text-gray-500 mt-1">Required if no file is uploaded.</p>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/vendor/products')}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading || isUpdating} className="btn btn-primary">
                            {isEdit ? (isUpdating ? 'Saving...' : 'Save Changes') : (isLoading ? 'Adding...' : 'Add Product')}
                        </button>
                    </div>

                    {!vendorData?.vendor?.approved && (
                        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-xl p-3">
                            Your vendor account is pending admin approval. Product creation may be blocked until approved.
                        </p>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
