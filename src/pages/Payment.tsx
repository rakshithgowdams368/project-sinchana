import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Wallet, CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';

const RECHARGE_OPTIONS = [100, 500, 1000, 5000, 10000];

export default function Payment() {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/user_auth');
      return;
    }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    setIsOnboarding(!profile?.onboarding_completed);
  };

  const handlePayment = async () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount;

    if (amount < 100) {
      alert('Minimum recharge amount is ₹100');
      return;
    }

    setProcessing(true);
    setLoading(true);

    setTimeout(async () => {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('wallet_balance')
          .eq('id', userId)
          .single();

        const currentBalance = profile?.wallet_balance || 0;
        const newBalance = parseFloat(currentBalance) + amount;

        const updateData: any = {
          wallet_balance: newBalance,
        };

        if (isOnboarding) {
          updateData.onboarding_completed = true;
        }

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', userId);

        if (updateError) throw updateError;

        const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          transaction_type: 'recharge',
          amount: amount,
          balance_after: newBalance,
          description: `Wallet recharge of ₹${amount}`,
          payment_method: 'dummy_gateway',
          transaction_id: transactionId,
          status: 'completed',
        });

        setProcessing(false);
        navigate('/user_dashboard');
      } catch (error: any) {
        console.error('Payment error:', error);
        alert('Payment failed. Please try again.');
        setProcessing(false);
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Wallet size={24} className="text-blue-600" />
            <span className="text-xl font-bold text-gray-800">Wallet Recharge</span>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Wallet size={32} className="text-blue-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Add Money to Wallet
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Minimum recharge amount: ₹100
          </p>

          {!processing ? (
            <>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Select Amount
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {RECHARGE_OPTIONS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      className={`py-4 px-6 rounded-xl border-2 font-semibold transition-all ${
                        selectedAmount === amount && !customAmount
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Or Enter Custom Amount
                </h3>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  placeholder="Enter amount (min ₹100)"
                  min="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-gray-800">
                    ₹{customAmount || selectedAmount}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  This is a demo payment gateway
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate(isOnboarding ? '/user_onboarding' : '/user_dashboard')}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading || (!selectedAmount && !customAmount)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard size={20} />
                  Pay Now
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Processing Payment...
              </h3>
              <p className="text-gray-600">Please wait while we process your payment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
