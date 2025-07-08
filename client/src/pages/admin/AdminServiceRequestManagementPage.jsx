import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../../utils/api';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminServiceRequestManagementPage = React.memo(() => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRefs = useRef({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState({});

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/service-requests');
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownId !== null && dropdownRefs.current[openDropdownId] && !dropdownRefs.current[openDropdownId].contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const handleStatusUpdate = useCallback(async (requestId, newStatus) => {
    try {
      // Set loading state for this specific request
      setUpdatingStatus(prev => ({ ...prev, [requestId]: true }));
      
      // Optimistic update - immediately update the local state
      setRequests(prev => prev.map(req => req._id === requestId ? { ...req, status: newStatus } : req));
      
      // Make the API call
      await apiRequest(`/service-requests/${requestId}`, 'PUT', { status: newStatus });
      
      // Small delay to show the optimistic update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show success feedback
      setStatusUpdateSuccess(prev => ({ ...prev, [requestId]: true }));
      // Hide success indicator after 2 seconds
      setTimeout(() => {
        setStatusUpdateSuccess(prev => ({ ...prev, [requestId]: false }));
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      // Revert optimistic update on error
      await fetchRequests();
    } finally {
      // Clear loading state
      setUpdatingStatus(prev => ({ ...prev, [requestId]: false }));
    }
  }, [fetchRequests]);

  const handleDelete = useCallback(async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    try {
      await apiRequest(`/service-requests/${requestId}`, 'DELETE');
      setRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const filteredRequests = requests.filter(request => 
    statusFilter === 'all' ? true : request.status === statusFilter
  );

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in-progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
    byServiceType: requests.reduce((acc, request) => {
      acc[request.serviceType] = (acc[request.serviceType] || 0) + 1;
      return acc;
    }, {}),
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Service Request Management</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Total Requests</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>

            {/* Service Type Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Service Type Distribution</h4>
                <div className="space-y-4">
                  {Object.entries(stats.byServiceType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 capitalize">{type}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Filter by Status:</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
            </div>
          </div>

        {/* Request Table */}
        <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Request ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Service Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Preferred Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        #{request._id.slice(-6)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {request.serviceType}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(request.preferredDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-sm align-middle min-w-[120px] w-full">
                      <div className="relative inline-block" ref={el => dropdownRefs.current[request._id] = el}>
                        <button
                          type="button"
                          disabled={updatingStatus[request._id]}
                          className={`rounded-2xl px-4 py-1 text-xs font-medium flex items-center justify-center focus:outline-none border border-gray-300 transition-all min-w-[120px] ${getStatusColor(request.status)} ${updatingStatus[request._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => setOpenDropdownId(openDropdownId === request._id ? null : request._id)}
                        >
                          {updatingStatus[request._id] ? (
                            <svg className="animate-spin w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : statusUpdateSuccess[request._id] ? (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-1 text-xs text-green-600">Updated</span>
                            </div>
                          ) : (
                            <>
                              <span className="w-full text-center">{statusOptions.find(opt => opt.value === request.status)?.label || request.status}</span>
                              <svg className="ml-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>
                        {openDropdownId === request._id && !updatingStatus[request._id] && (
                          <div className="absolute left-0 mt-2 z-50 bg-white shadow-xl rounded-xl py-2 px-2 min-w-[400px] w-max border border-gray-200 max-h-60 overflow-y-auto">
                            <div className="flex flex-row gap-2">
                              {statusOptions.map((opt, idx) => {
                                const isSelected = request.status === opt.value;
                                return (
                                  <div
                                    key={opt.value}
                                    className={`cursor-pointer flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium transition-all ${getStatusColor(opt.value)}
                                      ${isSelected ? 'ring-2 ring-blue-500 border border-blue-400 bg-opacity-90' : ''}
                                      hover:ring-2 hover:ring-blue-300 hover:bg-opacity-80`}
                                    style={{ minWidth: 0 }}
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      if (!isSelected) handleStatusUpdate(request._id, opt.value);
                                    }}
                                  >
                                    <span className="w-full text-center">{opt.label}</span>
                                    {isSelected && (
                                      <svg className="ml-1 w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDelete(request._id)}
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

      {/* Request Details Modal */}
      {isDetailsModalOpen && selectedRequest && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-2 sm:px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-full sm:max-w-lg">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Request Details
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Service Type</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.serviceType}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Preferred Schedule</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedRequest.preferredDate).toLocaleDateString()} - {selectedRequest.preferredTime}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.contactNumber}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Description</h4>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest.description}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Status</h4>
                      <select
                        value={selectedRequest.status}
                        onChange={(e) => {
                          handleStatusUpdate(selectedRequest._id, e.target.value);
                          setSelectedRequest({ ...selectedRequest, status: e.target.value });
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md max-w-[120px] sm:max-w-[160px] truncate whitespace-nowrap"
                      >
                        <option value="pending" className="bg-yellow-100 text-yellow-800">Pending</option>
                        <option value="in-progress" className="bg-blue-100 text-blue-800">In Progress</option>
                        <option value="completed" className="bg-green-100 text-green-800">Completed</option>
                        <option value="cancelled" className="bg-red-100 text-red-800">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedRequest(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AdminServiceRequestManagementPage; 