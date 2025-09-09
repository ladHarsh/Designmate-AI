import React from "react";

export default function Footer({ 
  copyright, 
  socialIcons = [], 
  socialMedia = [],
  links = [], 
  contact = {},
  style = {} 
}) {
  console.log('🔍 Footer - copyright:', copyright, 'socialIcons:', socialIcons, 'socialMedia:', socialMedia, 'links:', links, 'contact:', contact);
  
  // Use socialMedia first, then fall back to socialIcons
  const socialItems = socialMedia.length > 0 ? socialMedia : socialIcons;
  
  // Ensure socialIcons is a valid array
  const safeSocialIcons = Array.isArray(socialItems) ? socialItems.filter(icon => 
    icon && typeof icon === 'object' && (icon.name || icon.platform) && (icon.href || icon.link)
  ) : [];

  // Ensure links is a valid array
  const safeLinks = Array.isArray(links) ? links.filter(link => 
    link && typeof link === 'object' && (link.label || link.text) && (link.link || link.href)
  ) : [];

  // Handle contact info
  const renderContactInfo = () => {
    if (!contact || typeof contact !== 'object') return null;
    
    return (
      <div className="text-center mb-4">
        {contact.email && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Email:</span> {contact.email}
          </p>
        )}
        {contact.phone && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Phone:</span> {contact.phone}
          </p>
        )}
        {contact.address && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Address:</span> {contact.address}
          </p>
        )}
      </div>
    );
  };

  return (
    <footer className="bg-gray-50 text-center py-8 rounded-lg" style={style}>
      {renderContactInfo()}
      
      <div className="flex justify-center space-x-4 mb-4">
        {safeSocialIcons.length > 0 ? safeSocialIcons.map(icon => (
          <a 
            key={icon.name || icon.platform} 
            href={icon.href || icon.link} 
            className="inline-block text-blue-600 hover:text-blue-800" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {icon.icon ? (
              <img src={icon.icon} alt={icon.name || icon.platform} className="h-6 w-6 inline" />
            ) : (
              <span className="text-sm font-medium">{icon.name || icon.platform}</span>
            )}
          </a>
        )) : null}
      </div>
      
      {safeLinks.length > 0 && (
        <div className="flex justify-center space-x-6 mb-4">
          {safeLinks.map(link => (
            <a 
              key={link.label || link.text} 
              href={link.link || link.href} 
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              {link.label || link.text}
            </a>
          ))}
        </div>
      )}
      
      <div className="text-gray-500 text-sm">{copyright || ""}</div>
    </footer>
  );
} 