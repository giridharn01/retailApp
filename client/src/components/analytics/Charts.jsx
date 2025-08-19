import React from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Color palette for consistent theming
const COLORS = {
    primary: '#3B82F6',    // Blue
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Amber
    danger: '#EF4444',     // Red
    purple: '#8B5CF6',     // Purple
    indigo: '#6366F1',     // Indigo
    pink: '#EC4899',       // Pink
    teal: '#14B8A6'        // Teal
};

const CHART_COLORS = [
    COLORS.primary,
    COLORS.success,
    COLORS.warning,
    COLORS.purple,
    COLORS.indigo,
    COLORS.pink,
    COLORS.teal,
    COLORS.danger
];

// Custom tooltip formatter
const CustomTooltip = ({ active, payload, label, labelFormatter, valueFormatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="font-medium text-gray-900 mb-2">
                    {labelFormatter ? labelFormatter(label) : label}
                </p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        <span className="font-medium">{entry.name}:</span>{' '}
                        {valueFormatter ? valueFormatter(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Sales Revenue Trend Chart
export const SalesRevenueTrendChart = ({ data }) => {
    if (!data || !data.length) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">📈 Sales Revenue Trend</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No sales data available for the selected period
                </div>
            </div>
        );
    }

    const chartData = data.map(item => ({
        date: item._id,
        revenue: item.totalSales || 0,
        orders: item.orderCount || 0,
        avgOrder: item.averageOrder || 0
    }));

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📈 Sales Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                    />
                    <Tooltip
                        content={<CustomTooltip 
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                            valueFormatter={(value, name) => {
                                if (name === 'Revenue') {
                                    return new Intl.NumberFormat('en-IN', { 
                                        style: 'currency', 
                                        currency: 'INR' 
                                    }).format(value);
                                }
                                return value;
                            }}
                        />}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={COLORS.success}
                        fill="url(#revenueGradient)"
                        strokeWidth={2}
                        name="Revenue"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// Service Requests Breakdown Pie Chart
export const ServiceBreakdownPieChart = ({ data }) => {
    if (!data || !data.length) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">🔧 Service Requests Breakdown</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No service data available for the selected period
                </div>
            </div>
        );
    }

    const chartData = data.map(item => ({
        name: item._id || 'Unknown',
        value: item.count || 0,
        percentage: ((item.count || 0) / data.reduce((sum, d) => sum + (d.count || 0), 0) * 100).toFixed(1)
    }));

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return percent > 0.05 ? (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        ) : null;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🔧 Service Requests Breakdown</h3>
            <div className="flex flex-col lg:flex-row items-center">
                <ResponsiveContainer width="100%" height={250} className="lg:w-2/3">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<CustomTooltip 
                                valueFormatter={(value) => `${value} requests`}
                            />}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="lg:w-1/3 lg:pl-6 mt-4 lg:mt-0">
                    <h4 className="font-medium text-gray-700 mb-3">Service Types</h4>
                    <div className="space-y-2">
                        {chartData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div 
                                        className="w-3 h-3 rounded mr-2"
                                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                    ></div>
                                    <span className="text-sm text-gray-700">{entry.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">{entry.value}</div>
                                    <div className="text-xs text-gray-500">{entry.percentage}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Combined Business Trends Chart
export const BusinessTrendsChart = ({ data }) => {
    if (!data || !data.length) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Business Performance Trends</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No trend data available for the selected period
                </div>
            </div>
        );
    }

    const chartData = data.map(item => ({
        date: item.date || item._id,
        revenue: item.revenue || item.sales || 0,
        orders: item.orders || item.orderCount || 0,
        services: item.serviceRequests || item.requestCount || 0
    }));

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Business Performance Trends</h3>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    />
                    <YAxis 
                        yAxisId="revenue"
                        orientation="left"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                    />
                    <YAxis 
                        yAxisId="count"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        content={<CustomTooltip 
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                            valueFormatter={(value, name) => {
                                if (name === 'Revenue') {
                                    return new Intl.NumberFormat('en-IN', { 
                                        style: 'currency', 
                                        currency: 'INR' 
                                    }).format(value);
                                }
                                return value;
                            }}
                        />}
                    />
                    <Legend />
                    <Line
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenue"
                        stroke={COLORS.success}
                        strokeWidth={3}
                        dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                        name="Revenue"
                    />
                    <Line
                        yAxisId="count"
                        type="monotone"
                        dataKey="orders"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={{ fill: COLORS.primary, strokeWidth: 2, r: 3 }}
                        name="Orders"
                    />
                    <Line
                        yAxisId="count"
                        type="monotone"
                        dataKey="services"
                        stroke={COLORS.purple}
                        strokeWidth={2}
                        dot={{ fill: COLORS.purple, strokeWidth: 2, r: 3 }}
                        name="Service Requests"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// Top Products Bar Chart
export const TopProductsChart = ({ data }) => {
    if (!data || !data.length) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">🏆 Top Performing Products</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No product data available for the selected period
                </div>
            </div>
        );
    }

    const chartData = data.slice(0, 8).map(item => ({
        name: item.product?.name || 'Unknown Product',
        revenue: item.revenue || 0,
        quantity: item.totalSold || 0
    }));

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🏆 Top Performing Products</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                    />
                    <Tooltip
                        content={<CustomTooltip 
                            valueFormatter={(value, name) => {
                                if (name === 'Revenue') {
                                    return new Intl.NumberFormat('en-IN', { 
                                        style: 'currency', 
                                        currency: 'INR' 
                                    }).format(value);
                                }
                                return `${value} units`;
                            }}
                        />}
                    />
                    <Bar 
                        dataKey="revenue" 
                        fill={COLORS.success}
                        radius={[4, 4, 0, 0]}
                        name="Revenue"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
