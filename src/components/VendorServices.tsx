import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, X, MapPin } from 'lucide-react';

interface VendorServicesProps {
  vendorId: string;
  vendorProfile: any;
}


export default function VendorServices({ vendorId, vendorProfile }: VendorServicesProps) {
  const [services, setServices] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    service_category_id: '',
    service_name: '',
    description: '',
    base_price: '',
    price_unit: 'per job',
    location: '',
    pin_code: '',
  });

  useEffect(() => {
    loadServiceCategories();
    loadServices();
  }, [vendorId]);

  const loadServiceCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServiceCategories(data || []);
    } catch (error) {
      console.error('Error loading service categories:', error);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_services')
        .select(`
          *,
          service_category:services!vendor_services_service_category_id_fkey (
            id,
            name,
            description
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorProfile?.is_approved) {
      alert('Your vendor account must be approved by admin before you can add services.');
      return;
    }

    try {
      if (!formData.service_category_id) {
        alert('Please select a service category');
        return;
      }

      const selectedCategory = serviceCategories.find(c => c.id === formData.service_category_id);
      const serviceData = {
        vendor_id: vendorId,
        service_category_id: formData.service_category_id,
        service_type: selectedCategory?.name || '',
        service_name: formData.service_name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        price_unit: formData.price_unit,
        location: formData.location || vendorProfile?.location,
        pin_code: formData.pin_code || vendorProfile?.pin_code,
        is_active: true,
      };

      if (editingService) {
        const { error } = await supabase
          .from('vendor_services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendor_services')
          .insert(serviceData);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingService(null);
      setFormData({
        service_category_id: '',
        service_name: '',
        description: '',
        base_price: '',
        price_unit: 'per job',
        location: '',
        pin_code: '',
      });
      loadServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert(error.message || 'Failed to save service');
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      service_category_id: service.service_category_id || '',
      service_name: service.service_name,
      description: service.description || '',
      base_price: service.base_price.toString(),
      price_unit: service.price_unit,
      location: service.location || '',
      pin_code: service.pin_code || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('vendor_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const toggleActive = async (service: any) => {
    try {
      const { error } = await supabase
        .from('vendor_services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      loadServices();
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  if (!vendorProfile?.is_approved) {
    return (
      <div className="pb-20">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Account Pending Approval
          </h3>
          <p className="text-sm text-yellow-700">
            Your vendor account is pending admin approval. Once approved, you can add your services here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Services</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingService(null);
            setFormData({
              service_category_id: serviceCategories[0]?.id || '',
              service_name: '',
              description: '',
              base_price: '',
              price_unit: 'per job',
              location: '',
              pin_code: '',
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingService(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category
              </label>
              <select
                value={formData.service_category_id}
                onChange={(e) => setFormData({ ...formData, service_category_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {serviceCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {formData.service_category_id && (
                <p className="text-xs text-gray-500 mt-1">
                  {serviceCategories.find(c => c.id === formData.service_category_id)?.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="e.g., Wood Furniture Repair"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your service in detail..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="500"
                  min="0"
                  step="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Unit
                </label>
                <select
                  value={formData.price_unit}
                  onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="per job">Per Job</option>
                  <option value="per hour">Per Hour</option>
                  <option value="per day">Per Day</option>
                  <option value="per sqft">Per Sq.Ft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={vendorProfile?.location || 'Service location'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code
              </label>
              <input
                type="text"
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                placeholder={vendorProfile?.pin_code || '000000'}
                pattern="[0-9]{6}"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingService(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingService ? 'Update Service' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-2">No services added yet</p>
          <p className="text-sm text-gray-500">Add your first service to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${
                !service.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{service.service_name}</h3>
                  <p className="text-sm text-gray-600">{service.service_category?.name || service.service_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(service)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      service.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {service.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-gray-600 mb-3">{service.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{service.location || 'No location'}</span>
                </div>
                {service.pin_code && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {service.pin_code}
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-2xl font-bold text-blue-600">
                  ₹{service.base_price}
                  <span className="text-sm text-gray-500 ml-2">{service.price_unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
