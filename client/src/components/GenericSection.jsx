import React from "react";

// Helper: Render a sidebar menu
function SidebarMenu({ menuItems }) {
  return (
    <nav className="flex flex-col space-y-2">
      {menuItems.map((item, idx) => (
        <a
          key={idx}
          href={item.href}
          className="flex items-center px-3 py-2 rounded hover:bg-purple-100 text-purple-700 font-medium"
        >
          {item.icon && (
            <span className="material-icons mr-2">{item.icon}</span>
          )}
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// Helper: Render cards for content sections
function ContentSections({ sections }) {
  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <div key={idx} className="bg-white rounded shadow p-4">
          <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
          {Array.isArray(section.data) && (
            <ul className="space-y-2">
              {section.data.map((item, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{item.courseName || item.assignmentName}</span>
                  {item.progress !== undefined && (
                    <span className="ml-2 text-xs text-gray-500">
                      Progress: {item.progress}%
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default function GenericSection({ type, menuItems, sections, ...props }) {
  // Sidebar
  if (type === "sidebar" && Array.isArray(menuItems)) {
    return (
      <aside className="bg-purple-50 rounded-lg shadow p-4 w-full">
        <SidebarMenu menuItems={menuItems} />
      </aside>
    );
  }

  // Content with cards
  if (type === "content" && Array.isArray(sections)) {
    return (
      <section className="w-full">
        <ContentSections sections={sections} />
      </section>
    );
  }

  // Fallback: show JSON
  return (
    <section className="bg-white rounded-lg shadow p-6 w-full border border-dashed border-purple-300 my-2">
      <div className="text-purple-700 font-semibold mb-2">
        {type ? `Custom Section: ${type}` : "Custom Section"}
      </div>
      <pre className="text-xs text-gray-500 bg-gray-50 rounded p-2 overflow-x-auto">
        {JSON.stringify({ menuItems, sections, ...props }, null, 2)}
      </pre>
    </section>
  );
} 