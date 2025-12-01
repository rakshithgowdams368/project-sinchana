import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Wallet, CreditCard } from 'lucide-react';

interface AddMoneyModalProps {
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMoneyModal({ userId, currentBalance, onClose, onSuccess }: AddMoneyModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amountValue < 100) {
      alert('Minimum amount to add is ₹100');
      return;
    }

    if (amountValue > 100000) {
      alert('Maximum amount to add is ₹1,00,000 per transaction');
      return;
    }

    setLoading(true);

    try {
      const balanceBefore = parseFloat(currentBalance.toString());
      const balanceAfter = balanceBefore + amountValue;
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'recharge',
          amount: amountValue,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Wallet recharge of ₹${amountValue}`,
          payment_method: 'dummy_gateway',
          transaction_id: transactionId,
          status: 'completed',
        });

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ wallet_balance: balanceAfter })
        .eq('id', userId);

      if (updateError) throw updateError;

      alert(`Successfully added ₹${amountValue} to your wallet!`);
      onSuccess();
    } catch (error) {
      console.error('Error adding money:', error);
      alert('Failed to add money. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Add Money to Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 mb-6 text-white">
            <p className="text-sm opacity-90 mb-1">Current Balance</p>
            <p className="text-3xl font-bold">₹{parseFloat(currentBalance.toString()).toFixed(2)}</p>
          </div>

          <form onSubmit={handleAddMoney} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="100"
                  max="100000"
                  step="1"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Min: ₹100 | Max: ₹1,00,000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Add
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="py-2 px-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors font-medium text-gray-700"
                  >
                    ₹{quickAmount}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Payment Method</span>
              </div>
              <p className="text-sm text-gray-600">
                Secure payment gateway (Demo mode)
              </p>
            </div>

            {amount && parseFloat(amount) >= 100 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">New Balance</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{(parseFloat(currentBalance.toString()) + parseFloat(amount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Add Money'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
