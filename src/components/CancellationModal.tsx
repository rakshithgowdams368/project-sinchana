import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CancellationModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancellationModal({ booking, onClose, onSuccess }: CancellationModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const cancellationFeePercent = 30;
  const totalAmount = parseFloat(booking.total_amount);
  const cancellationFee = (totalAmount * cancellationFeePercent) / 100;
  const refundAmount = totalAmount - cancellationFee;

  const handleCancel = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const currentBalance = parseFloat(userProfile?.wallet_balance || '0');
      const newBalance = currentBalance + refundAmount;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ wallet_balance: newBalance.toString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      const { error: cancellationError } = await supabase
        .from('cancellation_reasons')
        .insert({
          booking_id: booking.id,
          user_id: user.id,
          reason: reason.trim(),
          cancellation_fee: cancellationFee.toFixed(2),
          refund_amount: refundAmount.toFixed(2)
        });

      if (cancellationError) throw cancellationError;

      const vendorShare = cancellationFee * 0.5;
      const companyShare = cancellationFee * 0.5;

      const { data: serviceData } = await supabase
        .from('vendor_services')
        .select('vendor_id')
        .eq('id', booking.service_id)
        .maybeSingle();

      if (serviceData?.vendor_id) {
        await supabase.from('vendor_earnings').insert({
          vendor_id: serviceData.vendor_id,
          booking_id: booking.id,
          total_amount: cancellationFee,
          vendor_amount: vendorShare,
          company_amount: companyShare,
          earning_type: 'cancellation_fee',
          status: 'available',
        });

        const { data: walletData } = await supabase
          .from('vendor_wallet')
          .select('*')
          .eq('vendor_id', serviceData.vendor_id)
          .maybeSingle();

        if (!walletData) {
          await supabase.from('vendor_wallet').insert({
            vendor_id: serviceData.vendor_id,
            available_balance: vendorShare,
            pending_balance: 0,
            total_earned: vendorShare,
            total_withdrawn: 0,
          });
        } else {
          await supabase
            .from('vendor_wallet')
            .update({
              available_balance: parseFloat(walletData.available_balance) + vendorShare,
              total_earned: parseFloat(walletData.total_earned) + vendorShare,
            })
            .eq('vendor_id', serviceData.vendor_id);
        }
      }

      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        transaction_type: 'recharge',
        amount: refundAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Refund after cancellation (₹${cancellationFee.toFixed(2)} cancellation fee)`,
        payment_method: 'refund',
        transaction_id: `REF${Date.now()}`,
        status: 'completed',
      });

      onSuccess();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Cancel Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">Cancellation Fee</h3>
              <p className="text-sm text-orange-800 mb-2">
                A {cancellationFeePercent}% cancellation fee will be charged.
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">Original Amount:</span>
                  <span className="font-semibold text-orange-900">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Cancellation Fee ({cancellationFeePercent}%):</span>
                  <span className="font-semibold text-orange-900">-₹{cancellationFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-orange-300">
                  <span className="text-orange-700 font-semibold">Refund to Wallet:</span>
                  <span className="font-bold text-orange-900">₹{refundAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Booking Details</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">Service: <span className="font-medium text-gray-800">{booking.service?.service_name}</span></p>
              <p className="text-gray-600">Vendor: <span className="font-medium text-gray-800">{booking.vendor?.business_name}</span></p>
              <p className="text-gray-600">Date: <span className="font-medium text-gray-800">{new Date(booking.booking_date).toLocaleDateString()}</span></p>
              <p className="text-gray-600">Time: <span className="font-medium text-gray-800">{booking.booking_time}</span></p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please tell us why you're cancelling this booking..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-red-300"
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
