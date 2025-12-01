import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, Check, X, Phone, User } from 'lucide-react';

interface VendorOrdersProps {
  vendorId: string;
}

export default function VendorOrders({ vendorId }: VendorOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [vendorId]);

  const loadOrders = async () => {
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          service:vendor_services(service_name, base_price),
          user:user_profiles(full_name, phone)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (bookingsData) {
        setOrders(bookingsData);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string, totalAmount: number) => {
    try {
      const vendorAmount = totalAmount * 0.5;
      const companyAmount = totalAmount * 0.5;

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          vendor_amount: vendorAmount,
          company_amount: companyAmount,
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      const { data: walletData } = await supabase
        .from('vendor_wallet')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (!walletData) {
        await supabase.from('vendor_wallet').insert({
          vendor_id: vendorId,
          pending_balance: vendorAmount,
          available_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
        });
      } else {
        await supabase
          .from('vendor_wallet')
          .update({
            pending_balance: (parseFloat(walletData.pending_balance) + vendorAmount),
          })
          .eq('vendor_id', vendorId);
      }

      await supabase.from('vendor_earnings').insert({
        vendor_id: vendorId,
        booking_id: bookingId,
        total_amount: totalAmount,
        vendor_amount: vendorAmount,
        company_amount: companyAmount,
        earning_type: 'booking',
        status: 'pending',
      });

      alert('Booking approved successfully! Funds will be available after service completion.');
      loadOrders();
    } catch (error: any) {
      console.error('Error approving booking:', error);
      alert(`Failed to approve: ${error.message}`);
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      const { data: booking } = await supabase
        .from('bookings')
        .select('vendor_amount')
        .eq('id', bookingId)
        .maybeSingle();

      if (booking && booking.vendor_amount) {
        const { data: walletData } = await supabase
          .from('vendor_wallet')
          .select('*')
          .eq('vendor_id', vendorId)
          .maybeSingle();

        if (walletData) {
          const newPendingBalance = parseFloat(walletData.pending_balance) - parseFloat(booking.vendor_amount);
          const newAvailableBalance = parseFloat(walletData.available_balance) + parseFloat(booking.vendor_amount);

          await supabase
            .from('vendor_wallet')
            .update({
              pending_balance: newPendingBalance,
              available_balance: newAvailableBalance,
              total_earned: parseFloat(walletData.total_earned) + parseFloat(booking.vendor_amount),
            })
            .eq('vendor_id', vendorId);

          await supabase
            .from('vendor_earnings')
            .update({ status: 'available' })
            .eq('booking_id', bookingId);
        }
      }

      alert('Booking marked as completed! Funds are now available for withdrawal.');
      loadOrders();
    } catch (error: any) {
      console.error('Error completing booking:', error);
      alert(`Failed to complete: ${error.message}`);
    }
  };

  const handleReject = async (bookingId: string, totalAmount: number) => {
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      const { data: booking } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('id', bookingId)
        .maybeSingle();

      if (booking) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('wallet_balance')
          .eq('id', booking.user_id)
          .maybeSingle();

        if (userProfile) {
          const newBalance = parseFloat(userProfile.wallet_balance) + totalAmount;

          await supabase
            .from('user_profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', booking.user_id);

          await supabase.from('wallet_transactions').insert({
            user_id: booking.user_id,
            transaction_type: 'recharge',
            amount: totalAmount,
            balance_before: parseFloat(userProfile.wallet_balance),
            balance_after: newBalance,
            description: `Refund for cancelled booking`,
            payment_method: 'refund',
            transaction_id: `REF${Date.now()}`,
            status: 'completed',
          });
        }
      }

      alert('Booking rejected and refunded to user!');
      loadOrders();
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      alert(`Failed to reject: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock size={48} className="mx-auto mb-4 text-gray-400" />
        <p>No recent activity</p>
        <p className="text-sm mt-2">
          Service requests will appear here once customers start booking
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">
                {order.service?.service_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <User size={14} className="inline mr-1" />
                {order.user?.full_name}
              </p>
              {order.user?.phone && (
                <p className="text-sm text-gray-600 mt-1">
                  <Phone size={14} className="inline mr-1" />
                  {order.user.phone}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-800">
                ₹{order.total_amount}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Your share: ₹{(order.total_amount * 0.5).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Clock size={14} />
            <span>
              {new Date(order.booking_date).toLocaleDateString()} at {order.booking_time}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin size={14} />
            <span>{order.user_address}, {order.user_pin_code}</span>
          </div>

          {order.notes && (
            <p className="text-sm text-gray-600 mb-3 italic bg-white p-2 rounded">
              Note: {order.notes}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                order.status === 'confirmed'
                  ? 'bg-green-100 text-green-700'
                  : order.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : order.status === 'completed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>

            {order.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(order.id, order.total_amount)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <X size={16} />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(order.id, order.total_amount)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Check size={16} />
                  Approve
                </button>
              </div>
            )}
            {order.status === 'confirmed' && (
              <button
                onClick={() => handleComplete(order.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Check size={16} />
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
