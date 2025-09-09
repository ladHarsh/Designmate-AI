import React, { useState } from 'react';
import { EyeIcon, DocumentTextIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

const HTMLPreview = ({ layout }) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Generate HTML/CSS if not available (for existing layouts)
  const generateHTMLCSS = (layout) => {
    if (layout.htmlCode && layout.cssCode) {
      return { html: layout.htmlCode, css: layout.cssCode };
    }
    
    // Generate fallback HTML/CSS for existing layouts
    const colors = layout.colors || {};
    const fonts = layout.fonts || {};
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${layout.title || 'Generated Layout'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: ${fonts.body || 'Inter, Arial, sans-serif'}; 
            background-color: ${colors.background || '#ffffff'};
            color: ${colors.text || '#1F2937'};
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: ${colors.primary || '#3B82F6'}; 
            color: white; 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header h1 { color: white; margin-bottom: 10px; font-size: 2.5rem; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .components { display: grid; gap: 30px; margin-top: 30px; }
        .component { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-left: 5px solid ${colors.primary || '#3B82F6'};
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .component:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 30px rgba(0,0,0,0.12); 
        }
        .component h2 { 
            color: ${colors.primary || '#3B82F6'}; 
            margin-bottom: 15px; 
            font-size: 1.8rem;
            font-weight: 600;
        }
        .component h3 { 
            color: ${colors.secondary || '#64748B'}; 
            margin-bottom: 10px; 
            font-size: 1.2rem;
        }
        .component p { 
            color: #6B7280; 
            margin-bottom: 15px; 
            line-height: 1.7;
        }
        .hero-section {
            background: linear-gradient(135deg, ${colors.primary || '#3B82F6'}, ${colors.secondary || '#64748B'});
            color: white;
            padding: 60px 30px;
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
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .nav-links {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        .nav-links a {
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 20px;
            background: rgba(255,255,255,0.1);
            transition: background 0.3s ease;
        }
        .nav-links a:hover {
            background: rgba(255,255,255,0.2);
        }
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
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
            font-weight: 600;
            margin-bottom: 10px;
            color: ${colors.primary || '#3B82F6'};
        }
        .card-description {
            color: #6B7280;
            font-size: 0.9rem;
        }
        .footer {
            background: #1F2937;
            color: white;
            padding: 40px 30px;
            text-align: center;
            margin-top: 40px;
            border-radius: 15px;
        }
        .footer-links {
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }
        .footer-links a {
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        .footer-links a:hover {
            color: ${colors.accent || '#F59E0B'};
        }
        .social-links {
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        .social-links a {
            color: white;
            text-decoration: none;
            padding: 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            transition: background 0.3s ease;
        }
        .social-links a:hover {
            background: ${colors.primary || '#3B82F6'};
        }
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .components { grid-template-columns: 1fr; }
            .hero-title { font-size: 2rem; }
            .nav-links { justify-content: center; }
            .footer-links { flex-direction: column; gap: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${layout.title || 'Generated Layout'}</h1>
            <p>${layout.description || 'This is a generated layout.'}</p>
        </div>
        <div class="components">
            ${layout.components?.map(comp => generateComponentHTML(comp)).join('') || ''}
        </div>
    </div>
</body>
</html>`;

    const css = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: ${fonts.body || 'Inter, Arial, sans-serif'}; 
            background-color: ${colors.background || '#ffffff'};
            color: ${colors.text || '#1F2937'};
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: ${colors.primary || '#3B82F6'}; 
            color: white; 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header h1 { color: white; margin-bottom: 10px; font-size: 2.5rem; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .components { display: grid; gap: 30px; margin-top: 30px; }
        .component { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-left: 5px solid ${colors.primary || '#3B82F6'};
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .component:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 30px rgba(0,0,0,0.12); 
        }
        .component h2 { 
            color: ${colors.primary || '#3B82F6'}; 
            margin-bottom: 15px; 
            font-size: 1.8rem;
            font-weight: 600;
        }
        .component h3 { 
            color: ${colors.secondary || '#64748B'}; 
            margin-bottom: 10px; 
            font-size: 1.2rem;
        }
        .component p { 
            color: #6B7280; 
            margin-bottom: 15px; 
            line-height: 1.7;
        }
        .hero-section {
            background: linear-gradient(135deg, ${colors.primary || '#3B82F6'}, ${colors.secondary || '#64748B'});
            color: white;
            padding: 60px 30px;
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
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .nav-links {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        .nav-links a {
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 20px;
            background: rgba(255,255,255,0.1);
            transition: background 0.3s ease;
        }
        .nav-links a:hover {
            background: rgba(255,255,255,0.2);
        }
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
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
            font-weight: 600;
            margin-bottom: 10px;
            color: ${colors.primary || '#3B82F6'};
        }
        .card-description {
            color: #6B7280;
            font-size: 0.9rem;
        }
        .footer {
            background: #1F2937;
            color: white;
            padding: 40px 30px;
            text-align: center;
            margin-top: 40px;
            border-radius: 15px;
        }
        .footer-links {
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }
        .footer-links a {
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        .footer-links a:hover {
            color: ${colors.accent || '#F59E0B'};
        }
        .social-links {
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        .social-links a {
            color: white;
            text-decoration: none;
            padding: 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            transition: background 0.3s ease;
        }
        .social-links a:hover {
            background: ${colors.primary || '#3B82F6'};
        }
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .components { grid-template-columns: 1fr; }
            .hero-title { font-size: 2rem; }
            .nav-links { justify-content: center; }
            .footer-links { flex-direction: column; gap: 15px; }
        }
    `;
    
    return { html, css };
  };

  const generateComponentHTML = (component) => {
    const props = component.props || {};
    const colors = layout.colors || {};
    
    switch (component.type) {
      case 'header':
        return `
          <div class="component header-component">
            <h2>${props.title || 'Header'}</h2>
            <p>${props.content || 'Navigation and branding section'}</p>
            ${props.navigation ? `
              <div class="nav-links">
                ${props.navigation.map(nav => `
                  <a href="${nav.href || '#'}">${nav.label}</a>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      
      case 'hero':
        return `
          <div class="component hero-component">
            <div class="hero-section">
              <h1 class="hero-title">${props.title || 'Welcome'}</h1>
              <p class="hero-subtitle">${props.subtitle || props.content || 'Hero section content'}</p>
              ${props.ctaText ? `<button class="cta-button">${props.ctaText}</button>` : ''}
            </div>
          </div>
        `;
      
      case 'cardgrid':
        const items = props.items || props.cards || props.destinations || [];
        return `
          <div class="component cardgrid-component">
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
                    ${item.price ? `<p><strong>Price:</strong> $${item.price}</p>` : ''}
                    ${item.rating ? `<p><strong>Rating:</strong> ${item.rating}/5</p>` : ''}
                  </div>
                </div>
              `).join('') : '<p>No items available</p>'}
            </div>
          </div>
        `;
      
      case 'section':
        return `
          <div class="component section-component">
            <h2>${props.title || 'Section'}</h2>
            <p>${props.content || 'Section content'}</p>
            ${props.image ? `<img src="${props.image}" alt="Section image" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;">` : ''}
          </div>
        `;
      
      case 'tripstable':
        const data = props.data || props.items || [];
        return `
          <div class="component tripstable-component">
            <h2>${props.title || 'Data Table'}</h2>
            <p>${props.content || 'Tabular data display'}</p>
            ${data.length > 0 ? `
              <table class="data-table" style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <thead>
                  <tr style="background: ${colors.primary || '#3B82F6'}; color: white;">
                    ${Object.keys(data[0] || {}).map(key => `<th style="padding: 15px; text-align: left;">${key}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr style="border-bottom: 1px solid #eee;">
                      ${Object.values(row).map(value => `<td style="padding: 15px;">${value}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>No data available</p>'}
          </div>
        `;
      
      case 'footer':
        return `
          <div class="component footer-component">
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
          </div>
        `;
      
      default:
        return `
          <div class="component ${component.type}-component">
            <h2>${props.title || component.type}</h2>
            <p>${props.content || 'Component content'}</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 0.9rem;">
              ${JSON.stringify(props, null, 2)}
            </pre>
          </div>
        `;
    }
  };

  const htmlCssData = generateHTMLCSS(layout);

  const tabs = [
    { id: 'preview', label: 'Preview', icon: EyeIcon },
    { id: 'html', label: 'HTML', icon: DocumentTextIcon },
    { id: 'css', label: 'CSS', icon: CodeBracketIcon }
  ];

  const openPreview = () => {
    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    newWindow.document.write(htmlCssData.html);
    newWindow.document.close();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">HTML/CSS Code</h3>
        </div>
        <button
          onClick={openPreview}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview HTML
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Live Preview</h4>
              <p className="text-sm text-gray-600 mb-3">
                Click "Preview HTML" above to open the complete HTML page in a new window.
              </p>
              <div className="bg-white border rounded-lg p-4 max-h-64 overflow-auto">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: htmlCssData.html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') 
                  }} 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'html' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">HTML Code</h4>
              <button
                onClick={() => copyToClipboard(htmlCssData.html)}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
              >
                Copy HTML
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-sm whitespace-pre-wrap">{htmlCssData.html}</pre>
            </div>
          </div>
        )}

        {activeTab === 'css' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">CSS Code</h4>
              <button
                onClick={() => copyToClipboard(htmlCssData.css)}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
              >
                Copy CSS
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-sm whitespace-pre-wrap">{htmlCssData.css}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HTMLPreview;
