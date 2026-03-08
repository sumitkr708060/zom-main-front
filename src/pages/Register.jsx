import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useRegisterMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import toast from 'react-hot-toast';

export default function Register() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [register, { isLoading }] = useRegisterMutation();
    const [showPass, setShowPass] = useState(false);
    const { register: reg, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { role: 'customer' } });

    const onSubmit = async (data) => {
        try {
            const result = await register(data).unwrap();
            dispatch(setCredentials({ user: result.user, token: result.token }));
            toast.success('Account created! Please verify your email. 🎉');
            navigate('/verify-otp', { state: { email: data.email } });
        } catch (err) {
            toast.error(err.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="card p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-3 shadow-lg">
                            <span className="text-white font-black text-2xl">Z</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Create account</h1>
                        <p className="text-gray-500 text-sm mt-1">Join Zomitron — shop or sell locally</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input {...reg('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })}
                                placeholder="Your full name" className={`input ${errors.name ? 'input-error' : ''}`} />
                            {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input type="email" {...reg('email', { required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                                placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} />
                            {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="label">Phone (optional)</label>
                            <input {...reg('phone', { pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid Indian mobile' } })}
                                placeholder="10-digit mobile number" className={`input ${errors.phone ? 'input-error' : ''}`} />
                            {errors.phone && <p className="text-error text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} {...reg('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 chars' } })}
                                    placeholder="Min 6 characters" className={`input pr-12 ${errors.password ? 'input-error' : ''}`} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Account type */}
                        <div>
                            <label className="label">Account Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['customer', 'vendor'].map((role) => (
                                    <label key={role} className="relative cursor-pointer">
                                        <input type="radio" {...reg('role')} value={role} className="sr-only" />
                                        <div className={`p-3 border-2 rounded-xl text-center transition-all ${watch('role') === role ? 'border-primary bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <span className="text-2xl">{role === 'customer' ? '🛒' : '🏪'}</span>
                                            <p className="font-semibold text-sm mt-1 capitalize">{role}</p>
                                            <p className="text-xs text-gray-400">{role === 'customer' ? 'Shop products' : 'Sell products'}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full btn btn-primary btn-lg">
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
