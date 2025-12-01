import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, Briefcase, LogOut, RefreshCw } from 'lucide-react';

export default function Pending() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();

    const checkApprovalStatus = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => clearInterval(checkApprovalStatus);
  }, []);

  const loadProfile = async () => {
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

      if (vendorProfile.is_approved) {
        navigate('/vendor_dashboard');
        return;
      }

      if (vendorProfile.approval_status === 'rejected') {
        navigate('/vendor_onboarding');
        return;
      }

      setProfile(vendorProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('is_approved, approval_status')
        .eq('id', user.id)
        .maybeSingle();

      if (vendorProfile?.is_approved) {
        navigate('/vendor_dashboard');
      } else if (vendorProfile?.approval_status === 'rejected') {
        navigate('/vendor_onboarding');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Briefcase size={24} className="text-amber-600" />
              <span className="text-xl font-bold text-gray-800">Vendor Portal</span>
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-amber-100 p-4 rounded-full animate-pulse">
              <Clock size={48} className="text-amber-600" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">
            Application Under Review
          </h1>

          <p className="text-xl text-center text-gray-600 mb-12">
            Your vendor application has been submitted successfully
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-amber-600" />
              Status: Pending Approval
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your application is currently being reviewed by our admin team. This process typically takes 24-48 hours.
              We will verify all the documents and information you provided.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              What Happens Next?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <span className="text-gray-700">
                  Our team will verify your identity documents (Aadhar, PAN, GST)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <span className="text-gray-700">
                  We will validate your banking details and service information
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <span className="text-gray-700">
                  Once approved, you will get instant access to your vendor dashboard
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <span className="text-gray-700">
                  You can start accepting service requests from customers
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-gray-700">
              If you have any questions or concerns, please contact our support team at{' '}
              <a href="mailto:vendor-support@homeserpro.com" className="text-blue-600 hover:underline">
                vendor-support@homeserpro.com
              </a>
            </p>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
