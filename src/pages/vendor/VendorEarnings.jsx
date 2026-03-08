import { useGetVendorEarningsQuery, useRequestWithdrawalMutation } from '../../store/api';
import { useGetMyVendorQuery } from '../../store/api';
import { formatCurrency, formatDate } from '../../utils/deliveryUtils';
import { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function VendorEarnings() {
    const { data: vendorData } = useGetMyVendorQuery();
    const { data, isLoading } = useGetVendorEarningsQuery({});
    const [requestWithdrawal, { isLoading: requesting }] = useRequestWithdrawalMutation();
    const vendor = vendorData?.vendor;
    const [amount, setAmount] = useState('');

    const handleWithdraw = async () => {
        const val = parseFloat(amount);
        if (!val || val <= 0 || val > vendor?.balance) return toast.error('Invalid amount');
        try {
            await requestWithdrawal({ amount: val }).unwrap();
            toast.success(`Withdrawal of ${formatCurrency(val)} requested!`);
            setAmount('');
        } catch { toast.error('Withdrawal failed'); }
    };

    if (isLoading) return <LoadingSpinner />;
    const earnings = data?.data || {};

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings & Payouts</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Earnings', value: formatCurrency(vendor?.totalEarnings || 0), icon: '💰' },
                    { label: 'Available Balance', value: formatCurrency(vendor?.balance || 0), icon: '🏦' },
                    { label: 'This Month', value: formatCurrency(earnings.thisMonth || 0), icon: '📈' },
                ].map((s) => (
                    <div key={s.label} className="card p-5">
                        <span className="text-3xl mb-3 block">{s.icon}</span>
                        <p className="text-2xl font-black text-gray-900">{s.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Withdrawal */}
            {vendor?.balance > 0 && (
                <div className="card p-5 mb-6">
                    <h2 className="font-bold text-gray-900 mb-3">Request Withdrawal</h2>
                    <p className="text-sm text-gray-500 mb-3">Available: <strong className="text-green-600">{formatCurrency(vendor.balance)}</strong></p>
                    <div className="flex gap-2">
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Max ${formatCurrency(vendor.balance)}`}
                            max={vendor.balance} className="input flex-1 text-sm" />
                        <button onClick={handleWithdraw} disabled={requesting} className="btn btn-primary px-5">
                            {requesting ? '...' : 'Withdraw'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Payouts are processed within 2-3 working days to your registered bank account.</p>
                </div>
            )}
        </div>
    );
}
