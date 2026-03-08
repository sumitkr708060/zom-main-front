import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLoginMutation } from '../store/api';
import { setCredentials } from '../store/authSlice';
import toast from 'react-hot-toast';

export default function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [login, { isLoading }] = useLoginMutation();
    const [showPass, setShowPass] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        try {
            const result = await login(data).unwrap();
            dispatch(setCredentials({ user: result.user, token: result.token }));
            toast.success(`Welcome back, ${result.user.name}! 👋`);
            // Redirect based on role
            if (result.user.role === 'admin') navigate('/admin/dashboard');
            else if (result.user.role === 'vendor' && result.user.vendor?.approved) navigate('/vendor/dashboard');
            else navigate('/');
        } catch (err) {
            toast.error(err.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="card p-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-3 shadow-lg">
                            <span className="text-white font-black text-2xl">Z</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Welcome back!</h1>
                        <p className="text-gray-500 text-sm mt-1">Sign in to your Zomitron account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="label">Email</label>
                            <input type="email" {...register('email', { required: 'Email is required' })}
                                placeholder="you@example.com" className={`input ${errors.email ? 'input-error' : ''}`} />
                            {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} {...register('password', { required: 'Password is required' })}
                                    placeholder="Enter your password" className={`input pr-12 ${errors.password ? 'input-error' : ''}`} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div className="text-right">
                            <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full btn btn-primary btn-lg">
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                        <p className="font-semibold mb-1">Demo Credentials:</p>
                        <p>Admin: admin@zomitron.com / admin123</p>
                        <p>Vendor: vendor1@zomitron.com / vendor123</p>
                        <p>Customer: customer@zomitron.com / customer123</p>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
