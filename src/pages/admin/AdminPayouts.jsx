import { useGetAdminPayoutsQuery, useProcessPayoutMutation } from '../../store/api';
import { formatCurrency } from '../../utils/deliveryUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminPayouts() {
    const { data, isLoading, refetch } = useGetAdminPayoutsQuery();
    const [processPayout, { isLoading: processing }] = useProcessPayoutMutation();
    const vendors = data?.vendors || [];

    const handlePayout = async (vendorId, amount) => {
        try {
            await processPayout({ vendorId, amount }).unwrap();
            toast.success(`Payout of ${formatCurrency(amount)} processed!`);
            refetch();
        } catch { toast.error('Payout failed'); }
    };

    if (isLoading) return <LoadingSpinner />;
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Vendor Payouts</h1>
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-left text-gray-500">
                                <th className="px-4 py-3">Vendor</th>
                                <th className="px-4 py-3">Total Earnings</th>
                                <th className="px-4 py-3">Available Balance</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {vendors.map((v) => (
                                <tr key={v._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold">{v.storeName}</p>
                                        <p className="text-gray-400 text-xs">{v.city}</p>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{formatCurrency(v.totalEarnings)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`font-bold ${v.balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>{formatCurrency(v.balance)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {v.balance > 0 ? (
                                            <button onClick={() => handlePayout(v._id, v.balance)} disabled={processing}
                                                className="btn btn-sm bg-green-500 text-white hover:bg-green-600 text-xs">
                                                💸 Pay {formatCurrency(v.balance)}
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs">No balance</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
