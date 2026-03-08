import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { selectCurrentUser } from '../store/authSlice';
import { useGetMeQuery, useUpdateProfileMutation } from '../store/api';
import { updateUser } from '../store/authSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Profile() {
    const dispatch = useDispatch();
    const user = useSelector(selectCurrentUser);
    const { data, isLoading } = useGetMeQuery();
    const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
    const { register, handleSubmit, formState: { errors } } = useForm({
        values: { name: user?.name, phone: user?.phone || '' },
    });

    if (isLoading) return <LoadingSpinner />;

    const onSubmit = async (data) => {
        try {
            const result = await updateProfile(data).unwrap();
            dispatch(updateUser(result.user));
            toast.success('Profile updated!');
        } catch { toast.error('Update failed'); }
    };

    return (
        <div className="page-container py-8 max-w-xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
            <div className="card p-6">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=f97316&color=fff&size=80`}
                        className="w-16 h-16 rounded-2xl object-cover" alt={user?.name} />
                    <div>
                        <h2 className="font-bold text-gray-900">{user?.name}</h2>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                        <span className="badge badge-orange capitalize text-xs mt-1">{user?.role}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="label">Full Name</label>
                        <input {...register('name', { required: 'Name required' })} className={`input ${errors.name ? 'input-error' : ''}`} />
                    </div>
                    <div>
                        <label className="label">Phone</label>
                        <input {...register('phone')} className="input" placeholder="10-digit mobile" />
                    </div>
                    <div>
                        <label className="label">Email</label>
                        <input value={user?.email} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                    </div>
                    <button type="submit" disabled={updating} className="w-full btn btn-primary">
                        {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
