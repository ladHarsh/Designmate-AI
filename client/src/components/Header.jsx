import React from "react";

export default function Header({ 
  logo, 
  navigation = [], 
  navigationLinks = [], 
  profileDropdown = {}, 
  style = {} 
}) {
  console.log('🔍 Header - logo:', logo, 'navigation:', navigation, 'navigationLinks:', navigationLinks);
  
  // Use navigation first, then fall back to navigationLinks
  const navItems = navigation.length > 0 ? navigation : navigationLinks;
  
  // Ensure all props are valid objects/arrays
  const safeLogo = logo && typeof logo === 'object' ? logo : (typeof logo === 'string' ? { text: logo } : {});
  const safeNavigationLinks = Array.isArray(navItems) ? navItems.filter(link => 
    link && typeof link === 'object' && (link.href || link.link) && (link.label || link.text)
  ) : [];
  const safeProfileDropdown = profileDropdown && typeof profileDropdown === 'object' ? profileDropdown : {};

  return (
    <header className="flex items-center justify-between bg-white shadow p-4 rounded-lg" style={style}>
      <div className="flex items-center">
        {safeLogo.src ? (
          <img src={safeLogo.src} alt={safeLogo.alt || "Logo"} className="h-10 w-auto mr-4" />
        ) : safeLogo.text ? (
          <span className="text-2xl font-bold text-blue-600 mr-4">{safeLogo.text}</span>
        ) : null}
        <nav className="flex space-x-4">
          {safeNavigationLinks.length > 0 ? safeNavigationLinks.map(link => (
            <a 
              key={link.href || link.link} 
              href={link.href || link.link} 
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              {link.label || link.text}
            </a>
          )) : null}
        </nav>
      </div>
      {safeProfileDropdown.username ? (
        <div className="flex items-center space-x-2">
          {safeProfileDropdown.avatar && (
            <img src={safeProfileDropdown.avatar} alt={safeProfileDropdown.username} className="h-8 w-8 rounded-full" />
          )}
          <span className="font-semibold text-gray-800">{safeProfileDropdown.username}</span>
          {safeProfileDropdown.menuItems && Array.isArray(safeProfileDropdown.menuItems) && safeProfileDropdown.menuItems.length > 0 && (
            <div className="ml-2 relative group">
              <button className="focus:outline-none">▼</button>
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {safeProfileDropdown.menuItems.filter(item => 
                  item && typeof item === 'object' && item.href && item.label
                ).map(item => (
                  <a key={item.href} href={item.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
} 