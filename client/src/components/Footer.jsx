import React from "react";

export default function Footer({ copyright, socialIcons = [], style = {} }) {
  return (
    <footer className="text-center py-4 rounded-lg" style={style}>
      <div className="flex justify-center space-x-4 mb-2">
        {socialIcons.length > 0 ? socialIcons.map(icon => (
          <a key={icon.name} href={icon.href} className="inline-block" target="_blank" rel="noopener noreferrer">
            <img src={icon.icon} alt={icon.name} className="h-6 w-6 inline" />
          </a>
        )) : null}
      </div>
      <div className="text-gray-500 text-sm">{copyright || ""}</div>
    </footer>
  );
} 