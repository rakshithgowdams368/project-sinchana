import { useState } from 'react';
import { ArrowLeft, MessageCircle, Phone, Mail, Send, HelpCircle } from 'lucide-react';

interface HelpSupportProps {
  onBack: () => void;
}

export default function HelpSupport({ onBack }: HelpSupportProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      question: 'How do I book a service?',
      answer: 'Go to the Search tab, select a service, choose your preferred time slot, and confirm your booking. Payment will be deducted from your wallet.',
    },
    {
      question: 'How do I add money to my wallet?',
      answer: 'Go to your Profile, tap on the wallet balance, and select the amount you want to add. Complete the payment through our secure gateway.',
    },
    {
      question: 'Can I cancel a booking?',
      answer: 'Yes, you can cancel a booking from the Bookings tab. Cancellation charges may apply based on the time of cancellation.',
    },
    {
      question: 'How do I update my profile information?',
      answer: 'Go to Settings > Edit Profile to update your name, phone number, address, and other details.',
    },
    {
      question: 'What payment methods are supported?',
      answer: 'We support credit/debit cards, UPI, net banking, and wallet payments. You can manage your payment methods in Settings.',
    },
    {
      question: 'How do I contact a service provider?',
      answer: 'Once your booking is confirmed, you will receive the service provider\'s contact details via SMS and email.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setContactForm({ subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Help & Support</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'faq'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          FAQs
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'contact'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Contact Us
        </button>
      </div>

      {activeTab === 'faq' ? (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <summary className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors font-medium text-gray-800 flex items-center gap-3">
                <HelpCircle size={20} className="text-blue-600 flex-shrink-0" />
                {faq.question}
              </summary>
              <div className="px-4 py-3 border-t border-gray-100 text-gray-600 bg-gray-50">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <a
              href="tel:+911234567890"
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Phone size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Phone Support</p>
                  <p className="text-sm text-gray-600">+91 123 456 7890</p>
                  <p className="text-xs text-gray-500">Available 24/7</p>
                </div>
              </div>
            </a>

            <a
              href="mailto:support@example.com"
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Email Support</p>
                  <p className="text-sm text-gray-600">support@example.com</p>
                  <p className="text-xs text-gray-500">We'll reply within 24 hours</p>
                </div>
              </div>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Send us a message</h3>
            </div>

            {submitted && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                Thank you for contacting us! We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                  placeholder="How can we help?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  placeholder="Describe your issue or question..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
