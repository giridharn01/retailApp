import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../../utils/api';
import { io } from 'socket.io-client';
import { io } from 'socket.io-client';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800',
};

const ServiceRequestPage = React.memo(() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [serviceTypes, setServiceTypes] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const prevRequestsRef = useRef([]);

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

  // Fetch user's service requests (no dependency on serviceRequests)
  const fetchUserRequests = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const res = await apiRequest('/service-requests/user');
      const newRequests = res.data || [];

      // Compare with previous requests for status changes
      const prevRequests = prevRequestsRef.current;
      if (silent && prevRequests.length > 0) {
        const updates = [];
        newRequests.forEach(newRequest => {
          const oldRequest = prevRequests.find(r => r._id === newRequest._id);
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
          setTimeout(() => setShowUpdateNotification(false), 5000);
        }
      }
      setServiceRequests(newRequests);
      prevRequestsRef.current = newRequests;
    } catch (err) {
      setError('Failed to fetch your service requests');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchServiceData();
    fetchUserRequests();
  }, [fetchServiceData, fetchUserRequests]);

  // --- Socket.IO real-time updates ---
  useEffect(() => {
    // Connect to Socket.IO server (remove /api from URL since Socket.IO is on root)
    const socketUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : 'http://localhost:5000';
    
    const socket = io(socketUrl, {
      withCredentials: true,
    });

    console.log('Connecting to Socket.IO at:', socketUrl);

    // Listen for service request status changes
    socket.on('serviceRequestStatusChanged', (event) => {
      console.log('Status update received:', event);
      fetchUserRequests(true); // Silent refresh
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.log('Socket.IO connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchUserRequests]);

  const handleChange = useCallback((e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }, [formData]);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
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
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Service</h1>
          <p className="text-gray-600 mb-2">Fill out the form to request a new service. You can also view your previous requests below.</p>
          <div className="w-16 h-1 bg-blue-600 rounded mx-auto" />
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* New Request Form */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">New Service Request</h2>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>
            )}
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700 text-sm">{success}</div>
            )}
            {/* --- Card-style form for Service Request --- */}
            {/* The form is already inside a card container. Update the form fields: */}
            <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Service Type */}
                <div>
                  <label htmlFor="serviceType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="block w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-base font-medium"
                    required
                  >
                    <option value="" disabled className="text-gray-400">Select Service Type</option>
                    {serviceTypes.map((service) => (
                      <option
                        key={service._id}
                        value={service.name}
                        className="py-3 px-4 text-blue-900 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border-b border-blue-100 last:border-b-0"
                      >
                        {service.name} &nbsp; <span className="text-gray-500">₹{service.basePrice}</span>
                      </option>
                    ))}
                  </select>
                </div>
                {/* Contact Number */}
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-base"
                    placeholder="Your phone number"
                    required
                  />
                </div>
                {/* Preferred Date */}
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-base"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                {/* Preferred Time */}
                <div>
                  <label htmlFor="preferredTime" className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-base"
                    required
                  >
                    <option value="" disabled>Select Time</option>
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
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-base resize-none"
                  placeholder="Please describe the issue or service you need..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
          {/* Service Requests List */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6 mt-8 lg:mt-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Service Requests</h2>
            </div>
            {serviceRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No service requests found</h2>
                <p className="text-gray-600">You haven't submitted any service requests yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {serviceRequests.map((request) => (
                  <div key={request._id} className={`bg-white rounded-lg shadow-md overflow-hidden ${isRecentUpdate(request) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                    <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-max ${statusColors[request.status] || statusColors.default}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="px-4 pb-4 text-gray-700 text-sm">{request.description}</div>
                    {request.statusHistory && request.statusHistory.length > 1 && (
                      <div className="px-4 pb-4 text-xs text-gray-500">
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