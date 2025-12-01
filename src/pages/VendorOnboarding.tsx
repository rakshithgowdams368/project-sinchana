import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Briefcase, LogOut, Upload, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
}

export default function VendorOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [vendorId, setVendorId] = useState('');
  const navigate = useNavigate();

  const [step1Data, setStep1Data] = useState({
    first_name: '',
    last_name: '',
    location: '',
    pin_code: '',
    service_id: '',
    profile_image: null as File | null,
  });

  const [step2Data, setStep2Data] = useState({
    aadhar_card: null as File | null,
    pan_card: null as File | null,
    gst_certificate: null as File | null,
    service_location: '',
    service_pin_code: '',
  });

  const [step3Data, setStep3Data] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor_auth');
        return;
      }
      setVendorId(user.id);

      const { data: profile } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        navigate('/vendor_auth');
        return;
      }

      if (profile.approval_status === 'pending' && profile.onboarding_step === 4) {
        navigate('/pending');
        return;
      }

      if (profile.is_approved) {
        navigate('/vendor_dashboard');
        return;
      }

      setCurrentStep(profile.onboarding_step || 1);

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesData) {
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let profileImageUrl = '';

      if (step1Data.profile_image) {
        const imagePath = `${vendorId}/profile.${step1Data.profile_image.name.split('.').pop()}`;
        profileImageUrl = await uploadFile(step1Data.profile_image, 'vendor-images', imagePath);
      }

      const { error: updateError } = await supabase
        .from('vendor_profiles')
        .update({
          first_name: step1Data.first_name,
          last_name: step1Data.last_name,
          location: step1Data.location,
          pin_code: step1Data.pin_code,
          service_id: step1Data.service_id,
          profile_image_url: profileImageUrl || null,
          onboarding_step: 2,
        })
        .eq('id', vendorId);

      if (updateError) throw updateError;

      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let aadharUrl = '';
      let panUrl = '';
      let gstUrl = '';

      if (step2Data.aadhar_card) {
        const aadharPath = `${vendorId}/aadhar.${step2Data.aadhar_card.name.split('.').pop()}`;
        aadharUrl = await uploadFile(step2Data.aadhar_card, 'vendor-documents', aadharPath);
      }

      if (step2Data.pan_card) {
        const panPath = `${vendorId}/pan.${step2Data.pan_card.name.split('.').pop()}`;
        panUrl = await uploadFile(step2Data.pan_card, 'vendor-documents', panPath);
      }

      if (step2Data.gst_certificate) {
        const gstPath = `${vendorId}/gst.${step2Data.gst_certificate.name.split('.').pop()}`;
        gstUrl = await uploadFile(step2Data.gst_certificate, 'vendor-documents', gstPath);
      }

      const { error: updateError } = await supabase
        .from('vendor_profiles')
        .update({
          aadhar_card_url: aadharUrl || null,
          pan_card_url: panUrl || null,
          gst_certificate_url: gstUrl || null,
          service_location: step2Data.service_location,
          service_pin_code: step2Data.service_pin_code,
          onboarding_step: 3,
        })
        .eq('id', vendorId);

      if (updateError) throw updateError;

      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('vendor_profiles')
        .update({
          bank_name: step3Data.bank_name,
          bank_account_number: step3Data.bank_account_number,
          bank_ifsc_code: step3Data.bank_ifsc_code,
          bank_account_holder_name: step3Data.bank_account_holder_name,
          onboarding_step: 4,
          approval_status: 'pending',
        })
        .eq('id', vendorId);

      if (updateError) throw updateError;

      navigate('/pending');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Briefcase size={24} className="text-green-600" />
              <span className="text-xl font-bold text-gray-800">Vendor Onboarding</span>
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
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? <CheckCircle size={20} /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      currentStep > step ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Step 1: Personal Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={step1Data.first_name}
                    onChange={(e) =>
                      setStep1Data({ ...step1Data, first_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={step1Data.last_name}
                    onChange={(e) =>
                      setStep1Data({ ...step1Data, last_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={step1Data.location}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pin Code
                </label>
                <input
                  type="text"
                  value={step1Data.pin_code}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, pin_code: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Service
                </label>
                <select
                  value={step1Data.service_id}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, service_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a service...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload size={20} className="text-gray-600" />
                    <span className="text-gray-700">
                      {step1Data.profile_image
                        ? step1Data.profile_image.name
                        : 'Choose file'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          profile_image: e.target.files?.[0] || null,
                        })
                      }
                      className="hidden"
                      required
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Next Step'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Step 2: Documents & Service Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar Card
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={20} className="text-gray-600" />
                  <span className="text-gray-700">
                    {step2Data.aadhar_card
                      ? step2Data.aadhar_card.name
                      : 'Upload Aadhar Card'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setStep2Data({
                        ...step2Data,
                        aadhar_card: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Card
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={20} className="text-gray-600" />
                  <span className="text-gray-700">
                    {step2Data.pan_card ? step2Data.pan_card.name : 'Upload PAN Card'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setStep2Data({
                        ...step2Data,
                        pan_card: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Certificate
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={20} className="text-gray-600" />
                  <span className="text-gray-700">
                    {step2Data.gst_certificate
                      ? step2Data.gst_certificate.name
                      : 'Upload GST Certificate'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setStep2Data({
                        ...step2Data,
                        gst_certificate: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Location
                </label>
                <input
                  type="text"
                  value={step2Data.service_location}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, service_location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Pin Code
                </label>
                <input
                  type="text"
                  value={step2Data.service_pin_code}
                  onChange={(e) =>
                    setStep2Data({ ...step2Data, service_pin_code: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Next Step'}
                  <ArrowRight size={20} />
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Step 3: Banking Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={step3Data.bank_name}
                  onChange={(e) =>
                    setStep3Data({ ...step3Data, bank_name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., State Bank of India"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={step3Data.bank_account_holder_name}
                  onChange={(e) =>
                    setStep3Data({
                      ...step3Data,
                      bank_account_holder_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={step3Data.bank_account_number}
                  onChange={(e) =>
                    setStep3Data({
                      ...step3Data,
                      bank_account_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={step3Data.bank_ifsc_code}
                  onChange={(e) =>
                    setStep3Data({ ...step3Data, bank_ifsc_code: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  pattern="[A-Z]{4}0[A-Z0-9]{6}"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                  <CheckCircle size={20} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
