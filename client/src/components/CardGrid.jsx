import React from "react";

export default function CardGrid({ title, destinations = [], style = {}, cardStyle = {} }) {
  return (
    <section className="rounded-lg" style={style}>
      {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
      <div className="grid gap-4" style={{ gridTemplateColumns: style.gridTemplateColumns || "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {destinations.length > 0 ? destinations.map(dest => (
          <div key={dest.name} className="bg-white rounded-lg shadow overflow-hidden flex flex-col" style={cardStyle}>
            {dest.image && (
              <img src={dest.image} alt={dest.name} className="w-full h-40 object-cover" />
            )}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-lg mb-2">{dest.name}</h3>
              <p className="text-gray-600 flex-1">{dest.description}</p>
            </div>
          </div>
        )) : <div className="text-gray-400">No destinations available.</div>}
      </div>
    </section>
  );
} 