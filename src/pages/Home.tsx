import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Star, CheckCircle, Clock, Home as HomeIcon, Wrench, Zap, Wind, Paintbrush, Bug, Scissors, Droplet } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('name');

    if (data) {
      setServices(data);
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('hvac')) return <Wind className="w-8 h-8 text-blue-600" />;
    if (name.includes('plumb')) return <Wrench className="w-8 h-8 text-blue-600" />;
    if (name.includes('electric')) return <Zap className="w-8 h-8 text-blue-600" />;
    if (name.includes('handyman') || name.includes('carpentry')) return <HomeIcon className="w-8 h-8 text-blue-600" />;
    if (name.includes('paint')) return <Paintbrush className="w-8 h-8 text-blue-600" />;
    if (name.includes('pest')) return <Bug className="w-8 h-8 text-blue-600" />;
    if (name.includes('garden')) return <Scissors className="w-8 h-8 text-blue-600" />;
    if (name.includes('clean')) return <Droplet className="w-8 h-8 text-blue-600" />;
    return <HomeIcon className="w-8 h-8 text-blue-600" />;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">HomeSerpro</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Services</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</a>
              <a href="#quote" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors">Get Quote</a>
            </div>

            {/* Phone Number */}
            <div className="hidden lg:flex items-center space-x-2 text-blue-600">
              <Phone className="w-5 h-5" />
              <span className="font-bold text-lg">(555) 123-4567</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 border-t pt-4">
              <a href="#services" className="block text-gray-700 hover:text-blue-600 font-medium">Services</a>
              <a href="#about" className="block text-gray-700 hover:text-blue-600 font-medium">About</a>
              <a href="#contact" className="block text-gray-700 hover:text-blue-600 font-medium">Contact</a>
              <a href="#quote" className="block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold text-center">Get Quote</a>
              <div className="flex items-center space-x-2 text-blue-600 pt-2">
                <Phone className="w-5 h-5" />
                <span className="font-bold">(555) 123-4567</span>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Professional Home Services You Can Trust
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Expert plumbing, electrical, HVAC, and handyman services for your home.
                Licensed professionals, upfront pricing, and 100% satisfaction guaranteed.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/user_auth"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-bold text-lg transition-all shadow-lg hover:shadow-xl text-center"
                >
                  User Login
                </Link>
                <Link
                  to="/vendor_auth"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 font-bold text-lg transition-all border-2 border-blue-600 text-center"
                >
                  Vendor Login
                </Link>
                <Link
                  to="/admin_auth"
                  className="bg-gray-800 text-white px-8 py-4 rounded-lg hover:bg-gray-900 font-bold text-lg transition-all shadow-lg hover:shadow-xl text-center"
                >
                  Admin Login
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">25+</div>
                  <div className="text-sm text-gray-600 mt-1">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-3xl font-bold text-blue-600">4.9</span>
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Customer Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">10K+</div>
                  <div className="text-sm text-gray-600 mt-1">Jobs Completed</div>
                </div>
              </div>

              {/* Certifications */}
              <div className="flex flex-wrap gap-3 pt-4">
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">✓ Licensed & Insured</span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">✓ 24/7 Emergency Service</span>
                <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">✓ BBB Accredited</span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Professional home service"
                  className="rounded-lg w-full h-[400px] object-cover shadow-xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-2xl">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">₹0</div>
                    <div className="text-sm text-gray-600 font-semibold">Service Call Fee</div>
                    <div className="text-xs text-gray-500 mt-1">With Completed Repair</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Services</h2>
            <p className="text-xl text-gray-600">Choose from our most requested home services</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 8).map((service) => (
              <Link
                key={service.id}
                to={`/category?type=${encodeURIComponent(service.name)}`}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all border border-gray-200 hover:border-blue-300 group"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  {getServiceIcon(service.name)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">HomeSerpro</span>
              </div>
              <p className="text-sm leading-relaxed">
                Your trusted partner for all home service needs. Professional, reliable, and affordable solutions since 1998.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Our Services</a></li>
                <li><a href="#about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
                <li><a href="#quote" className="hover:text-blue-400 transition-colors">Get a Quote</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <span className="text-sm">123 Service Street<br />Suite 100<br />Los Angeles, CA 90001</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-semibold">(555) 123-4567</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm">info@homeserpro.com</span>
                </li>
              </ul>
            </div>

            {/* Service Areas & Hours */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Service Areas</h3>
              <p className="text-sm mb-4">
                Los Angeles County<br />
                Orange County<br />
                Ventura County<br />
                San Bernardino County
              </p>
              <div className="flex items-start space-x-3 mt-6">
                <Clock className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-white mb-1">Business Hours</div>
                  <div>Mon-Fri: 7am - 8pm</div>
                  <div>Sat-Sun: 8am - 6pm</div>
                  <div className="text-blue-400 font-semibold mt-1">24/7 Emergency Service</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-400">
                © 2024 HomeSerpro. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Sitemap</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
