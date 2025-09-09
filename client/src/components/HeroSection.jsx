import React from "react";

export default function HeroSection({ 
  backgroundImage, 
  title, 
  subtitle, 
  content,
  ctaText,
  ctaLink,
  searchBar = {}, 
  style = {} 
}) {
  console.log('🔍 HeroSection - title:', title, 'subtitle:', subtitle, 'content:', content, 'ctaText:', ctaText);
  
  // Ensure searchBar is a valid object
  const safeSearchBar = searchBar && typeof searchBar === 'object' ? searchBar : {};
  
  // Use content as subtitle if subtitle is not provided
  const displaySubtitle = subtitle || content;
  
  return (
    <section
      className="flex flex-col items-center justify-center text-center rounded-lg relative min-h-[400px] py-16"
      style={{
        ...style,
        backgroundImage: backgroundImage
          ? `linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)), url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {title && <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{title}</h1>}
      {displaySubtitle && <p className="text-lg md:text-xl text-white mb-8 drop-shadow max-w-3xl px-4">{displaySubtitle}</p>}
      
      {/* CTA Button */}
      {ctaText && (
        <div className="flex justify-center mt-4">
          {ctaLink ? (
            <a 
              href={ctaLink} 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {ctaText}
            </a>
          ) : (
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              {ctaText}
            </button>
          )}
        </div>
      )}
      
      {/* Search Bar */}
      {safeSearchBar && Object.keys(safeSearchBar).length > 0 && (
        <div className="flex justify-center mt-4">
          <input
            type="text"
            placeholder={safeSearchBar.placeholder || "Search..."}
            className="px-4 py-2 rounded-l bg-white text-gray-800 focus:outline-none"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700">
            {safeSearchBar.buttonText || "Search"}
          </button>
        </div>
      )}
    </section>
  );
} 