import React from 'react';

const ExportButtons = ({ onExportPDF, onExportExcel, loading, reportType = 'dashboard' }) => {
    const getReportTitle = () => {
        switch(reportType) {
            case 'sales': return 'Sales Report';
            case 'services': return 'Services Report';
            default: return 'Dashboard Report';
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        📋 Export {getReportTitle()}
                    </h3>
                    <p className="text-sm text-gray-600">
                        Download professional business reports in your preferred format
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={onExportPDF}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Export PDF
                    </button>
                    
                    <button
                        onClick={onExportExcel}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        Export Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportButtons;
