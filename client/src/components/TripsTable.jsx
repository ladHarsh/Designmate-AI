import React from "react";

export default function TripsTable({ title, columns = [], data = [], statusBadges = {}, style = {} }) {
  console.log('🔍 TripsTable - title:', title, 'columns:', columns, 'data:', data);
  
  // Ensure data is an array and each row has the required properties
  const safeData = Array.isArray(data) ? data.filter(row => 
    row && typeof row === 'object'
  ) : [];
  
  // Ensure columns is an array
  const safeColumns = Array.isArray(columns) ? columns : [];
  
  // Ensure statusBadges is an object
  const safeStatusBadges = statusBadges && typeof statusBadges === 'object' ? statusBadges : {};

  // Get column keys from data if columns not provided
  const getColumnKeys = () => {
    if (safeColumns.length > 0) return safeColumns;
    if (safeData.length > 0) {
      return Object.keys(safeData[0]);
    }
    return [];
  };

  const columnKeys = getColumnKeys();

  // Get cell value for a row and column
  const getCellValue = (row, columnKey) => {
    const value = row[columnKey];
    
    // Handle links
    if (columnKey.toLowerCase().includes('link') && value) {
      return (
        <a href={value} className="text-blue-600 hover:text-blue-800 underline">
          View Details
        </a>
      );
    }
    
    // Handle status with badges
    if (columnKey.toLowerCase().includes('status') && value) {
      return (
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={safeStatusBadges[value] || {}}
        >
          {value}
        </span>
      );
    }
    
    return value || '';
  };

  return (
    <section className="rounded-lg" style={style}>
      {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              {columnKeys.map(col => (
                <th key={col} className="px-4 py-2 text-left bg-gray-100 font-medium text-gray-700">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeData.length > 0 ? safeData.map((row, idx) => (
              <tr key={row.id || idx} className="border-b last:border-b-0 hover:bg-gray-50">
                {columnKeys.map(columnKey => (
                  <td key={columnKey} className="px-4 py-2">
                    {getCellValue(row, columnKey)}
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td colSpan={columnKeys.length} className="text-gray-400 px-4 py-2 text-center">No data found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
} 