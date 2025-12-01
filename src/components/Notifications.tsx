import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface NotificationsProps {
  userId: string;
  onBack: () => void;
}

export default function Notifications({ userId, onBack }: NotificationsProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    booking_updates: true,
    promotional_offers: false,
    service_reminders: true,
  });

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleToggle = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: preferences })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Notification preferences saved successfully!
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Communication Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <ToggleSwitch
                enabled={preferences.email_notifications}
                onChange={() => handleToggle('email_notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">SMS Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via SMS</p>
              </div>
              <ToggleSwitch
                enabled={preferences.sms_notifications}
                onChange={() => handleToggle('sms_notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive mobile push notifications</p>
              </div>
              <ToggleSwitch
                enabled={preferences.push_notifications}
                onChange={() => handleToggle('push_notifications')}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Booking Updates</p>
                <p className="text-sm text-gray-600">Get notified about booking status changes</p>
              </div>
              <ToggleSwitch
                enabled={preferences.booking_updates}
                onChange={() => handleToggle('booking_updates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Service Reminders</p>
                <p className="text-sm text-gray-600">Reminders for scheduled services</p>
              </div>
              <ToggleSwitch
                enabled={preferences.service_reminders}
                onChange={() => handleToggle('service_reminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Promotional Offers</p>
                <p className="text-sm text-gray-600">Receive special offers and discounts</p>
              </div>
              <ToggleSwitch
                enabled={preferences.promotional_offers}
                onChange={() => handleToggle('promotional_offers')}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
