import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { 
    exportSalesPDF, 
    exportServicesPDF, 
    exportSalesExcel, 
    exportServicesExcel,
    exportDashboardPDF,
    exportDashboardExcel
} from '../../utils/exportUtils';

// Import new analytics components
import DateRangePicker from '../../components/analytics/DateRangePicker';
import KPIDashboard from '../../components/analytics/KPIDashboard';
import ExportButtons from '../../components/analytics/ExportButtons';
import {
    SalesRevenueTrendChart,
    ServiceBreakdownPieChart,
    BusinessTrendsChart,
    TopProductsChart
} from '../../components/analytics/Charts';

const AdminReportsPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [groupBy, setGroupBy] = useState('day');

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const endpoint = activeTab === 'dashboard' ? '/reports/dashboard' : 
                           activeTab === 'sales' ? '/reports/sales' : 
                           '/reports/services';
            
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                ...(activeTab !== 'dashboard' && { groupBy })
            });

            const response = await apiRequest(`${endpoint}?${params}`);
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
            setError(`Failed to load ${activeTab} report. Please try again.`);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, [activeTab, dateRange, groupBy]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleDateRangeChange = (field, value) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleGenerateReport = () => {
        fetchReportData();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const exportToPDF = () => {
        if (!reportData) return;
        
        try {
            if (activeTab === 'dashboard') {
                exportDashboardPDF(reportData, dateRange.startDate, dateRange.endDate);
            } else if (activeTab === 'sales') {
                exportSalesPDF(reportData, dateRange.startDate, dateRange.endDate);
            } else if (activeTab === 'services') {
                exportServicesPDF(reportData, dateRange.startDate, dateRange.endDate);
            }
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const exportToExcel = () => {
        if (!reportData) return;
        
        try {
            if (activeTab === 'dashboard') {
                exportDashboardExcel(reportData, dateRange.startDate, dateRange.endDate);
            } else if (activeTab === 'sales') {
                exportSalesExcel(reportData, dateRange.startDate, dateRange.endDate);
            } else if (activeTab === 'services') {
                exportServicesExcel(reportData, dateRange.startDate, dateRange.endDate);
            }
        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Failed to export Excel. Please try again.');
        }
    };

    const renderDashboardTab = () => {
        return (
            <div className="space-y-6">
                {/* KPI Dashboard */}
                <KPIDashboard data={reportData} />

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SalesRevenueTrendChart data={reportData?.salesData} />
                    <ServiceBreakdownPieChart data={reportData?.requestsByServiceType} />
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 gap-6">
                    <BusinessTrendsChart data={reportData?.trends} />
                </div>

                {/* Top Products */}
                {reportData?.topProducts && reportData.topProducts.length > 0 && (
                    <TopProductsChart data={reportData.topProducts} />
                )}

                {/* Data Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Orders */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">📋 Recent Performance</h3>
                        <div className="space-y-3">
                            {(reportData?.trends || []).slice(0, 5).map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                    <span className="text-sm font-medium text-gray-700">
                                        {formatDate(item.date || item._id)}
                                    </span>
                                    <div className="flex space-x-4 text-sm">
                                        <span className="text-green-600 font-medium">
                                            {formatCurrency(item.revenue || item.sales || 0)}
                                        </span>
                                        <span className="text-blue-600">
                                            {item.orders || item.orderCount || 0} orders
                                        </span>
                                        <span className="text-purple-600">
                                            {item.serviceRequests || item.requestCount || 0} services
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Service Status Overview */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">🔧 Service Status Overview</h3>
                        <div className="space-y-3">
                            {(reportData?.requestsByStatus || []).map((status, index) => {
                                const statusColors = {
                                    completed: 'bg-green-100 text-green-800',
                                    'in-progress': 'bg-blue-100 text-blue-800',
                                    pending: 'bg-yellow-100 text-yellow-800',
                                    cancelled: 'bg-red-100 text-red-800'
                                };
                                
                                return (
                                    <div key={index} className="flex justify-between items-center py-2">
                                        <div className="flex items-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status._id] || 'bg-gray-100 text-gray-800'}`}>
                                                {status._id || 'Unknown'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {status.count || 0} requests
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSalesTab = () => {
        return (
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Total Sales</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {formatCurrency(reportData?.summary?.totalSales || 0)}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Total Orders</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {reportData?.summary?.totalOrders || 0}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Avg Order Value</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                            {formatCurrency(reportData?.summary?.averageOrderValue || 0)}
                        </p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SalesRevenueTrendChart data={reportData?.salesData} />
                    <TopProductsChart data={reportData?.topProducts} />
                </div>

                {/* Sales Data Table */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">📈 Sales Performance Data</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(reportData?.salesData || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            No sales data available for this period
                                        </td>
                                    </tr>
                                ) : (
                                    (reportData?.salesData || []).slice(0, 10).map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatDate(item._id)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                {formatCurrency(item.totalSales || 0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                                {item.orderCount || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                                                {formatCurrency(item.averageOrder || 0)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderServicesTab = () => {
        return (
            <div className="space-y-6">
                {/* Service KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Total Requests</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {reportData?.summary?.totalRequests || 0}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Completed</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {reportData?.summary?.completedRequests || 0}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Pending</h3>
                        <p className="text-3xl font-bold text-yellow-600 mt-2">
                            {reportData?.summary?.pendingRequests || 0}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Success Rate</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                            {reportData?.summary?.completionRate || 0}%
                        </p>
                    </div>
                </div>

                {/* Service Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ServiceBreakdownPieChart data={reportData?.requestsByServiceType} />
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">🔧 Service Status Distribution</h3>
                        <div className="space-y-4">
                            {(reportData?.requestsByStatus || []).map((status, index) => {
                                const total = reportData?.summary?.totalRequests || 0;
                                const percentage = total > 0 ? ((status.count || 0) / total * 100).toFixed(1) : 0;
                                
                                const statusConfig = {
                                    completed: { color: 'bg-green-500', icon: '✅' },
                                    'in-progress': { color: 'bg-blue-500', icon: '🔄' },
                                    pending: { color: 'bg-yellow-500', icon: '⏳' },
                                    cancelled: { color: 'bg-red-500', icon: '❌' }
                                };
                                
                                const config = statusConfig[status._id] || { color: 'bg-gray-500', icon: '❓' };
                                
                                return (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-lg mr-2">{config.icon}</span>
                                            <span className="text-sm font-medium text-gray-700 capitalize">
                                                {status._id || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${config.color}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-12">
                                                {status.count || 0}
                                            </span>
                                            <span className="text-xs text-gray-500 w-10">
                                                {percentage}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📊 Analytics & Reports Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Real-time business intelligence and performance analytics for Palani Andavar
                    </p>
                </div>

                {/* Date Range Picker */}
                <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onStartDateChange={(value) => handleDateRangeChange('startDate', value)}
                    onEndDateChange={(value) => handleDateRangeChange('endDate', value)}
                    onGenerateReport={handleGenerateReport}
                    loading={loading}
                />

                {/* Export Buttons */}
                <ExportButtons
                    onExportPDF={exportToPDF}
                    onExportExcel={exportToExcel}
                    loading={loading}
                    reportType={activeTab}
                />

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'dashboard', name: '🏠 Dashboard', icon: '📊' },
                                { id: 'sales', name: '💰 Sales', icon: '📈' },
                                { id: 'services', name: '🔧 Services', icon: '🛠️' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm rounded-t-lg transition-colors`}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-lg text-gray-600">Loading analytics data...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                {!loading && !error && reportData && (
                    <>
                        {activeTab === 'dashboard' && renderDashboardTab()}
                        {activeTab === 'sales' && renderSalesTab()}
                        {activeTab === 'services' && renderServicesTab()}
                    </>
                )}

                {/* No Data State */}
                {!loading && !error && !reportData && (
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <div className="text-gray-400 text-6xl mb-4">📊</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                        <p className="text-gray-600 mb-4">
                            No analytics data found for the selected period. Try adjusting your date range.
                        </p>
                        <button
                            onClick={handleGenerateReport}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Refresh Data
                        </button>
                    </div>
                )}

                {/* Grouping Options */}
                {activeTab !== 'dashboard' && (
                    <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">📅 Group Data By:</h4>
                        <div className="flex space-x-3">
                            {['day', 'week', 'month'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setGroupBy(option)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors capitalize ${
                                        groupBy === option
                                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReportsPage;
