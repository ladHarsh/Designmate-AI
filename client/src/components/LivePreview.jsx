import React, { useState } from "react";
import {
  EyeIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const LivePreview = ({ layout }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to escape HTML in JSON display
  const escapeHtml = (text) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // Helper function to display full JSON response when htmlCode is not available
  const generateJSONPreviewHTML = (layoutData) => {
    const jsonString = JSON.stringify(layoutData, null, 2);
    const escapedJson = escapeHtml(jsonString);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${
      layoutData.title || layoutData.name || "Full Response Preview"
    } - DesignMate</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #e2e8f0;
            line-height: 1.6;
            padding: 30px 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 20px 25px rgba(0,0,0,0.3);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .response-container {
            background: #1e293b;
            border: 2px solid #334155;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 25px rgba(0,0,0,0.3);
            margin-bottom: 30px;
        }
        
        .response-header {
            background: #0f172a;
            padding: 20px 30px;
            border-bottom: 2px solid #334155;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .response-header h2 {
            font-size: 1.3rem;
            color: #60a5fa;
        }
        
        .copy-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            white-space: nowrap;
        }
        
        .copy-btn:hover {
            background: #2563eb;
            transform: translateY(-2px);
        }
        
        .json-content {
            padding: 30px;
            overflow-x: auto;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        pre {
            background: #0f172a;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #60a5fa;
            font-size: 0.85rem;
            line-height: 1.6;
            color: #e2e8f0;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #1e293b;
            border: 2px solid #334155;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        
        .stat-label {
            color: #94a3b8;
            font-size: 0.9rem;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .stat-value {
            font-size: 1.5rem;
            color: #60a5fa;
            font-weight: 700;
            word-break: break-word;
        }
        
        .footer {
            margin-top: 30px;
            padding: 20px;
            background: #0f172a;
            border-radius: 12px;
            text-align: center;
            color: #94a3b8;
            font-size: 0.9rem;
        }
        
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1e293b;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Full DesignMate Response Preview</h1>
            <p>Complete layout generation response from AI</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Layout Type</div>
                <div class="stat-value">${layoutData.layoutType || "N/A"}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Style</div>
                <div class="stat-value">${layoutData.style || "N/A"}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Industry</div>
                <div class="stat-value">${layoutData.industry || "N/A"}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Components</div>
                <div class="stat-value">${
                  layoutData.components?.length || 0
                }</div>
            </div>
        </div>
        
        <div class="response-container">
            <div class="response-header">
                <h2>Complete API Response (Full Data)</h2>
                <button class="copy-btn" onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent); alert('Copied to clipboard!');">
                    📋 Copy JSON
                </button>
            </div>
            <div class="json-content">
                <pre>${escapedJson}</pre>
            </div>
        </div>
        
        <div class="footer">
            Generated by DesignMate AI | ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
  };

  const generateCompleteHTML = (layoutData) => {
    console.log("LivePreview: generateCompleteHTML called with layout:", {
      hasHtmlCode: !!layoutData.htmlCode,
      htmlCodeType: typeof layoutData.htmlCode,
      htmlCodeLength: layoutData.htmlCode?.length,
      layoutName: layoutData.name || layoutData.title,
    });

    // If backend provided HTML, use it
    if (layoutData.htmlCode && typeof layoutData.htmlCode === "string") {
      let raw = layoutData.htmlCode.trim();
      const cssFallback = (layoutData.cssCode || "").trim();

      console.log("LivePreview: Using provided HTML code, length:", raw.length);

      // Clean up escaped characters and newlines
      raw = raw
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\r/g, "\r")
        .replace(/\\\\/g, "\\");

      // Try to parse as JSON first
      if (raw.startsWith("{")) {
        try {
          const parsed = JSON.parse(raw);

          if (parsed && typeof parsed.html === "string") {
            let html = parsed.html;
            // Clean up escaped characters in HTML
            html = html
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")
              .replace(/\\"/g, '"')
              .replace(/\\'/g, "'");
            const css =
              typeof parsed.css === "string"
                ? parsed.css
                    .replace(/\\n/g, "\n")
                    .replace(/\\t/g, "\t")
                    .replace(/\\"/g, '"')
                    .replace(/\\'/g, "'")
                : cssFallback;

            const isDoc = /<!DOCTYPE|<html[\s>]/i.test(html);

            if (isDoc) {
              if (
                css &&
                /<head[\s>]/i.test(html) &&
                !/<style[\s>]/i.test(html)
              ) {
                return html.replace(
                  /<\/head>/i,
                  `<style>${css}</style></head>`
                );
              }
              return html;
            }

            // Wrap fragment with CSS
            return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${
              css ? `<style>${css}</style>` : ""
            }</head><body>${html}</body></html>`;
          }
        } catch (error) {
          console.log("LivePreview: JSON parse failed, treating as plain HTML");
        }
      }

      // Treat as plain HTML (document or fragment)
      const isDoc = /<!DOCTYPE|<html[\s>]/i.test(raw);
      if (isDoc) {
        // If it's a complete document, return as-is
        const hasHeadTags = /<head[\s>]/i.test(raw) && /<\/head>/i.test(raw);
        const hasBodyTags = /<body[\s>]/i.test(raw) && /<\/body>/i.test(raw);

        if (hasHeadTags && hasBodyTags) {
          console.log(
            "LivePreview: Complete HTML document detected - displaying as-is"
          );
          return raw;
        }

        // Wrap incomplete documents
        console.warn("LivePreview: Incomplete HTML structure, wrapping...");
        const cssReset = `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
          img { max-width: 100%; height: auto; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        `;
        return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${
          layoutData.title || layoutData.name || "Generated Layout"
        }</title><style>${cssReset}</style>${
          cssFallback ? `<style>${cssFallback}</style>` : ""
        }</head><body>${raw}</body></html>`;
      }

      // Treat as HTML fragment
      console.log(
        "LivePreview: HTML fragment detected - wrapping with document structure"
      );
      const cssReset = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        img { max-width: 100%; height: auto; display: block; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `;
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${
        layoutData.title || layoutData.name || "Generated Layout"
      }</title><style>${cssReset}</style>${
        cssFallback ? `<style>${cssFallback}</style>` : ""
      }</head><body>${raw}</body></html>`;
    }

    // Fallback: If no HTML code, display full response as JSON
    console.log(
      "LivePreview: No htmlCode available, displaying full response as JSON"
    );

    return generateJSONPreviewHTML(layoutData);
  };

  const openLivePreview = async () => {
    if (!layout) return;

    setIsGenerating(true);

    try {
      const htmlContent = generateCompleteHTML(layout);

      const newWindow = window.open(
        "",
        "_blank",
        "width=1400,height=900,scrollbars=yes,resizable=yes"
      );

      if (newWindow) {
        try {
          newWindow.document.open("text/html", "replace");
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          newWindow.focus();

          newWindow.addEventListener("error", (event) => {
            console.error("LivePreview error:", event.error);
          });
        } catch (error) {
          console.error("Error writing to LivePreview window:", error);
          alert("Error rendering preview. Please try again.");
        }

        setTimeout(() => {
          try {
            if (
              newWindow.document.body &&
              newWindow.document.body.innerHTML.trim() === ""
            ) {
              console.warn("LivePreview: Empty body detected, reloading...");
              newWindow.location.reload();
            } else {
              void newWindow.document.body.offsetHeight;
            }
          } catch (e) {
            console.error("Error during post-render check:", e);
          }
        }, 200);
      } else {
        alert("Unable to open preview window. Please check popup settings.");
      }
    } catch (error) {
      console.error("Error opening live preview:", error);
      alert("Error opening live preview. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={openLivePreview}
      disabled={isGenerating}
      className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Generating Preview...
        </>
      ) : (
        <>
          <EyeIcon className="h-4 w-4 mr-2" />
          Live Preview
          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
        </>
      )}
    </button>
  );
};

export default LivePreview;
