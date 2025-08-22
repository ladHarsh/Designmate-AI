import React from "react";

export default function TripsTable({ title, columns = [], data = [], statusBadges = {}, style = {} }) {
  return (
    <section className="rounded-lg" style={style}>
      {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr>
              {columns.length > 0 ? columns.map(col => (
                <th key={col} className="px-4 py-2 text-left bg-gray-100 font-medium text-gray-700">{col}</th>
              )) : null}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((row, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="px-4 py-2">{row.destination}</td>
                <td className="px-4 py-2">{row.startDate}</td>
                <td className="px-4 py-2">{row.endDate}</td>
                <td className="px-4 py-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={statusBadges[row.status] || {}}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="text-gray-400 px-4 py-2">No trips found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
} 