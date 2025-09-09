import React, { useState } from 'react';
import { EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const LivePreview = ({ layout }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const openLivePreview = async () => {
    if (!layout) return;
    
    setIsGenerating(true);
    
    try {
      // Debug logging
      console.log('🔍 LivePreview: Layout data:', layout);
      console.log('🔍 LivePreview: HTML Code type:', typeof layout.htmlCode);
      console.log('🔍 LivePreview: HTML Code length:', layout.htmlCode?.length);
      console.log('🔍 LivePreview: HTML Code preview:', layout.htmlCode?.substring(0, 200));
      
      // Create a complete HTML page with the layout data
      const htmlContent = generateCompleteHTML(layout);
      
      console.log('🔍 LivePreview: Generated HTML length:', htmlContent.length);
      console.log('🔍 LivePreview: Generated HTML preview:', htmlContent.substring(0, 200));
      
      // Open in new window/tab
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (newWindow) {
        // Clear any existing content and set proper content type
        newWindow.document.open('text/html', 'replace');
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        newWindow.focus();
        
        // Add a small delay to ensure content is rendered
        setTimeout(() => {
          console.log('🔍 LivePreview: Checking content after delay');
          console.log('🔍 LivePreview: Document body exists:', !!newWindow.document.body);
          console.log('🔍 LivePreview: Body innerHTML length:', newWindow.document.body?.innerHTML?.length);
          console.log('🔍 LivePreview: Body innerHTML preview:', newWindow.document.body?.innerHTML?.substring(0, 200));
          
          if (newWindow.document.body && newWindow.document.body.innerHTML.trim() === '') {
            console.warn('⚠️ LivePreview: Content not rendered, trying alternative method');
            newWindow.location.reload();
          } else {
            console.log('✅ LivePreview: Content rendered successfully');
            // Force a reflow to ensure styles are applied
            void newWindow.document.body.offsetHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error opening live preview:', error);
      alert('Error opening live preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCompleteHTML = (layout) => {
    // If backend provided HTML, prefer it. Also handle JSON-wrapped { html, css } strings.
    if (layout.htmlCode && typeof layout.htmlCode === 'string') {
      let raw = layout.htmlCode.trim();
      const cssFallback = (layout.cssCode || '').trim();

      // Clean up escaped characters and newlines
      raw = raw
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');

      // Try to parse as JSON first
      if (raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          console.log('🔍 LivePreview: Parsed JSON response:', Object.keys(parsed));
          
          if (parsed && typeof parsed.html === 'string') {
            let html = parsed.html;
            // Clean up escaped characters in HTML
            html = html.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'");
            const css = typeof parsed.css === 'string' ? parsed.css.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'") : cssFallback;
            
            console.log('🔍 LivePreview: Extracted HTML length:', html.length);
            console.log('🔍 LivePreview: Extracted CSS length:', css.length);
            
            const hasHead = /<head[\s>]/i.test(html);
            const hasStyle = /<style[\s>][\s\S]*?<\/style>/i.test(html);
            const isDoc = /<!DOCTYPE|<html[\s>]/i.test(html);
            
            if (isDoc) {
              console.log('🔍 LivePreview: Complete HTML document detected');
              if (css && hasHead && !hasStyle) {
                console.log('🔍 LivePreview: Adding CSS to existing head');
                return html.replace(/<\/head>/i, `<style>${css}</style></head>`);
              }
              return html;
            }
            
            // Wrap fragment with CSS
            console.log('🔍 LivePreview: Wrapping HTML fragment with CSS');
            return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${css ? `<style>${css}</style>` : ''}</head><body>${html}</body></html>`;
          }
        } catch (error) {
          console.error('🔍 LivePreview: JSON parsing failed:', error);
          // fall through
        }
      }

      // Treat as plain HTML (document or fragment)
      const isDoc = /<!DOCTYPE|<html[\s>]/i.test(raw);
      if (isDoc) {
        console.log('🔍 LivePreview: Detected complete HTML document');
        // Validate HTML structure
        const hasHead = /<head[\s>]/i.test(raw);
        const hasBody = /<body[\s>]/i.test(raw);
        const hasStyle = /<style[\s>][\s\S]*?<\/style>/i.test(raw);
        
        console.log('🔍 LivePreview: HTML validation:', { hasHead, hasBody, hasStyle });
        
        if (!hasHead || !hasBody) {
          console.warn('⚠️ LivePreview: Incomplete HTML structure, wrapping');
          const cssReset = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            img { max-width: 100%; height: auto; }
          `;
          return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${cssReset}</style>${cssFallback ? `<style>${cssFallback}</style>` : ''}</head><body>${raw}</body></html>`;
        }
        
        // Add CSS reset to existing HTML if it doesn't have proper styling
        if (!hasStyle) {
          console.log('🔍 LivePreview: Adding CSS reset to existing HTML');
          const cssReset = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            img { max-width: 100%; height: auto; }
          `;
          return raw.replace(/<\/head>/i, `<style>${cssReset}</style></head>`);
        }
        
        return raw;
      }
      
      console.log('🔍 LivePreview: Wrapping HTML fragment');
      const cssReset = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        img { max-width: 100%; height: auto; }
      `;
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${cssReset}</style>${cssFallback ? `<style>${cssFallback}</style>` : ''}</head><body>${raw}</body></html>`;
    }

    // Fallback: Generate HTML from components array
    const colors = layout.colors || {};
    const fonts = layout.fonts || {};
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${layout.title || 'Generated Layout'} - Live Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fonts.body || 'Inter, Arial, sans-serif'};
            background-color: ${colors.background || '#ffffff'};
            color: ${colors.text || '#1F2937'};
            line-height: 1.6;
        }
        
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .preview-header {
            background: linear-gradient(135deg, ${colors.primary || '#3B82F6'}, ${colors.secondary || '#64748B'});
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .preview-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .preview-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .layout-preview {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-bottom: 30px;
        }
        
        .component {
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .component:last-child {
            border-bottom: none;
        }
        
        .component-header {
            background: ${colors.primary || '#3B82F6'};
            color: white;
            padding: 15px 20px;
            margin: -20px -20px 20px -20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9rem;
        }
        
        .component h2 {
            color: ${colors.primary || '#3B82F6'};
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        
        .component h3 {
            color: ${colors.secondary || '#64748B'};
            margin-bottom: 10px;
            font-size: 1.2rem;
        }
        
        .component p {
            margin-bottom: 15px;
            color: #666;
        }
        
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 0.9rem;
        }
        
        .card-content {
            padding: 20px;
        }
        
        .card-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: ${colors.primary || '#3B82F6'};
        }
        
        .card-description {
            color: #666;
            font-size: 0.9rem;
        }
        
        .hero-section {
            background: linear-gradient(135deg, ${colors.primary || '#3B82F6'}, ${colors.secondary || '#64748B'});
            color: white;
            padding: 60px 20px;
            text-align: center;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .hero-title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .hero-subtitle {
            font-size: 1.3rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .cta-button {
            background: white;
            color: ${colors.primary || '#3B82F6'};
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .data-table th,
        .data-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        .data-table th {
            background: ${colors.primary || '#3B82F6'};
            color: white;
            font-weight: bold;
        }
        
        .footer {
            background: #333;
            color: white;
            padding: 40px 20px;
            text-align: center;
            margin-top: 40px;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            color: white;
            text-decoration: none;
            margin: 0 15px;
        }
        
        .footer-links a:hover {
            text-decoration: underline;
        }
        
        .metadata-section {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .metadata-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .metadata-label {
            font-weight: bold;
            color: ${colors.primary || '#3B82F6'};
            margin-bottom: 10px;
        }
        
        .metadata-value {
            color: #666;
            font-size: 0.9rem;
        }
        
        .json-viewer {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
            margin: 20px 0;
        }
        
        @media (max-width: 768px) {
            .preview-container {
                padding: 10px;
            }
            
            .preview-title {
                font-size: 2rem;
            }
            
            .hero-title {
                font-size: 2rem;
            }
            
            .card-grid {
                grid-template-columns: 1fr;
            }
            
            .metadata-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <!-- Preview Header -->
        <div class="preview-header">
            <h1 class="preview-title">${layout.title || 'Generated Layout'}</h1>
            <p class="preview-subtitle">${layout.description || 'Live Preview of Generated Layout'}</p>
        </div>
        
        <!-- Layout Preview -->
        <div class="layout-preview">
            ${generateLayoutComponents(layout)}
        </div>
        
        <!-- Metadata Section -->
        <div class="metadata-section">
            <h2>Layout Information</h2>
            <div class="metadata-grid">
                <div class="metadata-item">
                    <div class="metadata-label">Layout Type</div>
                    <div class="metadata-value">${layout.layoutType || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Style</div>
                    <div class="metadata-value">${layout.style || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Components</div>
                    <div class="metadata-value">${layout.components?.length || 0} components</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Generated At</div>
                    <div class="metadata-value">${new Date().toLocaleString()}</div>
                </div>
            </div>
        </div>
        
        <!-- JSON Data Section -->
        <div class="metadata-section">
            <h2>Complete API Response</h2>
            <div class="json-viewer">
                <pre>${JSON.stringify(layout, null, 2)}</pre>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const generateLayoutComponents = (layout) => {
    if (!layout.components || !Array.isArray(layout.components)) {
      return '<div class="component"><p>No components available</p></div>';
    }

    return layout.components.map((component, index) => {
      const componentType = component.type || 'unknown';
      const props = component.props || {};
      
      return `
        <div class="component">
          <div class="component-header">${componentType.toUpperCase()}</div>
          ${generateComponentContent(componentType, props, layout)}
        </div>
      `;
    }).join('');
  };

  const generateComponentContent = (type, props, layout) => {
    switch (type) {
      case 'header':
        return `
          <h2>${props.title || props.logo || 'Header'}</h2>
          ${Array.isArray(props.navigation) ? `
            <div class="nav-links">
              ${props.navigation.map(nav => `
                <a href="${nav.link || nav.href || '#'}">${nav.label || nav.text}</a>
              `).join('')}
            </div>
          ` : ''}
          ${props.user && Array.isArray(props.user.actions) ? `
            <div class="nav-links" style="margin-top:8px">
              ${props.user.actions.map(a => `<a href="${a.link || a.href || '#'}">${a.label || a.text}</a>`).join('')}
            </div>
          ` : ''}
        `;
      
      case 'hero':
        return `
          <div class="hero-section" style="${props.backgroundImage ? `background-image: linear-gradient(135deg, rgba(0,0,0,.25), rgba(0,0,0,.25)), url('${props.backgroundImage}'); background-size: cover; background-position: center;` : ''}">
            <h1 class="hero-title">${props.title || 'Welcome'}</h1>
            <p class="hero-subtitle">${props.subtitle || props.content || 'Hero section content'}</p>
            ${props.ctaText ? `<a href="${props.ctaLink || '#'}" class="cta-button">${props.ctaText}</a>` : (props.cta && props.cta.label ? `<a href="${props.cta.link || '#'}" class="cta-button">${props.cta.label}</a>` : '')}
          </div>
        `;
      
      case 'cardgrid':
        const items = props.items || props.cards || props.destinations || [];
        return `
          <h2>${props.title || 'Card Grid'}</h2>
          <p>${props.content || 'Grid of cards or items'}</p>
          <div class="card-grid">
            ${items.length > 0 ? items.map(item => `
              <div class="card">
                <div class="card-image">
                  ${item.image ? `<img src="${item.image}" alt="${item.title || 'Card'}" style="width: 100%; height: 100%; object-fit: cover;">` : 'Image Placeholder'}
                </div>
                <div class="card-content">
                  <div class="card-title">${item.title || item.name || 'Item'}</div>
                  <div class="card-description">${item.description || item.content || 'Description'}</div>
                  ${item.price ? `<p><strong>Price:</strong> ${/^\$/.test(String(item.price)) ? item.price : `$${item.price}`}</p>` : ''}
                  ${item.rating ? `<p><strong>Rating:</strong> ${item.rating}/5</p>` : ''}
                  ${item.link ? `<div style="margin-top:10px"><a href="${item.link}" class="cta-button" style="padding:8px 16px">Listen Now</a></div>` : ''}
                </div>
              </div>
            `).join('') : '<p>No items available</p>'}
          </div>
        `;
      
      case 'section':
        return `
          <h2>${props.title || 'Section'}</h2>
          <p>${props.content || 'Section content'}</p>
          ${props.image ? `<img src="${props.image}" alt="Section image" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;">` : ''}
        `;
      
      case 'tripstable':
        const data = props.data || props.items || [];
        const columns = Array.isArray(props.columns) && props.columns.length ? props.columns : (data.length ? Object.keys(data[0]) : []);
        return `
          <h2>${props.title || 'Data Table'}</h2>
          <p>${props.content || 'Tabular data display'}</p>
          ${data.length > 0 ? `
            <table class="data-table" style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: ${layout.colors?.primary || '#3B82F6'}; color: white;">
                  ${columns.map(key => `<th style="padding: 15px; text-align: left;">${key}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr style="border-bottom: 1px solid #eee;">
                    ${columns.map(col => `<td style="padding: 15px;">${row[col.toLowerCase()] ?? row[col] ?? ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>No data available</p>'}
        `;
      
      case 'footer':
        return `
          <div class="footer">
            <h2>${props.title || 'Footer'}</h2>
            <p>${props.content || 'Footer content and links'}</p>
            ${props.links ? `
              <div class="footer-links">
                ${props.links.map(link => `
                  <a href="${link.href || '#'}">${link.label}</a>
                `).join('')}
              </div>
            ` : ''}
            ${props.socialMedia ? `
              <div class="social-links">
                ${props.socialMedia.map(social => `
                  <a href="${social.href || '#'}">${social.platform}</a>
                `).join('')}
              </div>
            ` : ''}
            <p>&copy; 2024 ${props.title || 'Company'}. All rights reserved.</p>
          </div>
        `;
      
      default:
        return `
          <h2>${props.title || type}</h2>
          <p>${props.content || 'Component content'}</p>
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 0.9rem;">
            ${JSON.stringify(props, null, 2)}
          </pre>
        `;
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