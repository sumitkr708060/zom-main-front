import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function OTPVerify() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const email = state?.email || '';
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const newOtp = [...otp];
        newOtp[i] = val;
        setOtp(newOtp);
        if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) return toast.error('Enter all 6 digits');
        setLoading(true);
        try {
            await axios.post('/api/auth/verify-otp', { email, otp: code });
            toast.success('Email verified successfully! 🎉');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        try {
            await axios.post('/api/auth/send-otp', { email });
            toast.success('OTP resent to your email');
        } catch { toast.error('Could not resend OTP'); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md card p-8">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">📧</div>
                    <h1 className="text-2xl font-black text-gray-900">Verify your email</h1>
                    <p className="text-gray-500 text-sm mt-2">We sent a 6-digit code to <strong>{email}</strong></p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2 justify-center mb-6">
                        {otp.map((digit, i) => (
                            <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-12 h-12 text-center text-xl font-bold border-2 rounded-xl border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        ))}
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn btn-primary btn-lg mb-4">
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500">
                    Didn't receive it? <button onClick={resendOTP} className="text-primary font-semibold hover:underline">Resend OTP</button>
                </p>
            </motion.div>
        </div>
    );
}
