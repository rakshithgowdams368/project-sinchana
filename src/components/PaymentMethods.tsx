import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, CreditCard, Smartphone } from 'lucide-react';

interface PaymentMethodsProps {
  userId: string;
  onBack: () => void;
}

export default function PaymentMethods({ userId, onBack }: PaymentMethodsProps) {
  const [methods, setMethods] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newMethod, setNewMethod] = useState({
    method_type: 'card',
    display_name: '',
    card_number: '',
    upi_id: '',
  });

  useEffect(() => {
    loadPaymentMethods();
  }, [userId]);

  const loadPaymentMethods = async () => {
    try {
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data) {
        setMethods(data);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const details = newMethod.method_type === 'card'
        ? { last4: newMethod.card_number.slice(-4) }
        : { upi_id: newMethod.upi_id };

      const { error } = await supabase.from('payment_methods').insert({
        user_id: userId,
        method_type: newMethod.method_type,
        display_name: newMethod.display_name,
        details,
        is_default: methods.length === 0,
      });

      if (error) throw error;

      setNewMethod({
        method_type: 'card',
        display_name: '',
        card_number: '',
        upi_id: '',
      });
      setShowAddForm(false);
      loadPaymentMethods();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPaymentMethods();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Payment Methods</h2>
      </div>

      {!showAddForm ? (
        <>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 mb-6"
          >
            <Plus size={20} />
            Add Payment Method
          </button>

          <div className="space-y-3">
            {methods.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={40} className="text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No payment methods added</p>
                <p className="text-sm text-gray-500">Add a payment method to get started</p>
              </div>
            ) : (
              methods.map((method) => (
                <div
                  key={method.id}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        {method.method_type === 'card' ? (
                          <CreditCard size={24} className="text-blue-600" />
                        ) : (
                          <Smartphone size={24} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{method.display_name}</p>
                        <p className="text-sm text-gray-600">
                          {method.method_type === 'card'
                            ? `**** ${method.details?.last4 || '****'}`
                            : method.details?.upi_id}
                        </p>
                        {method.is_default && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-1 inline-block">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleAddMethod} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={newMethod.method_type}
              onChange={(e) => setNewMethod({ ...newMethod, method_type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="card">Credit/Debit Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={newMethod.display_name}
              onChange={(e) => setNewMethod({ ...newMethod, display_name: e.target.value })}
              placeholder="e.g., My HDFC Card"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {newMethod.method_type === 'card' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                value={newMethod.card_number}
                onChange={(e) => setNewMethod({ ...newMethod, card_number: e.target.value })}
                placeholder="1234 5678 9012 3456"
                maxLength={16}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={newMethod.upi_id}
                onChange={(e) => setNewMethod({ ...newMethod, upi_id: e.target.value })}
                placeholder="example@upi"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Method'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
