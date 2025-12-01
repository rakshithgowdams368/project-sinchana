import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';

interface BookingModalProps {
  service: any;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function BookingModal({ service, onClose, onSuccess, userId }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    bookingDate: '',
    bookingTime: '',
    address: '',
    pinCode: '',
    notes: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('address, pin_code, wallet_balance')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        setFormData({
          ...formData,
          address: data.address || '',
          pinCode: data.pin_code || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const walletBalance = parseFloat(userProfile?.wallet_balance || '0');

    if (walletBalance < service.base_price) {
      alert(`Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)} but need ₹${service.base_price}. Please add money to your wallet.`);
      return;
    }

    setLoading(true);

    try {
      const newBalance = walletBalance - service.base_price;

      const { error: bookingError, data: bookingData } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          vendor_id: service.vendor_id,
          service_id: service.id,
          booking_date: formData.bookingDate,
          booking_time: formData.bookingTime,
          total_amount: service.base_price,
          user_address: formData.address,
          user_pin_code: formData.pinCode,
          notes: formData.notes,
          status: 'pending',
          payment_status: 'paid',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const { error: walletError } = await supabase
        .from('user_profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);

      if (walletError) throw walletError;

      const transactionId = bookingData?.id || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        transaction_type: 'debit',
        amount: service.base_price,
        balance_before: walletBalance,
        balance_after: newBalance,
        description: `Booking for ${service.service_name}`,
        reference_id: transactionId,
        status: 'completed',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Book Service</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-1">{service.service_name}</h3>
            <p className="text-sm text-gray-600 mb-2">{service.vendor?.business_name}</p>
            <p className="text-2xl font-bold text-blue-600">₹{service.base_price}</p>
            <p className="text-xs text-gray-500">{service.price_unit}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Booking Date
              </label>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                min={minDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Preferred Time
              </label>
              <select
                value={formData.bookingTime}
                onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select time slot</option>
                <option value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</option>
                <option value="11:00 AM - 1:00 PM">11:00 AM - 1:00 PM</option>
                <option value="1:00 PM - 3:00 PM">1:00 PM - 3:00 PM</option>
                <option value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</option>
                <option value="5:00 PM - 7:00 PM">5:00 PM - 7:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Service Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code
              </label>
              <input
                type="text"
                value={formData.pinCode}
                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                pattern="[0-9]{6}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Any specific requirements..."
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Your Wallet Balance:</span>
                <span className="font-bold text-gray-800">₹{parseFloat(userProfile?.wallet_balance || '0').toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Service Cost:</span>
                <span className="font-bold text-gray-800">₹{service.base_price}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                <span className="font-semibold text-gray-800">Balance After Booking:</span>
                <span className="font-bold text-blue-600">
                  ₹{parseFloat(userProfile?.wallet_balance || 0) - service.base_price}
                </span>
              </div>
            </div>

            {userProfile?.wallet_balance < service.base_price && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                Insufficient wallet balance. Please add money to your wallet.
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || userProfile?.wallet_balance < service.base_price}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CreditCard size={20} />
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
