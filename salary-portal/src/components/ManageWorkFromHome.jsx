import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageWorkFromHome() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingRequest, setEditingRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchPendingCount();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, activeFilter]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('https://weisetechdata.onrender.com/api/work-from-home');
      setRequests(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Error fetching work from home requests:', error);
      alert('Failed to fetch work from home requests: ' + (error.response?.data?.error || error.message));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await axios.get('https://weisetechdata.onrender.com/api/work-from-home/pending-count');
      setPendingCount(res.data?.data?.pending_work_from_home_requests ?? 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const filterRequests = () => {
    if (activeFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(request => {
        const status = (request.status_text || '').toLowerCase();
        switch (activeFilter) {
          case 'pending': return status === 'requested';
          case 'approved': return status === 'approved';
          case 'declined': return status === 'declined';
          default: return true;
        }
      });
      setFilteredRequests(filtered);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const status = (newStatus || '').toLowerCase() === 'rejected' ? 'declined' : (newStatus || '').toLowerCase();
      const reviewerName = localStorage.getItem('name') || localStorage.getItem('email') || 'HR User';
      await axios.put(`http://localhost:5000/api/work-from-home/${requestId}/status`, {
        status,
        reviewed_by: reviewerName,
        reviewed_at: new Date().toISOString()
      });
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status_text: status.charAt(0).toUpperCase() + status.slice(1), status } : req));
      if (newStatus === 'approved' || newStatus === 'declined') {
        const original = requests.find(req => req.id === requestId);
        if (original?.status_text?.toLowerCase() === 'requested') setPendingCount(prev => Math.max(0, prev - 1));
      }
      setEditingRequest(null);
    } catch (error) {
      console.error('Error updating work from home status:', error);
      alert('Failed to update status');
    }
  };

  const handleEditStatus = (requestId, currentStatus) => {
    setEditingRequest({ id: requestId, currentStatus: currentStatus.toLowerCase() });
  };

  const getStatusBadge = (statusText) => {
    const status = (statusText || '').toLowerCase();
    const statusStyles = {
      requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200'
    };
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{label}</span>;
  };

  const getFilterButtonClass = (filterName) => {
    const baseClass = "rounded-lg font-medium transition-colors";
    return activeFilter === filterName ? `${baseClass} bg-blue-600 text-white shadow-sm` : `${baseClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
  };

  const getStatusButtonClass = (status, isSelected) => {
    const baseClass = "px-3 py-1 rounded text-sm font-medium transition-colors border";
    if (isSelected) return status === 'approved' ? `${baseClass} bg-green-600 text-white border-green-600` : `${baseClass} bg-red-600 text-white border-red-600`;
    return status === 'approved' ? `${baseClass} bg-green-100 text-green-800 border-green-300 hover:bg-green-200` : `${baseClass} bg-red-100 text-red-800 border-red-300 hover:bg-red-200`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-x-hidden max-w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Manage Work From Home</h1>
          <p className="text-sm sm:text-base text-gray-600">Review and approve work from home requests</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-gray-600">Pending</span>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-semibold border border-yellow-200">{pendingCount}</span>
        </div>
      </div>

      <div className="mb-6 overflow-x-hidden">
        <div className="flex gap-1 sm:gap-2 flex-nowrap">
          <button onClick={() => setActiveFilter('all')} className={`${getFilterButtonClass('all')} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}>All Requests</button>
          <button onClick={() => setActiveFilter('pending')} className={`${getFilterButtonClass('pending')} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}>Pending</button>
          <button onClick={() => setActiveFilter('approved')} className={`${getFilterButtonClass('approved')} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}>Approved</button>
          <button onClick={() => setActiveFilter('declined')} className={`${getFilterButtonClass('declined')} px-1.5 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap flex-1 sm:flex-none`}>Declined</button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeFilter === 'all' ? 'No Work From Home Requests' : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Requests`}
          </h3>
          <p className="text-gray-500">
            {activeFilter === 'all' ? 'There are no work from home requests to display.' : `There are no ${activeFilter} work from home requests.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden max-w-full">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee</th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date Range</th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Days</th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{req.employee_name}</div>
                        <div className="text-xs sm:text-sm text-gray-500">ID: {req.employee_id}</div>
                      </td>
                      <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {new Date(req.from_date).toLocaleDateString()} - {new Date(req.to_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap text-xs sm:text-sm text-gray-900">{req.number_of_days}</td>
                      <td className="px-2 sm:px-6 py-4 text-xs sm:text-sm text-gray-700 max-w-[120px] sm:max-w-xs">
                        <div className="line-clamp-2 sm:line-clamp-1 truncate" title={req.description}>{req.description}</div>
                      </td>
                      <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap">{getStatusBadge(req.status_text)}</td>
                      <td className="px-2 sm:px-6 py-4 sm:whitespace-nowrap text-xs sm:text-sm font-medium">
                        {editingRequest?.id === req.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button onClick={() => handleStatusUpdate(req.id, 'approved')} className={getStatusButtonClass('approved', editingRequest.currentStatus === 'approved')}>Approve</button>
                              <button onClick={() => handleStatusUpdate(req.id, 'declined')} className={getStatusButtonClass('declined', editingRequest.currentStatus === 'declined')}>Decline</button>
                            </div>
                            <button onClick={() => setEditingRequest(null)} className="text-xs text-gray-500 hover:text-gray-700 underline">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {req.status_text.toLowerCase() === 'requested' ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleStatusUpdate(req.id, 'approved')} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Approve</button>
                                <button onClick={() => handleStatusUpdate(req.id, 'declined')} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Decline</button>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <span className="text-gray-500 text-sm">Reviewed</span>
                                <button onClick={() => handleEditStatus(req.id, req.status_text)} className="text-blue-600 hover:text-blue-800 text-sm underline">Edit</button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageWorkFromHome;
