import { useState, useMemo } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation } from '../../store/api';
import { useForm } from 'react-hook-form';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminCategories() {
    const { data, isLoading, refetch } = useGetCategoriesQuery();
    const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();
    const [editId, setEditId] = useState(null);

    const { register, handleSubmit, reset, setValue } = useForm({
        defaultValues: { name: '', slug: '', icon: '', parent: '', themeColor: '#f97316' },
    });

    const categories = data?.categories || [];
    const flatCategories = useMemo(() => {
        const list = [];
        categories.forEach((cat) => {
            list.push(cat);
            (cat.subcategories || []).forEach((sub) => list.push({ ...sub, parentName: cat.name }));
        });
        return list;
    }, [categories]);

    const onSubmit = async (form) => {
        try {
            if (editId) {
                await updateCategory({ id: editId, ...form, parent: form.parent || null }).unwrap();
                toast.success('Category updated');
            } else {
                await createCategory({ ...form, parent: form.parent || null }).unwrap();
                toast.success('Category created');
            }
            reset({ name: '', slug: '', icon: '', parent: '', themeColor: '#f97316' });
            setEditId(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to save category');
        }
    };

    const startEdit = (cat) => {
        setEditId(cat._id);
        setValue('name', cat.name || '');
        setValue('slug', cat.slug || '');
        setValue('icon', cat.icon || '');
        setValue('themeColor', cat.themeColor || '#f97316');
        setValue('parent', cat.parent || '');
    };

    const disableParent = (optId) => editId && optId === editId;

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category list */}
            <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Categories</h1>
                <div className="card divide-y divide-gray-100">
                    {categories.map((cat) => (
                        <div key={cat._id} className="px-5 py-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{cat.icon || '📁'}</span>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                                        <p className="text-xs text-gray-400">{cat.productCount || 0} products</p>
                                    </div>
                                    {cat.themeColor && <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: cat.themeColor }} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => startEdit(cat)} className="btn btn-sm btn-secondary text-xs">Edit</button>
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Delete ${cat.name}?`)) {
                                                await deleteCategory(cat._id);
                                                refetch();
                                                toast.success('Deleted');
                                            }
                                        }}
                                        className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200 text-xs"
                                    >🗑️</button>
                                </div>
                            </div>
                            {/* Subcategories */}
                            {(cat.subcategories || []).length > 0 && (
                                <div className="pl-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {cat.subcategories.map((sub) => (
                                        <div key={sub._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span>{sub.icon || '📁'}</span>
                                                <span className="text-xs font-medium text-gray-700">{sub.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => startEdit(sub)} className="text-xs text-primary">Edit</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit form */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? 'Edit Category' : 'Add Category'}</h2>
                <div className="card p-5">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <div>
                            <label className="label">Name*</label>
                            <input {...register('name', { required: true })} className="input text-sm" placeholder="e.g. Electronics" />
                        </div>
                        <div>
                            <label className="label">Slug*</label>
                            <input {...register('slug', { required: true })} className="input text-sm" placeholder="e.g. electronics" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Icon (emoji)</label>
                                <input {...register('icon')} className="input text-sm" placeholder="📱" />
                            </div>
                            <div>
                                <label className="label">Theme Color</label>
                                <input type="color" {...register('themeColor')} className="input p-1 h-11" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Parent (for sub-category)</label>
                            <select {...register('parent')} className="input text-sm">
                                <option value="">None (Top level)</option>
                                {flatCategories.map((c) => (
                                    <option key={c._id} value={c._id} disabled={disableParent(c._id)}>
                                        {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={creating || updating} className="w-full btn btn-primary">
                                {creating || updating ? 'Saving...' : (editId ? 'Save Changes' : '+ Add Category')}
                            </button>
                            {editId && (
                                <button
                                    type="button"
                                    onClick={() => { reset({ name: '', slug: '', icon: '', parent: '', themeColor: '#f97316' }); setEditId(null); }}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
