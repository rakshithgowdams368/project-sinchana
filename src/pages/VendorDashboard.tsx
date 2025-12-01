import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Briefcase, LogOut, CheckCircle, Users, DollarSign, Calendar, Package, Wallet, UserCircle, ClipboardList } from 'lucide-react';
import VendorServices from '../components/VendorServices';
import VendorOrders from '../components/VendorOrders';
import VendorOrdersAll from '../components/VendorOrdersAll';
import VendorPayout from '../components/VendorPayout';
import VendorProfileEdit from '../components/VendorProfileEdit';

export default function VendorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/vendor_auth');
        return;
      }

      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!vendorProfile) {
        navigate('/vendor_auth');
        return;
      }

      if (!vendorProfile.is_approved) {
        if (vendorProfile.onboarding_step < 4) {
          navigate('/vendor_onboarding');
        } else {
          navigate('/pending');
        }
        return;
      }

      setProfile(vendorProfile);

      if (vendorProfile.service_id) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('*')
          .eq('id', vendorProfile.service_id)
          .maybeSingle();

        if (serviceData) {
          setService(serviceData);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Briefcase size={24} className="text-green-600" />
              <span className="text-xl font-bold text-gray-800">Vendor Dashboard</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome, {profile?.first_name} {profile?.last_name}!
            </h1>
            {profile?.is_approved ? (
              <CheckCircle size={24} className="text-green-600" />
            ) : (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                Pending Approval
              </span>
            )}
          </div>
          <p className="text-gray-600">
            {profile?.is_approved
              ? 'Your vendor account is active and ready to receive service requests'
              : 'Your account is pending admin approval'}
          </p>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ClipboardList size={18} />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'services'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Package size={18} />
            My Services
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'payouts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Wallet size={18} />
            Payouts
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserCircle size={18} />
            Profile
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar size={24} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active Bookings</h3>
            <p className="text-3xl font-bold text-gray-800">0</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-800">0</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-amber-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Earnings</h3>
            <p className="text-3xl font-bold text-gray-800">₹0</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 font-medium">Name:</span>
                <p className="text-gray-800 mt-1">
                  {profile?.first_name} {profile?.last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Email:</span>
                <p className="text-gray-800 mt-1">{profile?.email}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Phone:</span>
                <p className="text-gray-800 mt-1">{profile?.phone}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Service:</span>
                <p className="text-gray-800 mt-1">{service?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Location:</span>
                <p className="text-gray-800 mt-1">
                  {profile?.location}, {profile?.pin_code}
                </p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Service Area:</span>
                <p className="text-gray-800 mt-1">
                  {profile?.service_location}, {profile?.service_pin_code}
                </p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Bank Name:</span>
                <p className="text-gray-800 mt-1">{profile?.bank_name || 'N/A'}</p>
              </div>
              <div className="pt-4">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Verified Vendor
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <VendorOrders vendorId={profile.id} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
        </>
        ) : activeTab === 'orders' ? (
          <VendorOrdersAll vendorId={profile?.id} />
        ) : activeTab === 'services' ? (
          <VendorServices vendorId={profile?.id} vendorProfile={profile} />
        ) : activeTab === 'payouts' ? (
          <VendorPayout
            vendorId={profile?.id}
            bankDetails={{
              account_number: profile?.bank_account_number,
              ifsc_code: profile?.bank_ifsc_code,
              account_holder_name: profile?.bank_account_holder_name,
              bank_name: profile?.bank_name
            }}
          />
        ) : activeTab === 'profile' ? (
          <VendorProfileEdit
            vendorId={profile?.id}
            currentProfile={profile}
            onUpdate={loadDashboard}
          />
        ) : null}
      </div>
    </div>
  );
}
