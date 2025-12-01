import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, Upload, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function UserOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  const [step1Data, setStep1Data] = useState({
    profile_image: null as File | null,
    address: '',
    pin_code: '',
  });

  const [step2Data, setStep2Data] = useState({
    aadhar_card: null as File | null,
    pan_card: null as File | null,
    signature: null as File | null,
  });

  const [step3Data, setStep3Data] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: '',
    upi_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/user_auth');
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        navigate('/user_auth');
        return;
      }

      if (profile.onboarding_completed) {
        navigate('/user_dashboard');
        return;
      }

      setCurrentStep(profile.onboarding_step || 1);
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
        const imagePath = `${userId}/profile.${step1Data.profile_image.name.split('.').pop()}`;
        profileImageUrl = await uploadFile(step1Data.profile_image, 'user-images', imagePath);
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          profile_image_url: profileImageUrl || null,
          address: step1Data.address,
          pin_code: step1Data.pin_code,
          onboarding_step: 2,
        })
        .eq('id', userId);

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
      let signatureUrl = '';

      if (step2Data.aadhar_card) {
        const aadharPath = `${userId}/aadhar.${step2Data.aadhar_card.name.split('.').pop()}`;
        aadharUrl = await uploadFile(step2Data.aadhar_card, 'user-documents', aadharPath);
      }

      if (step2Data.pan_card) {
        const panPath = `${userId}/pan.${step2Data.pan_card.name.split('.').pop()}`;
        panUrl = await uploadFile(step2Data.pan_card, 'user-documents', panPath);
      }

      if (step2Data.signature) {
        const signaturePath = `${userId}/signature.${step2Data.signature.name.split('.').pop()}`;
        signatureUrl = await uploadFile(step2Data.signature, 'user-documents', signaturePath);
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          aadhar_card_url: aadharUrl || null,
          pan_card_url: panUrl || null,
          signature_url: signatureUrl || null,
          onboarding_step: 3,
        })
        .eq('id', userId);

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
        .from('user_profiles')
        .update({
          bank_name: step3Data.bank_name,
          bank_account_number: step3Data.bank_account_number,
          bank_ifsc_code: step3Data.bank_ifsc_code,
          bank_account_holder_name: step3Data.bank_account_holder_name,
          upi_id: step3Data.upi_id,
          onboarding_step: 4,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      navigate('/payment');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User size={24} className="text-blue-600" />
              <span className="text-xl font-bold text-gray-800">User Onboarding</span>
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
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? <CheckCircle size={20} /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
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
                Step 1: Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={20} className="text-gray-600" />
                  <span className="text-gray-700">
                    {step1Data.profile_image
                      ? step1Data.profile_image.name
                      : 'Choose profile image'}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={step1Data.address}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, address: e.target.value })
                  }
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
                  value={step1Data.pin_code}
                  onChange={(e) =>
                    setStep1Data({ ...step1Data, pin_code: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Next Step'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Step 2: Document Upload
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
                  Signature (PNG)
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload size={20} className="text-gray-600" />
                  <span className="text-gray-700">
                    {step2Data.signature
                      ? step2Data.signature.name
                      : 'Upload Signature'}
                  </span>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) =>
                      setStep2Data({
                        ...step2Data,
                        signature: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                    required
                  />
                </label>
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
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  pattern="[A-Z]{4}0[A-Z0-9]{6}"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={step3Data.upi_id}
                  onChange={(e) =>
                    setStep3Data({ ...step3Data, upi_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@upi"
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
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Next: Wallet Recharge'}
                  <ArrowRight size={20} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
