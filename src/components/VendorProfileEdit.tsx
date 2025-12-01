import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, Building, CreditCard, Upload, Save } from 'lucide-react';

interface VendorProfileEditProps {
  vendorId: string;
  currentProfile: any;
  onUpdate: () => void;
}

export default function VendorProfileEdit({ vendorId, currentProfile, onUpdate }: VendorProfileEditProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    businessPinCode: '',
    serviceArea: '',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
  });
  const [documents, setDocuments] = useState({
    profileImage: null as File | null,
    idProof: null as File | null,
    addressProof: null as File | null,
  });

  useEffect(() => {
    if (currentProfile) {
      setFormData({
        firstName: currentProfile.first_name || '',
        lastName: currentProfile.last_name || '',
        phone: currentProfile.phone || '',
        businessName: currentProfile.business_name || '',
        businessAddress: currentProfile.business_address || '',
        businessPinCode: currentProfile.business_pin_code || '',
        serviceArea: currentProfile.service_area || '',
        bankAccountNumber: currentProfile.bank_account_number || '',
        ifscCode: currentProfile.bank_ifsc_code || '',
        accountHolderName: currentProfile.bank_account_holder_name || '',
        bankName: currentProfile.bank_name || '',
      });
    }
  }, [currentProfile]);

  const handleFileChange = (field: keyof typeof documents, file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    setDocuments({ ...documents, [field]: file });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        business_name: formData.businessName,
        business_address: formData.businessAddress,
        business_pin_code: formData.businessPinCode,
        service_area: formData.serviceArea,
        bank_account_number: formData.bankAccountNumber,
        bank_ifsc_code: formData.ifscCode,
        bank_account_holder_name: formData.accountHolderName,
        bank_name: formData.bankName,
      };

      if (documents.profileImage) {
        setUploading(true);
        const timestamp = Date.now();
        const profileImageUrl = await uploadFile(
          documents.profileImage,
          'vendor-profiles',
          `${vendorId}/profile-${timestamp}.${documents.profileImage.name.split('.').pop()}`
        );
        updates.profile_image_url = profileImageUrl;
      }

      if (documents.idProof) {
        setUploading(true);
        const timestamp = Date.now();
        const idProofUrl = await uploadFile(
          documents.idProof,
          'vendor-documents',
          `${vendorId}/id-proof-${timestamp}.${documents.idProof.name.split('.').pop()}`
        );
        updates.id_proof_url = idProofUrl;
      }

      if (documents.addressProof) {
        setUploading(true);
        const timestamp = Date.now();
        const addressProofUrl = await uploadFile(
          documents.addressProof,
          'vendor-documents',
          `${vendorId}/address-proof-${timestamp}.${documents.addressProof.name.split('.').pop()}`
        );
        updates.address_proof_url = addressProofUrl;
      }

      const { error } = await supabase
        .from('vendor_profiles')
        .update(updates)
        .eq('id', vendorId);

      if (error) throw error;

      alert('Profile updated successfully!');
      setDocuments({
        profileImage: null,
        idProof: null,
        addressProof: null,
      });
      onUpdate();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building size={16} className="inline mr-1" />
              Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin size={16} className="inline mr-1" />
            Business Address
          </label>
          <textarea
            value={formData.businessAddress}
            onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN Code
            </label>
            <input
              type="text"
              value={formData.businessPinCode}
              onChange={(e) => setFormData({ ...formData, businessPinCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Area
            </label>
            <input
              type="text"
              value={formData.serviceArea}
              onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
              placeholder="e.g., 10km radius"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard size={16} className="inline mr-1" />
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Documents</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload size={16} className="inline mr-1" />
                Profile Image
              </label>
              {currentProfile?.profile_image_url && (
                <div className="mb-2">
                  <img
                    src={currentProfile.profile_image_url}
                    alt="Current profile"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current profile image</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('profileImage', e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload size={16} className="inline mr-1" />
                ID Proof
              </label>
              {currentProfile?.id_proof_url && (
                <p className="text-xs text-green-600 mb-2">Currently uploaded</p>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange('idProof', e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Aadhar, PAN, or Driving License (Max 5MB)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload size={16} className="inline mr-1" />
                Address Proof
              </label>
              {currentProfile?.address_proof_url && (
                <p className="text-xs text-green-600 mb-2">Currently uploaded</p>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange('addressProof', e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Utility bill or bank statement (Max 5MB)</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
