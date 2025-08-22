import React from "react";

export default function Section({ title, content, style = {}, children, ...rest }) {
  return (
    <section className="bg-white rounded-lg shadow p-6 w-full" style={style}>
      {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}
      {content && <div className="text-gray-700 mb-2">{content}</div>}
      {children}
      {/* Render any extra props as JSON for debugging (optional) */}
      {/* <pre className="text-xs text-gray-400 mt-2">{JSON.stringify(rest, null, 2)}</pre> */}
    </section>
  );
} 