import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';

const AdminServiceTypesPage = React.memo(() => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('service-types');
  
  // Service Type Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    estimatedDuration: ''
  });

  // Equipment Type Modal States
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [equipmentFormData, setEquipmentFormData] = useState({
    name: '',
    description: '',
    category: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [serviceRes, equipmentRes] = await Promise.all([
        apiRequest('/service-types'),
        apiRequest('/equipment-types')
      ]);
      setServiceTypes(serviceRes.data || []);
      setEquipmentTypes(equipmentRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Service Type Functions
  const handleServiceSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      // Convert string values to numbers for API
      const formDataToSend = {
        ...serviceFormData,
        basePrice: parseFloat(serviceFormData.basePrice),
        estimatedDuration: parseFloat(serviceFormData.estimatedDuration)
      };

      if (editingService) {
        const res = await apiRequest(`/service-types/${editingService._id}`, 'PUT', formDataToSend);
        setServiceTypes(prev => prev.map(st => 
          st._id === editingService._id ? res.data : st
        ));
        setSuccess('Service type updated successfully!');
      } else {
        const res = await apiRequest('/service-types', 'POST', formDataToSend);
        setServiceTypes(prev => [...prev, res.data]);
        setSuccess('Service type created successfully!');
      }
      resetServiceForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  }, [serviceFormData, editingService]);

  const handleServiceDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this service type?')) return;
    
    try {
      await apiRequest(`/service-types/${id}`, 'DELETE');
      setServiceTypes(prev => prev.filter(st => st._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const resetServiceForm = useCallback(() => {
    setServiceFormData({
      name: '',
      description: '',
      basePrice: '',
      estimatedDuration: ''
    });
    setEditingService(null);
    setIsServiceModalOpen(false);
  }, []);

  // Equipment Type Functions
  const handleEquipmentSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        await apiRequest(`/equipment-types/${editingEquipment._id}`, 'PUT', equipmentFormData);
        setEquipmentTypes(prev => prev.map(et => 
          et._id === editingEquipment._id ? { ...et, ...equipmentFormData } : et
        ));
      } else {
        const res = await apiRequest('/equipment-types', 'POST', equipmentFormData);
        setEquipmentTypes(prev => [...prev, res.data]);
      }
      resetEquipmentForm();
    } catch (err) {
      setError(err.message);
    }
  }, [equipmentFormData, editingEquipment]);

  const handleEquipmentDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment type?')) return;
    
    try {
      await apiRequest(`/equipment-types/${id}`, 'DELETE');
      setEquipmentTypes(prev => prev.filter(et => et._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const resetEquipmentForm = useCallback(() => {
    setEquipmentFormData({
      name: '',
      description: '',
      category: ''
    });
    setEditingEquipment(null);
    setIsEquipmentModalOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Service & Equipment Management
            </h2>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('service-types')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'service-types'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Service Types ({serviceTypes.length})
              </button>
              <button
                onClick={() => setActiveTab('equipment-types')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'equipment-types'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Equipment Types ({equipmentTypes.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Service Types Tab */}
        {activeTab === 'service-types' && (
          <div className="mt-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Service Types</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Manage the types of services you offer to customers.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  onClick={() => fetchData()}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto mr-3"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Add Service Type
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Service Name
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Description
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Base Price
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Duration
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {serviceTypes.map((service) => (
                          <tr key={service._id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {service.name}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {service.description}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              ₹{service.basePrice}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {service.estimatedDuration} hours
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={() => {
                                  setEditingService(service);
                                  setServiceFormData({
                                    name: service.name,
                                    description: service.description,
                                    basePrice: service.basePrice,
                                    estimatedDuration: service.estimatedDuration
                                  });
                                  setIsServiceModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleServiceDelete(service._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Types Tab */}
        {activeTab === 'equipment-types' && (
          <div className="mt-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment Types</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Manage the types of equipment you service.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  onClick={() => setIsEquipmentModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Add Equipment Type
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Equipment Name
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Description
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Category
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {equipmentTypes.map((equipment) => (
                          <tr key={equipment._id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {equipment.name}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              {equipment.description}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {equipment.category}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={() => {
                                  setEditingEquipment(equipment);
                                  setEquipmentFormData({
                                    name: equipment.name,
                                    description: equipment.description,
                                    category: equipment.category
                                  });
                                  setIsEquipmentModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleEquipmentDelete(equipment._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Type Modal */}
      {isServiceModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleServiceSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {editingService ? 'Edit Service Type' : 'Add New Service Type'}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="service-name" className="block text-sm font-medium text-gray-700">
                          Service Name
                        </label>
                        <input
                          type="text"
                          id="service-name"
                          value={serviceFormData.name}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="service-description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="service-description"
                          value={serviceFormData.description}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="base-price" className="block text-sm font-medium text-gray-700">
                            Base Price (₹)
                          </label>
                          <input
                            type="number"
                            id="base-price"
                            value={serviceFormData.basePrice}
                            onChange={(e) => setServiceFormData({ ...serviceFormData, basePrice: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                            Duration (hours)
                          </label>
                          <input
                            type="number"
                            id="duration"
                            value={serviceFormData.estimatedDuration}
                            onChange={(e) => setServiceFormData({ ...serviceFormData, estimatedDuration: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingService ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={resetServiceForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Type Modal */}
      {isEquipmentModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEquipmentSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {editingEquipment ? 'Edit Equipment Type' : 'Add New Equipment Type'}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="equipment-name" className="block text-sm font-medium text-gray-700">
                          Equipment Name
                        </label>
                        <input
                          type="text"
                          id="equipment-name"
                          value={equipmentFormData.name}
                          onChange={(e) => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="equipment-description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="equipment-description"
                          value={equipmentFormData.description}
                          onChange={(e) => setEquipmentFormData({ ...equipmentFormData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="equipment-category" className="block text-sm font-medium text-gray-700">
                          Category
                        </label>
                        <select
                          id="equipment-category"
                          value={equipmentFormData.category}
                          onChange={(e) => setEquipmentFormData({ ...equipmentFormData, category: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select a category</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Agri-Tech">Agri-Tech</option>
                          <option value="Solar">Solar</option>
                          <option value="Automation">Automation</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingEquipment ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={resetEquipmentForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AdminServiceTypesPage; 