import { ArrowLeft, Shield } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="bg-blue-100 p-3 rounded-full">
            <Shield size={32} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Your Privacy Matters</h3>
            <p className="text-sm text-gray-600">Last updated: November 2024</p>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">1. Information We Collect</h4>
          <p className="text-gray-600 mb-3">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Personal information (name, email, phone number)</li>
            <li>Profile information (address, preferences)</li>
            <li>Payment information (stored securely)</li>
            <li>Service booking history</li>
            <li>Communication preferences</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">2. How We Use Your Information</h4>
          <p className="text-gray-600 mb-3">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Provide and improve our services</li>
            <li>Process your bookings and payments</li>
            <li>Send you service updates and notifications</li>
            <li>Respond to your requests and support needs</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">3. Information Sharing</h4>
          <p className="text-gray-600 mb-3">
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Service providers to fulfill your bookings</li>
            <li>Payment processors for secure transactions</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">4. Data Security</h4>
          <p className="text-gray-600">
            We implement industry-standard security measures to protect your personal information.
            This includes encryption, secure servers, and regular security audits. However, no method
            of transmission over the internet is 100% secure.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">5. Your Rights</h4>
          <p className="text-gray-600 mb-3">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
            <li>Access your personal information</li>
            <li>Update or correct your information</li>
            <li>Delete your account and data</li>
            <li>Opt-out of marketing communications</li>
            <li>Request a copy of your data</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">6. Cookies and Tracking</h4>
          <p className="text-gray-600">
            We use cookies and similar tracking technologies to improve your experience on our
            platform. You can control cookie preferences through your browser settings.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">7. Children's Privacy</h4>
          <p className="text-gray-600">
            Our services are not intended for children under 18. We do not knowingly collect
            information from children under 18.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">8. Changes to This Policy</h4>
          <p className="text-gray-600">
            We may update this privacy policy from time to time. We will notify you of any changes
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">9. Contact Us</h4>
          <p className="text-gray-600">
            If you have any questions about this privacy policy, please contact us at:
          </p>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-800 font-medium">Email: privacy@example.com</p>
            <p className="text-gray-800 font-medium">Phone: +91 123 456 7890</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            By using our services, you agree to this privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
