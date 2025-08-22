import React from "react";

export default function Header({ logo = {}, navigationLinks = [], profileDropdown = {}, style = {} }) {
  return (
    <header className="flex items-center justify-between bg-white shadow p-4 rounded-lg" style={style}>
      <div className="flex items-center">
        {logo.src ? (
          <img src={logo.src} alt={logo.alt || "Logo"} className="h-10 w-auto mr-4" />
        ) : null}
        <nav className="flex space-x-4">
          {navigationLinks.length > 0 ? navigationLinks.map(link => (
            <a key={link.href} href={link.href} className="text-gray-700 hover:text-blue-600 font-medium">
              {link.label}
            </a>
          )) : null}
        </nav>
      </div>
      {profileDropdown.username ? (
        <div className="flex items-center space-x-2">
          {profileDropdown.avatar && (
            <img src={profileDropdown.avatar} alt={profileDropdown.username} className="h-8 w-8 rounded-full" />
          )}
          <span className="font-semibold text-gray-800">{profileDropdown.username}</span>
          {profileDropdown.menuItems && profileDropdown.menuItems.length > 0 && (
            <div className="ml-2 relative group">
              <button className="focus:outline-none">▼</button>
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {profileDropdown.menuItems.map(item => (
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