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

const AdminReportsPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const endpoint = activeTab === 'dashboard' ? '/reports/dashboard' : 
                           activeTab === 'sales' ? '/reports/sales' : 
                           '/reports/services';
            
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
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
    }, [activeTab, dateRange]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
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

    // Generate Business Insights
    const generateInsights = () => {
        if (!reportData) return [];
        
        const insights = [];
        
        // Sales Insights
        if (reportData.summary?.sales) {
            const { totalRevenue, totalOrders, averageOrderValue } = reportData.summary.sales;
            
            if (totalRevenue === 0) {
                insights.push({
                    type: 'warning',
                    icon: '⚠️',
                    title: 'Revenue Alert',
                    message: 'No revenue generated in this period. Focus on customer acquisition and sales strategies.'
                });
            } else if (averageOrderValue > 5000) {
                insights.push({
                    type: 'success',
                    icon: '💎',
                    title: 'Premium Performance',
                    message: `Excellent average order value of ${formatCurrency(averageOrderValue)} indicates premium customer engagement.`
                });
            } else if (averageOrderValue < 1000) {
                insights.push({
                    type: 'info',
                    icon: '📈',
                    title: 'Upselling Opportunity',
                    message: 'Consider product bundling or premium options to increase average order value.'
                });
            }
            
            if (totalOrders > 50) {
                insights.push({
                    type: 'success',
                    icon: '🚀',
                    title: 'High Order Volume',
                    message: `Strong performance with ${totalOrders} orders. Maintain momentum with customer retention strategies.`
                });
            }
        }
        
        // Service Insights
        if (reportData.summary?.services) {
            const { completionRate, totalRequests, completedRequests } = reportData.summary.services;
            
            if (completionRate >= 90) {
                insights.push({
                    type: 'success',
                    icon: '🏆',
                    title: 'Service Excellence',
                    message: `Outstanding ${formatPercentage(completionRate)} completion rate demonstrates superior service quality.`
                });
            } else if (completionRate < 70) {
                insights.push({
                    type: 'warning',
                    icon: '🔧',
                    title: 'Service Improvement Needed',
                    message: 'Service completion rate needs attention. Review processes and resource allocation.'
                });
            }
            
            if (totalRequests > 0) {
                const serviceUtilization = (completedRequests / totalRequests) * 100;
                if (serviceUtilization > 85) {
                    insights.push({
                        type: 'info',
                        icon: '⚡',
                        title: 'High Service Demand',
                        message: 'Strong service utilization indicates active customer engagement and satisfaction.'
                    });
                }
            }
        }
        
        return insights.slice(0, 4); // Show top 4 insights
    };

    // Calculate Key Metrics
    const calculateMetrics = () => {
        if (!reportData) return null;
        
        const totalRevenue = reportData.summary?.sales?.totalRevenue || 0;
        const totalOrders = reportData.summary?.sales?.totalOrders || 0;
        const totalRequests = reportData.summary?.services?.totalRequests || 0;
        const completionRate = reportData.summary?.services?.completionRate || 0;
        
        return {
            totalRevenue,
            totalOrders,
            totalRequests,
            completionRate,
            avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            businessScore: Math.round(((completionRate / 100) * 40) + ((totalOrders > 0 ? 1 : 0) * 30) + ((totalRequests > 0 ? 1 : 0) * 30))
        };
    };

    const renderExecutiveSummary = () => {
        const metrics = calculateMetrics();
        const insights = generateInsights();
        
        if (!metrics) return null;
        
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    📊 Executive Summary
                    <span className="ml-3 text-sm bg-blue-500 text-white px-3 py-1 rounded-full">
                        Business Score: {metrics.businessScore}/100
                    </span>
                </h2>
                
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
                            </div>
                            <div className="text-green-500 text-3xl">💰</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {metrics.totalOrders > 0 ? `Avg: ${formatCurrency(metrics.avgOrderValue)}` : 'No orders yet'}
                        </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase">Total Orders</p>
                                <p className="text-2xl font-bold text-blue-600">{metrics.totalOrders}</p>
                            </div>
                            <div className="text-blue-500 text-3xl">🛒</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {metrics.totalOrders > 0 ? 'Active sales pipeline' : 'Build customer base'}
                        </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase">Service Requests</p>
                                <p className="text-2xl font-bold text-purple-600">{metrics.totalRequests}</p>
                            </div>
                            <div className="text-purple-500 text-3xl">🔧</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {metrics.completionRate > 0 ? `${formatPercentage(metrics.completionRate)} completed` : 'No requests yet'}
                        </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase">Success Rate</p>
                                <p className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.completionRate)}</p>
                            </div>
                            <div className="text-orange-500 text-3xl">📈</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {metrics.completionRate >= 80 ? 'Excellent performance' : 'Room for improvement'}
                        </p>
                    </div>
                </div>
                
                {/* Strategic Insights */}
                {insights.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Strategic Insights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {insights.map((insight, index) => {
                                const bgColors = {
                                    success: 'bg-green-50 border-green-200',
                                    warning: 'bg-yellow-50 border-yellow-200',
                                    info: 'bg-blue-50 border-blue-200'
                                };
                                const textColors = {
                                    success: 'text-green-800',
                                    warning: 'text-yellow-800',
                                    info: 'text-blue-800'
                                };
                                
                                return (
                                    <div key={index} className={`p-4 rounded-lg border ${bgColors[insight.type] || 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-start space-x-3">
                                            <span className="text-2xl">{insight.icon}</span>
                                            <div>
                                                <h4 className={`font-semibold ${textColors[insight.type] || 'text-gray-800'}`}>
                                                    {insight.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderEnhancedTables = () => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Requests by Status - Enhanced */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                        🔧 Service Status Analysis
                    </h3>
                    
                    {reportData?.requestsByStatus && reportData.requestsByStatus.length > 0 ? (
                        <div className="space-y-4">
                            {reportData.requestsByStatus.map((status, index) => {
                                const totalRequests = reportData.summary?.services?.totalRequests || 1;
                                const percentage = (status.count / totalRequests) * 100;
                                
                                const statusConfig = {
                                    completed: { color: 'bg-green-500', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: '✅' },
                                    'in-progress': { color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: '⏳' },
                                    pending: { color: 'bg-yellow-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '⏰' },
                                    cancelled: { color: 'bg-red-500', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '❌' }
                                };
                                
                                const config = statusConfig[status._id] || { color: 'bg-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📋' };
                                
                                return (
                                    <div key={index} className={`p-4 rounded-lg ${config.bgColor}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-lg">{config.icon}</span>
                                                <span className={`font-medium ${config.textColor}`}>
                                                    {status._id?.charAt(0).toUpperCase() + status._id?.slice(1) || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-lg font-bold ${config.textColor}`}>
                                                    {status.count}
                                                </span>
                                                <span className="text-sm text-gray-600 ml-2">
                                                    ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`${config.color} h-2 rounded-full transition-all duration-300`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <div className="text-4xl mb-4">📊</div>
                            <p>No service data available for this period</p>
                        </div>
                    )}
                </div>

                {/* Service Types - Enhanced */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                        🛠️ Popular Services
                    </h3>
                    
                    {reportData?.requestsByServiceType && reportData.requestsByServiceType.length > 0 ? (
                        <div className="space-y-4">
                            {reportData.requestsByServiceType.slice(0, 5).map((service, index) => {
                                const totalRequests = reportData.requestsByServiceType.reduce((sum, s) => sum + (s.count || 0), 0);
                                const percentage = totalRequests > 0 ? (service.count / totalRequests) * 100 : 0;
                                
                                const serviceIcons = {
                                    'Consultancy': '💼',
                                    'Installation': '🔧',
                                    'Maintenance': '🛠️',
                                    'Repair': '🔨',
                                    'ground water bore': '💧'
                                };
                                
                                const icon = serviceIcons[service._id] || '⚙️';
                                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                                const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100'];
                                
                                return (
                                    <div key={index} className={`p-4 rounded-lg ${bgColors[index % bgColors.length]}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-lg">{icon}</span>
                                                <span className="font-medium text-gray-800">
                                                    {service._id || 'Unknown Service'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-gray-800">
                                                    {service.count}
                                                </span>
                                                <span className="text-sm text-gray-600 ml-2">
                                                    requests
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-600">
                                            {percentage.toFixed(1)}% of all service requests
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <div className="text-4xl mb-4">🛠️</div>
                            <p>No service type data available</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">📊 Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-2">Comprehensive business intelligence and reporting</p>
                </div>
                
                {/* Export Buttons */}
                <div className="flex space-x-3 mt-4 lg:mt-0">
                    <button
                        onClick={exportToPDF}
                        disabled={!reportData || loading}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center space-x-2 disabled:opacity-50"
                    >
                        <span>📄</span>
                        <span>Export PDF</span>
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={!reportData || loading}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center space-x-2 disabled:opacity-50"
                    >
                        <span>📊</span>
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row items-end space-y-4 md:space-y-0 md:space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={fetchReportData}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                        {loading ? '🔄 Loading...' : '📈 Generate Report'}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                    Loading analytics data...
                </div>
            )}

            {/* Report Content */}
            {reportData && !loading && (
                <>
                    {renderExecutiveSummary()}
                    {renderEnhancedTables()}
                </>
            )}

            {/* No Data State */}
            {!reportData && !loading && !error && (
                <div className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-8 rounded-lg text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                    <p className="text-gray-600">Select a date range and click "Generate Report" to view analytics.</p>
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;
