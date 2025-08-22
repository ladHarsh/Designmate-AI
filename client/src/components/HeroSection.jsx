import React from "react";

export default function HeroSection({ backgroundImage, title, subtitle, searchBar = {}, style = {}, }) {
  return (
    <section
      className="flex flex-col items-center justify-center text-center rounded-lg relative"
      style={{
        ...style,
        backgroundImage: backgroundImage
          ? `linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)), url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {title && <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{title}</h1>}
      {subtitle && <p className="text-lg text-white mb-6 drop-shadow">{subtitle}</p>}
      {searchBar && (
        <div className="flex justify-center mt-4">
          <input
            type="text"
            placeholder={searchBar.placeholder || "Search..."}
            className="px-4 py-2 rounded-l bg-white text-gray-800 focus:outline-none"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700">
            {searchBar.buttonText || "Search"}
          </button>
        </div>
      )}
    </section>
  );
} 