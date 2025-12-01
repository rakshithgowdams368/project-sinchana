import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Shield, Users, Briefcase, LogOut, TrendingUp, Check, X,
  LayoutDashboard, CreditCard, Calendar, Wallet, UserCircle,
  Package, Star, Menu, ChevronRight
} from 'lucide-react';

interface VendorProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  business_name: string;
  phone: string;
  location: string;
  pin_code: string;
  approval_status: string;
  is_approved: boolean;
  rating: number;
  jobs_completed: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    vendors: 0,
    admins: 0,
    pendingVendors: 0,
    bookings: 0,
    services: 0
  });

  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pendingVendors, setPendingVendors] = useState<VendorProfile[]>([]);

  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeView !== 'dashboard') {
      loadViewData(activeView);
    }
  }, [activeView]);

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/admin_auth');
        return;
      }

      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (adminProfile) {
        setProfile(adminProfile);
        await loadStats();
        await loadPendingVendors();
      } else {
        navigate('/admin_auth');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [usersResult, vendorsResult, adminsResult, pendingResult, bookingsResult, servicesResult] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vendor_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('admin_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vendor_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('vendor_services').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        users: usersResult.count || 0,
        vendors: vendorsResult.count || 0,
        admins: adminsResult.count || 0,
        pendingVendors: pendingResult.count || 0,
        bookings: bookingsResult.count || 0,
        services: servicesResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingVendors(data || []);
    } catch (error) {
      console.error('Error loading pending vendors:', error);
    }
  };

  const loadViewData = async (view: string) => {
    setDataLoading(true);
    try {
      switch (view) {
        case 'users':
          const { data: usersData } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });
          setUsers(usersData || []);
          break;

        case 'vendors':
          const { data: vendorsData } = await supabase
            .from('vendor_profiles')
            .select('*')
            .order('created_at', { ascending: false });
          setVendors(vendorsData || []);
          break;

        case 'bookings':
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select(`
              *,
              user:user_profiles(full_name, email),
              vendor:vendor_profiles(business_name, phone),
              service:vendor_services(service_name, service_type)
            `)
            .order('created_at', { ascending: false });
          setBookings(bookingsData || []);
          break;

        case 'wallet':
          const { data: walletData } = await supabase
            .from('wallet_transactions')
            .select(`
              *,
              user:user_profiles(full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(100);
          setWalletTransactions(walletData || []);
          break;

        case 'payments':
          const { data: paymentsData } = await supabase
            .from('payment_methods')
            .select(`
              *,
              user:user_profiles(full_name, email)
            `)
            .order('created_at', { ascending: false });
          setPaymentMethods(paymentsData || []);
          break;

        case 'services':
          const { data: servicesData } = await supabase
            .from('vendor_services')
            .select(`
              *,
              vendor:vendor_profiles(business_name, phone, email)
            `)
            .order('created_at', { ascending: false });
          setServices(servicesData || []);
          break;

        case 'reviews':
          const { data: reviewsData } = await supabase
            .from('service_reviews')
            .select(`
              *,
              user:user_profiles(full_name),
              vendor:vendor_profiles(business_name),
              booking:bookings(id)
            `)
            .order('created_at', { ascending: false });
          setReviews(reviewsData || []);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${view} data:`, error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleApprove = async (vendorId: string) => {
    setProcessingId(vendorId);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          is_approved: true,
          approval_status: 'approved',
        })
        .eq('id', vendorId);

      if (error) throw error;

      await loadStats();
      await loadPendingVendors();
      if (activeView === 'vendors') {
        await loadViewData('vendors');
      }
    } catch (error) {
      console.error('Error approving vendor:', error);
      alert('Failed to approve vendor. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (vendorId: string) => {
    setProcessingId(vendorId);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          is_approved: false,
          approval_status: 'rejected',
        })
        .eq('id', vendorId);

      if (error) throw error;

      await loadStats();
      await loadPendingVendors();
      if (activeView === 'vendors') {
        await loadViewData('vendors');
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      alert('Failed to reject vendor. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Profiles', icon: UserCircle },
    { id: 'vendors', label: 'Vendor Profiles', icon: Briefcase },
    { id: 'services', label: 'Vendor Services', icon: Package },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reviews', label: 'Service Reviews', icon: Star },
    { id: 'wallet', label: 'Wallet Transactions', icon: Wallet },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
  ];

  const renderContent = () => {
    if (dataLoading && activeView !== 'dashboard') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'vendors':
        return renderVendors();
      case 'bookings':
        return renderBookings();
      case 'wallet':
        return renderWalletTransactions();
      case 'payments':
        return renderPaymentMethods();
      case 'services':
        return renderServices();
      case 'reviews':
        return renderReviews();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users size={24} className="text-blue-600" />
            </div>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.users}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Briefcase size={24} className="text-green-600" />
            </div>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Vendors</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.vendors}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar size={24} className="text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Bookings</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.bookings}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-600">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <Shield size={24} className="text-amber-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Approvals</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.pendingVendors}</p>
        </div>
      </div>

      {pendingVendors.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Pending Vendor Approvals</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Business</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Phone</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Location</th>
                  <th className="text-center py-3 px-4 text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      {vendor.first_name} {vendor.last_name}
                    </td>
                    <td className="py-4 px-4">{vendor.business_name}</td>
                    <td className="py-4 px-4">{vendor.email}</td>
                    <td className="py-4 px-4">{vendor.phone}</td>
                    <td className="py-4 px-4">
                      {vendor.location}, {vendor.pin_code}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(vendor.id)}
                          disabled={processingId === vendor.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(vendor.id)}
                          disabled={processingId === vendor.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <X size={16} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Profiles</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Name</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Email</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Phone</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Location</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Wallet Balance</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">{user.full_name}</td>
                <td className="py-4 px-4">{user.email}</td>
                <td className="py-4 px-4">{user.phone || 'N/A'}</td>
                <td className="py-4 px-4">{user.address ? `${user.address}, ${user.pin_code}` : 'N/A'}</td>
                <td className="py-4 px-4">₹{user.wallet_balance || 0}</td>
                <td className="py-4 px-4">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-center py-8 text-gray-500">No users found</p>
        )}
      </div>
    </div>
  );

  const renderVendors = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Profiles</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Business Name</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Name</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Email</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Phone</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Rating</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Jobs</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4 font-medium">{vendor.business_name}</td>
                <td className="py-4 px-4">{vendor.first_name} {vendor.last_name}</td>
                <td className="py-4 px-4">{vendor.email}</td>
                <td className="py-4 px-4">{vendor.phone}</td>
                <td className="py-4 px-4">{vendor.rating?.toFixed(1) || '0.0'}</td>
                <td className="py-4 px-4">{vendor.jobs_completed || 0}</td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    vendor.is_approved
                      ? 'bg-green-100 text-green-800'
                      : vendor.approval_status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {vendor.approval_status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {!vendor.is_approved && vendor.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(vendor.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(vendor.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vendors.length === 0 && (
          <p className="text-center py-8 text-gray-500">No vendors found</p>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Bookings</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">User</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Vendor</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Service</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Date & Time</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Amount</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">Payment</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">
                  {booking.user?.full_name || 'N/A'}
                </td>
                <td className="py-4 px-4">{booking.vendor?.business_name}</td>
                <td className="py-4 px-4">{booking.service?.service_name}</td>
                <td className="py-4 px-4">
                  {new Date(booking.booking_date).toLocaleDateString()}
                  <br />
                  <span className="text-xs text-gray-500">{booking.booking_time}</span>
                </td>
                <td className="py-4 px-4">₹{booking.total_amount}</td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : booking.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <p className="text-center py-8 text-gray-500">No bookings found</p>
        )}
      </div>
    </div>
  );

  const renderWalletTransactions = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Wallet Transactions</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">User</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Type</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Amount</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Balance After</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Description</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Method</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {walletTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">
                  {transaction.user?.full_name || 'N/A'}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    transaction.transaction_type === 'credit' || transaction.transaction_type === 'topup'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.transaction_type}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                    ₹{Math.abs(transaction.amount)}
                  </span>
                </td>
                <td className="py-4 px-4">₹{transaction.balance_after}</td>
                <td className="py-4 px-4 text-sm">{transaction.description}</td>
                <td className="py-4 px-4">{transaction.payment_method || 'N/A'}</td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm">
                  {new Date(transaction.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {walletTransactions.length === 0 && (
          <p className="text-center py-8 text-gray-500">No transactions found</p>
        )}
      </div>
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Methods</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">User</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Type</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Card Number</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Card Holder</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Expiry</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">Default</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Added</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.map((method) => (
              <tr key={method.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">
                  {method.user?.full_name || 'N/A'}
                </td>
                <td className="py-4 px-4 capitalize">{method.method_type}</td>
                <td className="py-4 px-4">{method.card_number}</td>
                <td className="py-4 px-4">{method.card_holder_name}</td>
                <td className="py-4 px-4">{method.expiry_date}</td>
                <td className="py-4 px-4 text-center">
                  {method.is_default && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Default
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-sm">
                  {new Date(method.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paymentMethods.length === 0 && (
          <p className="text-center py-8 text-gray-500">No payment methods found</p>
        )}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Services</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Vendor</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Service Type</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Service Name</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Price</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Location</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">{service.vendor?.business_name}</td>
                <td className="py-4 px-4">{service.service_type}</td>
                <td className="py-4 px-4 font-medium">{service.service_name}</td>
                <td className="py-4 px-4">
                  ₹{service.base_price}
                  <span className="text-xs text-gray-500 ml-1">{service.price_unit}</span>
                </td>
                <td className="py-4 px-4">
                  {service.location}
                  <br />
                  <span className="text-xs text-gray-500">{service.pin_code}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    service.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm">
                  {new Date(service.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <p className="text-center py-8 text-gray-500">No services found</p>
        )}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Service Reviews</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">User</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Vendor</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Rating</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Review</th>
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4">
                  {review.user?.full_name || 'N/A'}
                </td>
                <td className="py-4 px-4">{review.vendor?.business_name}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{review.rating}</span>
                  </div>
                </td>
                <td className="py-4 px-4 max-w-md">
                  <p className="text-sm text-gray-600">{review.review_text || 'No review text'}</p>
                </td>
                <td className="py-4 px-4 text-sm">
                  {new Date(review.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && (
          <p className="text-center py-8 text-gray-500">No reviews found</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield size={24} className="text-blue-600" />
              <span className="font-bold text-gray-800">Admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                {sidebarOpen && activeView === item.id && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-800">
              {menuItems.find(item => item.id === activeView)?.label || 'Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              {profile?.full_name || 'Admin'} - System Administrator
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
