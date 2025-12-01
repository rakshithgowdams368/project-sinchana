import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Star, MapPin, ChevronLeft, SlidersHorizontal } from 'lucide-react';
import BookingModal from '../components/BookingModal';

interface VendorService {
  id: string;
  service_name: string;
  description: string;
  base_price: number;
  price_unit: string;
  location: string;
  pin_code: string;
  vendor_profiles: {
    business_name: string;
    first_name: string;
    last_name: string;
    rating: number;
    jobs_completed: number;
  };
}

export default function Category() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('type') || 'HVAC';
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<VendorService | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'jobs'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    fetchServices();
    getCurrentUser();
  }, [category]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);

      const { data: serviceCategory, error: categoryError } = await supabase
        .from('services')
        .select('id')
        .eq('name', category)
        .maybeSingle();

      if (categoryError) throw categoryError;

      if (!serviceCategory) {
        setServices([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vendor_services')
        .select(`
          *,
          vendor_profiles (
            business_name,
            first_name,
            last_name,
            rating,
            jobs_completed
          ),
          service_category:services!vendor_services_service_category_id_fkey (
            name,
            description
          )
        `)
        .eq('service_category_id', serviceCategory.id)
        .eq('is_active', true);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedServices = services
    .filter(service => {
      const meetsPrice = service.base_price >= minPrice && service.base_price <= maxPrice;
      const meetsRating = (service.vendor_profiles?.rating || 0) >= minRating;
      return meetsPrice && meetsRating;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.vendor_profiles?.rating || 0) - (a.vendor_profiles?.rating || 0);
      } else if (sortBy === 'price') {
        return a.base_price - b.base_price;
      } else {
        return (b.vendor_profiles?.jobs_completed || 0) - (a.vendor_profiles?.jobs_completed || 0);
      }
    });

  const handleBookService = (service: VendorService) => {
    if (!userId) {
      alert('Please login to book a service');
      window.location.href = '/user-auth';
      return;
    }
    setSelectedService(service);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <Link to="/user_dashboard" className="inline-flex items-center text-white hover:text-blue-100 mb-4">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">{category} Services</h1>
          <p className="text-blue-100 mt-2">
            Find trusted {category} professionals in your area
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filters
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden text-blue-600 text-sm"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'jobs')}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="rating">Highest Rating</option>
                    <option value="price">Lowest Price</option>
                    <option value="jobs">Most Jobs Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0">All Ratings</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(10000);
                    setMinRating(0);
                    setSortBy('rating');
                  }}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading services...</p>
              </div>
            ) : filteredAndSortedServices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-600 text-lg">No services found matching your criteria.</p>
                <button
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(10000);
                    setMinRating(0);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Showing {filteredAndSortedServices.length} {filteredAndSortedServices.length === 1 ? 'service' : 'services'}
                </div>
                {filteredAndSortedServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {service.service_name}
                              </h3>
                              <p className="text-gray-600 text-sm mt-1">
                                by {service.vendor_profiles?.business_name || `${service.vendor_profiles?.first_name} ${service.vendor_profiles?.last_name}`}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {service.description}
                          </p>

                          <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                              <span className="text-sm">{service.location}</span>
                            </div>
                            {service.vendor_profiles?.rating > 0 && (
                              <div className="flex items-center text-gray-600">
                                <Star className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm font-semibold">
                                  {service.vendor_profiles.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {service.vendor_profiles?.jobs_completed > 0 && (
                              <div className="text-sm text-gray-600">
                                {service.vendor_profiles.jobs_completed} jobs completed
                              </div>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{service.base_price}
                            </span>
                            <span className="text-gray-600 text-sm">
                              {service.price_unit}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookService(service)}
                          className="md:ml-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showBookingModal && selectedService && userId && (
        <BookingModal
          service={selectedService}
          userId={userId}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setSelectedService(null);
            alert('Booking confirmed! Check your dashboard for details.');
          }}
        />
      )}
    </div>
  );
}
