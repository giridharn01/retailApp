import React from 'react';

const KPICard = ({ title, value, subtitle, icon, color = 'blue', trend = null }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        green: 'text-green-600 bg-green-50 border-green-200',
        purple: 'text-purple-600 bg-purple-50 border-purple-200',
        orange: 'text-orange-600 bg-orange-50 border-orange-200',
        red: 'text-red-600 bg-red-50 border-red-200',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.type === 'up') {
            return <span className="text-green-500 text-sm">↗️ +{trend.value}%</span>;
        } else if (trend.type === 'down') {
            return <span className="text-red-500 text-sm">↘️ -{trend.value}%</span>;
        }
        return <span className="text-gray-500 text-sm">→ {trend.value}%</span>;
    };

    return (
        <div className={`bg-white border-l-4 ${colorClasses[color]} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{icon}</span>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            {title}
                        </h3>
                    </div>
                    <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]} mb-1`}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-600">
                            {subtitle}
                        </p>
                    )}
                </div>
                {trend && (
                    <div className="flex flex-col items-end">
                        {getTrendIcon()}
                    </div>
                )}
            </div>
        </div>
    );
};

const KPIDashboard = ({ data }) => {
    if (!data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-100 animate-pulse p-6 rounded-lg shadow-md h-32"></div>
                ))}
            </div>
        );
    }

    const salesData = data.summary?.sales || {};
    const servicesData = data.summary?.services || {};
    const customerData = data.summary?.customers || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
                title="Total Revenue"
                value={new Intl.NumberFormat('en-IN', { 
                    style: 'currency', 
                    currency: 'INR',
                    minimumFractionDigits: 0
                }).format(salesData.totalRevenue || 0)}
                subtitle={`From ${salesData.totalOrders || 0} orders`}
                icon="💰"
                color="green"
                trend={{ type: 'up', value: '12.5' }}
            />
            
            <KPICard
                title="Total Orders"
                value={salesData.totalOrders || 0}
                subtitle={`Avg: ${new Intl.NumberFormat('en-IN', { 
                    style: 'currency', 
                    currency: 'INR',
                    minimumFractionDigits: 0
                }).format(salesData.averageOrderValue || 0)}`}
                icon="🛒"
                color="blue"
                trend={{ type: 'up', value: '8.2' }}
            />
            
            <KPICard
                title="Service Requests"
                value={servicesData.totalRequests || 0}
                subtitle={`${servicesData.completedRequests || 0} completed`}
                icon="🛠️"
                color="purple"
                trend={{ type: 'stable', value: '0.5' }}
            />
            
            <KPICard
                title="Service Success Rate"
                value={`${servicesData.completionRate || 0}%`}
                subtitle={`${servicesData.pendingRequests || 0} pending`}
                icon="✅"
                color={servicesData.completionRate >= 80 ? 'green' : servicesData.completionRate >= 60 ? 'orange' : 'red'}
                trend={{ 
                    type: servicesData.completionRate >= 80 ? 'up' : 'down', 
                    value: '3.1' 
                }}
            />
        </div>
    );
};

export default KPIDashboard;
