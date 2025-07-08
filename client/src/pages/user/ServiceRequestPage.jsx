import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';

const ServiceRequestPage = React.memo(() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  const [formData, setFormData] = useState({
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    contactNumber: '',
    description: ''
  });

  // Fetch service types
  const fetchServiceData = useCallback(async () => {
    try {
      const serviceRes = await apiRequest('/service-types');
      setServiceTypes(serviceRes.data || []);
    } catch (err) {
      setError('Failed to load service data');
    }
  }, []);

  // Fetch user's service requests
  const fetchUserRequests = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const res = await apiRequest('/service-requests/user');
      const newRequests = res.data || [];
      
      // Check for status changes if this is a silent refresh
      if (silent && serviceRequests.length > 0) {
        const updates = [];
        newRequests.forEach(newRequest => {
          const oldRequest = serviceRequests.find(r => r._id === newRequest._id);
          if (oldRequest && oldRequest.status !== newRequest.status) {
            updates.push({
              serviceType: newRequest.serviceType,
              oldStatus: oldRequest.status,
              newStatus: newRequest.status
            });
          }
        });
        
        if (updates.length > 0) {
          setStatusUpdates(updates);
          setShowUpdateNotification(true);
          // Auto-hide notification after 5 seconds
          setTimeout(() => setShowUpdateNotification(false), 5000);
        }
      }
      
      setServiceRequests(newRequests);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to fetch your service requests');
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [serviceRequests]);

  useEffect(() => {
    fetchServiceData();
    fetchUserRequests();
  }, [fetchServiceData, fetchUserRequests]);

  // Auto-refresh service requests every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchUserRequests(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleChange = useCallback((e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }, [formData]);

  const handleManualRefresh = async () => {
    await fetchUserRequests();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const isRecentUpdate = (request) => {
    // Check if request has recent status history updates (last 5 minutes)
    if (request.statusHistory && request.statusHistory.length > 0) {
      const latestUpdate = request.statusHistory[request.statusHistory.length - 1];
      const updateTime = new Date(latestUpdate.timestamp);
      const now = new Date();
      const timeDiff = now - updateTime;
      return timeDiff < 5 * 60 * 1000; // 5 minutes
    }
    return false;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');
    try {
      await apiRequest('/service-requests', 'POST', formData);
      setSuccess('Service request submitted successfully!');
      setFormData({
        serviceType: '',
        preferredDate: '',
        preferredTime: '',
        contactNumber: '',
        description: ''
      });
      fetchUserRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, fetchUserRequests]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Status Update Notification */}
        {showUpdateNotification && (
          <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-pulse">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-medium">Service request status updated!</span>
              <div className="text-sm opacity-90">
                {statusUpdates.map((update, index) => (
                  <div key={index}>
                    {update.serviceType}: {update.oldStatus} → {update.newStatus}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowUpdateNotification(false)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Request a Service</h2>
        <p className="text-gray-600 text-center mb-8">Fill out the form to request a new service. You can also view your previous requests below.</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* New Request Form */}
          <div className="flex-1 bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">New Service Request</h3>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700 text-sm">{success}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Service Type */}
                <div>
                  <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                    Service Type *
                  </label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select Service Type</option>
                    {serviceTypes.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name} - ₹{service.basePrice}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Your phone number"
                    required
                  />
                </div>

                {/* Preferred Date */}
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Preferred Time */}
                <div>
                  <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700">
                    Preferred Time *
                  </label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select Time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Service Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please describe the issue or service you need..."
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>

          {/* Service Requests List */}
          <div className="flex-1 bg-white shadow rounded-lg p-6 mt-8 lg:mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Your Service Requests</h3>
              
              {/* Refresh Controls */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Last updated: {formatTime(lastRefresh)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoRefresh"
                      checked={autoRefresh}
                      onChange={toggleAutoRefresh}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                      Auto-refresh (30s)
                    </label>
                    {autoRefresh && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={loading || refreshing}
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className={`w-3 h-3 mr-1 ${loading || refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading || refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            {serviceRequests.length === 0 ? (
              <div className="text-gray-500 text-center">You have not submitted any service requests yet.</div>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((request) => (
                  <div key={request._id} className={`border rounded-lg p-4 bg-gray-50 ${isRecentUpdate(request) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-blue-700">{request.serviceType}</div>
                          {isRecentUpdate(request) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Updated
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">Preferred: {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : '-'} {request.preferredTime || ''}</div>
                        <div className="text-sm text-gray-500">Contact: {request.contactNumber}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold w-max ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 text-gray-700 text-sm">{request.description}</div>
                    {request.statusHistory && request.statusHistory.length > 1 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Status history: </span>
                        {request.statusHistory.map((h, idx) => (
                          <span key={idx}>{h.status}{idx < request.statusHistory.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ServiceRequestPage; 