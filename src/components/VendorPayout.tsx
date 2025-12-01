import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface VendorPayoutProps {
  vendorId: string;
  bankDetails: {
    account_number?: string;
    ifsc_code?: string;
    account_holder_name?: string;
    bank_name?: string;
  };
}

export default function VendorPayout({ vendorId, bankDetails }: VendorPayoutProps) {
  const [wallet, setWallet] = useState<any>(null);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    loadWalletData();
    loadPayoutRequests();
  }, [vendorId]);

  const loadWalletData = async () => {
    try {
      const { data } = await supabase
        .from('vendor_wallet')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (!data) {
        await supabase.from('vendor_wallet').insert({
          vendor_id: vendorId,
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
        });
        setWallet({
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
        });
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const loadPayoutRequests = async () => {
    try {
      const { data } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('requested_at', { ascending: false });

      if (data) {
        setPayoutRequests(data);
      }
    } catch (error) {
      console.error('Error loading payout requests:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    if (amount > parseFloat(wallet?.available_balance || '0')) {
      alert('Insufficient balance');
      return;
    }

    if (amount < 100) {
      alert('Minimum withdrawal amount is ₹100');
      return;
    }

    if (!bankDetails.account_number || !bankDetails.ifsc_code || !bankDetails.account_holder_name) {
      alert('Please update your bank details in profile settings');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('payout_requests').insert({
        vendor_id: vendorId,
        amount: amount,
        status: 'pending',
        bank_account_number: bankDetails.account_number,
        bank_ifsc_code: bankDetails.ifsc_code,
        bank_account_holder_name: bankDetails.account_holder_name,
        bank_name: bankDetails.bank_name || '',
      });

      if (error) throw error;

      const newAvailableBalance = parseFloat(wallet.available_balance) - amount;

      await supabase
        .from('vendor_wallet')
        .update({ available_balance: newAvailableBalance })
        .eq('vendor_id', vendorId);

      alert('Payout request submitted successfully! It will be processed within 2-3 business days.');
      setWithdrawAmount('');
      loadWalletData();
      loadPayoutRequests();
    } catch (error: any) {
      console.error('Error creating payout request:', error);
      alert(`Failed to create payout request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100">Available Balance</span>
            <DollarSign size={24} />
          </div>
          <p className="text-3xl font-bold">₹{wallet?.available_balance || 0}</p>
          <p className="text-sm text-green-100 mt-1">Ready to withdraw</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-100">Pending Balance</span>
            <Clock size={24} />
          </div>
          <p className="text-3xl font-bold">₹{wallet?.pending_balance || 0}</p>
          <p className="text-sm text-yellow-100 mt-1">From pending bookings</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Total Earned</span>
            <TrendingUp size={24} />
          </div>
          <p className="text-3xl font-bold">₹{wallet?.total_earned || 0}</p>
          <p className="text-sm text-blue-100 mt-1">Lifetime earnings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Request Payout</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="100"
                max={wallet?.available_balance || 0}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ₹100 | Available: ₹{wallet?.available_balance || 0}
            </p>
          </div>

          {bankDetails.account_number ? (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="text-gray-600">
                <strong>Bank:</strong> {bankDetails.bank_name || 'Not provided'}
              </p>
              <p className="text-gray-600">
                <strong>Account:</strong> XXXX{bankDetails.account_number.slice(-4)}
              </p>
              <p className="text-gray-600">
                <strong>IFSC:</strong> {bankDetails.ifsc_code}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Please add your bank details in profile settings to request payouts
              </p>
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={loading || !bankDetails.account_number}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Request Payout'}
          </button>
        </div>
      </div>

      {payoutRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Payout History</h3>
          <div className="space-y-3">
            {payoutRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">₹{request.amount}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(request.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    request.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : request.status === 'processing'
                      ? 'bg-blue-100 text-blue-700'
                      : request.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {request.status === 'completed' && <CheckCircle size={12} className="inline mr-1" />}
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
