import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, Star, MapPin, Calendar, X } from 'lucide-react';

interface SearchServicesProps {
  onBookService: (service: any) => void;
}

export default function SearchServices({ onBookService }: SearchServicesProps) {
  const [services, setServices] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [vendorCount, setVendorCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    serviceType: 'All Services',
    minPrice: '',
    maxPrice: '',
    pinCode: '',
    minRating: 0,
    sortBy: 'rating',
  });

  useEffect(() => {
    loadServiceCategories();
    loadServices();
  }, []);

  const loadServiceCategories = async () => {
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (data) {
        setServiceCategories([{ id: 'all', name: 'All Services' }, ...data]);
      }
    } catch (error) {
      console.error('Error loading service categories:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, services]);

  const loadServices = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vendor_services')
        .select(`
          *,
          vendor:vendor_profiles(
            id,
            business_name,
            rating,
            jobs_completed,
            profile_image_url
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      const servicesWithVendor = data?.filter(s => s.vendor) || [];
      setServices(servicesWithVendor);
      setFilteredServices(servicesWithVendor);

      const uniqueVendors = new Set(servicesWithVendor.map(s => s.vendor_id));
      setVendorCount(uniqueVendors.size);

      const { count: totalVendors } = await supabase
        .from('vendor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      if (totalVendors !== null) {
        setVendorCount(totalVendors);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...services];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.service_name?.toLowerCase().includes(query) ||
          s.service_type?.toLowerCase().includes(query) ||
          s.vendor?.business_name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.location?.toLowerCase().includes(query)
      );
    }

    if (filters.serviceType !== 'All Services') {
      filtered = filtered.filter((s) => s.service_type === filters.serviceType);
    }

    if (filters.pinCode) {
      filtered = filtered.filter((s) => s.pin_code?.includes(filters.pinCode));
    }

    if (filters.minPrice) {
      filtered = filtered.filter((s) => s.base_price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((s) => s.base_price <= parseFloat(filters.maxPrice));
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter((s) => (s.vendor?.rating || 0) >= filters.minRating);
    }

    if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => (b.vendor?.rating || 0) - (a.vendor?.rating || 0));
    } else if (filters.sortBy === 'price_low') {
      filtered.sort((a, b) => a.base_price - b.base_price);
    } else if (filters.sortBy === 'price_high') {
      filtered.sort((a, b) => b.base_price - a.base_price);
    } else if (filters.sortBy === 'jobs') {
      filtered.sort((a, b) => (b.vendor?.jobs_completed || 0) - (a.vendor?.jobs_completed || 0));
    }

    setFilteredServices(filtered);
  };

  const resetFilters = () => {
    setFilters({
      serviceType: 'All Services',
      minPrice: '',
      maxPrice: '',
      pinCode: '',
      minRating: 0,
      sortBy: 'rating',
    });
    setSearchQuery('');
  };

  return (
    <div className="pb-20">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services, vendors, location..."
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
              showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Filters</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Reset All
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {serviceCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                placeholder="₹0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                placeholder="₹10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pin Code
            </label>
            <input
              type="text"
              value={filters.pinCode}
              onChange={(e) => setFilters({ ...filters, pinCode: e.target.value })}
              placeholder="Enter pin code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilters({ ...filters, minRating: rating })}
                  className={`flex-1 py-2 rounded-lg border transition-colors ${
                    filters.minRating === rating
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                  }`}
                >
                  {rating === 0 ? 'All' : `${rating}+`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">Highest Rating</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="jobs">Most Jobs Completed</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Available Services</p>
            <p className="text-2xl font-bold text-blue-600">{filteredServices.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Registered Vendors</p>
            <p className="text-2xl font-bold text-blue-600">{vendorCount}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-2">No services found</p>
          <p className="text-sm text-gray-500 mb-4">Try adjusting your filters</p>
          {vendorCount === 0 ? (
            <p className="text-xs text-gray-400">No vendors have registered yet. Services will appear here once vendors add their services.</p>
          ) : (
            <p className="text-xs text-gray-400">{vendorCount} vendors registered but no services match your criteria</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start gap-4 mb-3">
                  {service.vendor?.profile_image_url ? (
                    <img
                      src={service.vendor.profile_image_url}
                      alt={service.vendor.business_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {service.vendor?.business_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">{service.service_name}</h3>
                    <p className="text-sm text-gray-600">{service.vendor?.business_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          {service.vendor?.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {service.vendor?.jobs_completed || 0} jobs
                      </span>
                    </div>
                  </div>
                </div>

                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}

                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{service.location || 'Location not specified'}</span>
                  </div>
                  {service.pin_code && (
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {service.pin_code}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{service.base_price}
                    </p>
                    <p className="text-xs text-gray-500">{service.price_unit}</p>
                  </div>
                  <button
                    onClick={() => onBookService(service)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Calendar size={18} />
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
