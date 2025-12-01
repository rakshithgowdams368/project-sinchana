import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, Search, Clock, User as UserIcon, Settings, Wallet, LogOut, MapPin, X, Wind, Wrench, Zap, Home as HomeIcon, Paintbrush, Bug, Scissors, Droplet, Phone } from 'lucide-react';
import EditProfile from '../components/EditProfile';
import PaymentMethods from '../components/PaymentMethods';
import Notifications from '../components/Notifications';
import HelpSupport from '../components/HelpSupport';
import PrivacyPolicy from '../components/PrivacyPolicy';
import SearchServices from '../components/SearchServices';
import BookingModal from '../components/BookingModal';
import CancellationModal from '../components/CancellationModal';
import AddMoneyModal from '../components/AddMoneyModal';

export default function UserDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [settingsView, setSettingsView] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState<string>('booked');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'home';
    setActiveTab(tab);
  }, [searchParams]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/user_auth');
        return;
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!userProfile) {
        navigate('/user_auth');
        return;
      }

      if (!userProfile.onboarding_completed) {
        navigate('/user_onboarding');
        return;
      }

      setProfile(userProfile);

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesData) {
        setServices(servicesData);
      }

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          service:vendor_services(service_name, service_type, base_price, price_unit),
          vendor:vendor_profiles(business_name, phone, profile_image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsData) {
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hvac')) return <Wind size={24} className="text-blue-600" />;
    if (name.includes('plumb')) return <Wrench size={24} className="text-blue-600" />;
    if (name.includes('electric')) return <Zap size={24} className="text-blue-600" />;
    if (name.includes('handyman')) return <HomeIcon size={24} className="text-blue-600" />;
    if (name.includes('paint')) return <Paintbrush size={24} className="text-blue-600" />;
    if (name.includes('pest')) return <Bug size={24} className="text-blue-600" />;
    if (name.includes('garden')) return <Scissors size={24} className="text-blue-600" />;
    if (name.includes('clean')) return <Droplet size={24} className="text-blue-600" />;
    return <Home size={24} className="text-blue-600" />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="pb-20">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl mb-6">
              <h2 className="text-2xl font-bold mb-2">Welcome, {profile?.full_name || 'User'}!</h2>
              <p className="text-blue-100 mb-4">What service do you need today?</p>
              <button
                onClick={() => setShowAddMoneyModal(true)}
                className="w-full bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between hover:bg-white/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm text-blue-100">Wallet Balance</p>
                  <p className="text-3xl font-bold">₹{parseFloat(profile?.wallet_balance || '0').toFixed(2)}</p>
                  <p className="text-xs text-blue-200 mt-1">Tap to add money</p>
                </div>
                <Wallet size={32} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4">Popular Services</h3>
            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => (
                <Link
                  key={service.id}
                  to={`/category?type=${encodeURIComponent(service.name)}`}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                    {getServiceIcon(service.name)}
                  </div>
                  <h4 className="font-semibold text-gray-800">{service.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                </Link>
              ))}
            </div>
          </div>
        );

      case 'search':
        return (
          <SearchServices
            onBookService={(service) => {
              setSelectedService(service);
              setShowBookingModal(true);
            }}
          />
        );

      case 'bookings':
        const filteredBookings = bookings.filter(booking => {
          if (bookingFilter === 'booked') return booking.status === 'pending' || booking.status === 'confirmed';
          if (bookingFilter === 'completed') return booking.status === 'completed';
          if (bookingFilter === 'cancelled') return booking.status === 'cancelled';
          return true;
        });

        return (
          <div className="pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking History</h2>

            <div className="flex gap-2 mb-6 justify-center">
              <button
                onClick={() => setBookingFilter('booked')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  bookingFilter === 'booked'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Booked
              </button>
              <button
                onClick={() => setBookingFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  bookingFilter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setBookingFilter('cancelled')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  bookingFilter === 'cancelled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelled
              </button>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={40} className="text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">
                  No {bookingFilter} bookings
                </p>
                <p className="text-sm text-gray-500">Your service bookings will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                    <div className="flex items-start gap-4">
                      {booking.vendor?.profile_image_url ? (
                        <img
                          src={booking.vendor.profile_image_url}
                          alt={booking.vendor.business_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Home size={32} className="text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {booking.service?.service_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {booking.vendor?.business_name}
                        </p>
                        {booking.vendor?.phone && (
                          <p className="text-sm text-gray-600 mb-2 font-medium">
                            📞 {booking.vendor.phone}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock size={14} />
                          <span>{new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin size={14} />
                          <span>{booking.user_address}, {booking.user_pin_code}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            ₹{booking.total_amount}
                          </span>
                        </div>
                        {booking.payment_status && (
                          <div className="mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              booking.payment_status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : booking.payment_status === 'refunded'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              Payment: {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                            </span>
                          </div>
                        )}
                        {booking.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">Note: {booking.notes}</p>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && booking.vendor?.phone && (
                          <a
                            href={`tel:${booking.vendor.phone}`}
                            className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Phone size={16} />
                            Call Now
                          </a>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancellationModal(true);
                            }}
                            className="mt-3 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200 flex items-center justify-center gap-2"
                          >
                            <X size={16} />
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon size={40} className="text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{profile?.full_name}</h3>
                  <p className="text-gray-600">{profile?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Phone</label>
                  <p className="text-gray-800">{profile?.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Address</label>
                  <p className="text-gray-800">{profile?.address}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Pin Code</label>
                  <p className="text-gray-800">{profile?.pin_code}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Wallet Balance</label>
                  <button
                    onClick={() => setShowAddMoneyModal(true)}
                    className="text-left hover:bg-blue-50 p-2 -ml-2 rounded-lg transition-colors w-full"
                  >
                    <p className="text-2xl font-bold text-blue-600">₹{parseFloat(profile?.wallet_balance || '0').toFixed(2)}</p>
                    <p className="text-xs text-blue-500 mt-1">Tap to add money</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        if (settingsView === 'edit-profile') {
          return (
            <EditProfile
              userId={profile?.id}
              onBack={() => setSettingsView(null)}
              onUpdate={loadData}
            />
          );
        }

        if (settingsView === 'payment-methods') {
          return (
            <PaymentMethods
              userId={profile?.id}
              onBack={() => setSettingsView(null)}
            />
          );
        }

        if (settingsView === 'notifications') {
          return (
            <Notifications
              userId={profile?.id}
              onBack={() => setSettingsView(null)}
            />
          );
        }

        if (settingsView === 'help-support') {
          return <HelpSupport onBack={() => setSettingsView(null)} />;
        }

        if (settingsView === 'privacy-policy') {
          return <PrivacyPolicy onBack={() => setSettingsView(null)} />;
        }

        return (
          <div className="pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

            <div className="space-y-3">
              <button
                onClick={() => setSettingsView('edit-profile')}
                className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">Edit Profile</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>

              <button
                onClick={() => setSettingsView('payment-methods')}
                className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">Payment Methods</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>

              <button
                onClick={() => setSettingsView('notifications')}
                className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">Notifications</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>

              <button
                onClick={() => setSettingsView('help-support')}
                className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">Help & Support</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>

              <button
                onClick={() => setSettingsView('privacy-policy')}
                className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">Privacy Policy</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full bg-red-50 border border-red-200 rounded-xl shadow-sm p-4 text-left hover:bg-red-100 transition-colors mt-6"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={20} className="text-red-600" />
                  <span className="font-medium text-red-600">Sign Out</span>
                </div>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="p-4">
          {renderContent()}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-2xl mx-auto flex justify-around items-center py-2">
            <button
              onClick={() => handleTabChange('home')}
              className={`flex flex-col items-center py-2 px-4 ${
                activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">Home</span>
            </button>

            <button
              onClick={() => handleTabChange('search')}
              className={`flex flex-col items-center py-2 px-4 ${
                activeTab === 'search' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Search size={24} />
              <span className="text-xs mt-1">Search</span>
            </button>

            <button
              onClick={() => handleTabChange('bookings')}
              className={`flex flex-col items-center py-2 px-4 ${
                activeTab === 'bookings' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Clock size={24} />
              <span className="text-xs mt-1">Bookings</span>
            </button>

            <button
              onClick={() => handleTabChange('profile')}
              className={`flex flex-col items-center py-2 px-4 ${
                activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <UserIcon size={24} />
              <span className="text-xs mt-1">Profile</span>
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              className={`flex flex-col items-center py-2 px-4 ${
                activeTab === 'settings' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Settings size={24} />
              <span className="text-xs mt-1">Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {showBookingModal && selectedService && (
        <BookingModal
          service={selectedService}
          userId={profile?.id}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setSelectedService(null);
            loadData();
            handleTabChange('bookings');
          }}
        />
      )}

      {showCancellationModal && selectedBooking && (
        <CancellationModal
          booking={selectedBooking}
          onClose={() => {
            setShowCancellationModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={() => {
            setShowCancellationModal(false);
            setSelectedBooking(null);
            loadData();
          }}
        />
      )}

      {showAddMoneyModal && profile && (
        <AddMoneyModal
          userId={profile.id}
          currentBalance={parseFloat(profile.wallet_balance || '0')}
          onClose={() => setShowAddMoneyModal(false)}
          onSuccess={() => {
            setShowAddMoneyModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
