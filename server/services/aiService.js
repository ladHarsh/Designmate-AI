const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const JSON5 = require('json5');
const { z } = require('zod');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback via REST in case SDK fetch fails (proxy/cert issues)
async function generateViaAxios(modelName, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }]
      }
    ]
  };
  const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
  const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text };
}

// Generic JSON-call helper for Gemini (v1beta SDK payload shape)
async function callGeminiJSON(modelName, systemText, userText) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${systemText}\n\n${userText}`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  const result = await model.generateContent(payload);
  const text = result?.response?.text?.() || '';
  try {
    return JSON.parse(text);
  } catch (e) {
    // If model returned code fences or stray text, try to clean
    const cleaned = String(text).replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  }
}

async function callGeminiJSONWithRetry(primaryModel, systemText, userText, opts = {}) {
  const { retries = 1, backoffMs = 800, fallbackModel = (process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash') } = opts;
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await callGeminiJSON(primaryModel, systemText, userText);
    } catch (err) {
      lastError = err;
      const message = String(err?.message || err);
      const delay = backoffMs * Math.pow(2, attempt);
      // Retry on transient errors (503/overloaded/timeouts)
      if (/overloaded|503|unavailable|timeout|rate limit|busy/i.test(message)) {
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }
  // Fallback model
  try {
    console.warn(`[AI] Falling back to model: ${fallbackModel}`);
    return await callGeminiJSON(fallbackModel, systemText, userText);
  } catch (fallbackErr) {
    throw lastError || fallbackErr;
  }
}

// Brand Intelligence — Analysis
async function analyzeBrand(rawExtract) {
  const system = 'You are a senior brand strategist and web design system expert. Output must be strict JSON matching the provided schema, with no extra text.';
  const schema = `{
  "brandName": "string",
  "summary": "string",
  "tone": {"primary": "string", "adjectives": ["string"]},
  "colors": {"primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": ["#RRGGBB"], "neutrals": ["#RRGGBB"]},
  "fonts": {
    "heading": {"name": "string", "fallbacks": ["string"], "source": "google|system|file|unknown"},
    "body": {"name": "string", "fallbacks": ["string"], "source": "google|system|file|unknown"}
  },
  "imagery": {"styles": ["string"], "keywords": ["string"], "heroStyle": "string"},
  "layoutPreferences": {"density": "airy|balanced|dense", "cornerStyle": "rounded|sharp|mixed", "sectionOrder": ["Hero","Features","Testimonials","CTA","Footer"]},
  "alternatives": {"colorPalettes": [ {"name": "string", "colors": ["#RRGGBB"]} ], "fontPairs": [ {"heading": "string", "body": "string"} ]}
}`;
  const user = `Analyze the following brand raw extract and produce a BrandProfile JSON.\n\nSchema:\n${schema}\n\nInput:\n${JSON.stringify(rawExtract)}\n\nRules:\n- Derive colors from CSS variables and image palettes; normalize to hex.\n- Derive fonts from @font-face, Google Fonts links; else infer by style.\n- Keep adjectives concrete (e.g., "minimalist", "bold").\n- Output valid JSON only.`;
  const primary = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
  return callGeminiJSONWithRetry(primary, system, user);
}

// Brand Intelligence — Site Generation
async function generateSite(brandProfile) {
  const system = 'You are a principal front-end engineer and brand designer. Produce clean, accessible, production-ready HTML and CSS, strictly following the provided brand profile. Output strict JSON as per schema.';
  const schema = `{
  "sections": [
    {"type": "Hero", "html": "string", "css": "string"},
    {"type": "Features", "html": "string", "css": "string"},
    {"type": "Testimonials", "html": "string", "css": "string"},
    {"type": "CTA", "html": "string", "css": "string"},
    {"type": "Footer", "html": "string", "css": "string"}
  ],
  "globalCss": "string",
  "assets": {"heroImageUrl": "string|null"}
}`;
  const user = `Generate a homepage using the BrandProfile.\n\nSchema:\n${schema}\n\nConstraints:\n- Use these colors and fonts from the profile.\n- Keep CSS scoped under a root class .brand-root.\n- Use semantic HTML5, WCAG AA contrast.\n- Avoid external frameworks in output.\n- If no hero image URL is provided, set assets.heroImageUrl to null and use a gradient background.\n\nInput BrandProfile:\n${JSON.stringify(brandProfile)}\n\nOutput JSON only.`;
  const primary = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
  const json = await callGeminiJSONWithRetry(primary, system, user);
  // Flatten for storage convenience
  const html = (json.sections || []).map(s => s.html).join('\n');
  const css = [json.globalCss || '', ...(json.sections || []).map(s => s.css || '')].join('\n');
  return { ...json, html, css };
}

// Helper function to parse color schemes and handle custom combinations
const parseColorScheme = (colorScheme, colorSchemes) => {
  if (!colorScheme || typeof colorScheme !== 'string') {
    return colorSchemes.blue;
  }

  const scheme = colorScheme.toLowerCase().trim();
  
  // Direct match
  if (colorSchemes[scheme]) {
    return colorSchemes[scheme];
  }

  // Handle combinations like "purple and pink", "blue and green", etc.
  if (scheme.includes('and') || scheme.includes('&') || scheme.includes(',')) {
    const colors = scheme.split(/[\s,&]+/).map(c => c.trim()).filter(c => c);
    
    if (colors.length >= 2) {
      const primaryColor = colors[0];
      const secondaryColor = colors[1];
      
      // Create a custom combination
      if (colorSchemes[primaryColor] && colorSchemes[secondaryColor]) {
        return {
          primary: colorSchemes[primaryColor].primary,
          secondary: colorSchemes[secondaryColor].primary,
          accent: colorSchemes[primaryColor].accent
        };
      }
    }
  }

  // Handle partial matches
  for (const [key, value] of Object.entries(colorSchemes)) {
    if (scheme.includes(key)) {
      return value;
    }
  }

  // Handle specific color names
  const colorMap = {
    'purple': colorSchemes.purple,
    'pink': colorSchemes.pink,
    'blue': colorSchemes.blue,
    'green': colorSchemes.green,
    'red': colorSchemes.red,
    'orange': colorSchemes.orange,
    'indigo': colorSchemes.indigo,
    'teal': colorSchemes.teal
  };

  for (const [colorName, colorValue] of Object.entries(colorMap)) {
    if (scheme.includes(colorName)) {
      return colorValue;
    }
  }

  // Default fallback
  return colorSchemes.blue;
};

// Universal AI-powered layout generation logic
const buildPrompt = (options = {}) => {
  const {
    layoutType = 'landing-page',
    style = 'modern',
    industry = 'technology',
    components = [],
    colorScheme = 'blue',
    targetAudience = 'general',
    customBrief = '',
    model = 'gemini-2.5-pro' // 👈 Pass 'gemini-2.5-pro' or 'gemini-2.5-flash'
  } = options;

  // Model-specific tuning
  const depthFocus = model.includes('pro');

  const componentMap = {
    header: 'Sticky header with logo, navigation, and CTA button',
    hero: 'Full-width hero section with CTA and background image',
    features: 'Feature grid with icons/images and bold headlines',
    pricing: 'Pricing plans with comparison tables',
    testimonials: 'Customer testimonials with names and company logos',
    blog: 'Blog/news preview grid',
    newsletter: 'Newsletter signup with validation',
    contact: 'Contact form with company info',
    footer: 'Footer with navigation, company info, social media links',
    gallery: 'Grid gallery with lightbox functionality',
    faq: 'FAQ accordion with Q&A',
    sidebar: 'Sidebar with quick links or extra content',
    socialMedia: 'Social media icons with hover effects',
    productGrid: 'Product/service cards with pricing and ratings',
    dashboardPreview: 'Dashboard preview cards/tables (for apps)',
    ctaBanner: 'Prominent call-to-action banner',
    onboardingSteps: 'Step-by-step onboarding cards',
    stats: 'Animated KPI counters',
    partners: 'Partner/client logo showcase',
    team: 'Team member grid with bios'
  };

  const styleGuidelines = {
    minimal: 'Clean, white space, simple typography, subtle shadows',
    modern: 'Bold typography, gradients, rounded corners, modern spacing',
    vintage: 'Serif fonts, muted colors, decorative elements, classic layout',
    corporate: 'Professional, structured, conservative colors, formal typography',
    creative: 'Bold colors, unique layouts, artistic elements, experimental design'
  };

  const industryContent = {
    technology: {
      heroTitle: 'Revolutionary Tech Solutions',
      heroSubtitle: 'Transform your business with cutting-edge technology',
      features: ['AI Integration', 'Cloud Solutions', 'Data Analytics', 'Security'],
      cta: 'Get Started Free',
      imageKeywords: 'technology, coding, software, digital, innovation, computer, data, cloud'
    },
    healthcare: {
      heroTitle: 'Advanced Healthcare Solutions',
      heroSubtitle: 'Improving patient care through innovative technology',
      features: ['Patient Management', 'Telemedicine', 'Data Security', 'Compliance'],
      cta: 'Schedule Demo',
      imageKeywords: 'healthcare, medical, doctor, hospital, health, medicine, patient, medical technology'
    },
    finance: {
      heroTitle: 'Secure Financial Solutions',
      heroSubtitle: 'Banking and financial services you can trust',
      features: ['Secure Banking', 'Investment Tools', 'Risk Management', 'Compliance'],
      cta: 'Open Account',
      imageKeywords: 'finance, banking, money, investment, financial, business, economy, trading'
    },
    ecommerce: {
      heroTitle: 'Boost Your Online Sales',
      heroSubtitle: 'Complete e-commerce solutions for modern businesses',
      features: ['Online Store', 'Payment Processing', 'Inventory Management', 'Analytics'],
      cta: 'Start Selling',
      imageKeywords: 'ecommerce, shopping, online store, retail, products, commerce, marketplace'
    },
    education: {
      heroTitle: 'Transform Learning Experience',
      heroSubtitle: 'Advanced educational platforms for modern learning',
      features: ['Interactive Courses', 'Progress Tracking', 'Certification', 'Community'],
      cta: 'Start Learning',
      imageKeywords: 'education, learning, students, school, university, online learning, study, knowledge'
    },
    realestate: {
      heroTitle: 'Find Your Dream Property',
      heroSubtitle: 'Premium real estate solutions for buyers and sellers',
      features: ['Property Search', 'Virtual Tours', 'Market Analysis', 'Expert Agents'],
      cta: 'Browse Properties',
      imageKeywords: 'real estate, house, property, home, architecture, building, real estate agent'
    },
    food: {
      heroTitle: 'Delicious Food Delivered',
      heroSubtitle: 'Fresh ingredients, amazing flavors, delivered to your door',
      features: ['Fresh Ingredients', 'Fast Delivery', 'Custom Orders', 'Quality Guarantee'],
      cta: 'Order Now',
      imageKeywords: 'food, restaurant, cooking, chef, delicious, meal, cuisine, dining'
    },
    travel: {
      heroTitle: 'Explore the World',
      heroSubtitle: 'Discover amazing destinations and create unforgettable memories',
      features: ['Best Deals', 'Expert Guides', '24/7 Support', 'Flexible Booking'],
      cta: 'Book Now',
      imageKeywords: 'travel, vacation, destination, tourism, adventure, journey, world, explore'
    }
  };

  const colorSchemes = {
    blue: { primary: '#3B82F6', secondary: '#1E40AF', accent: '#60A5FA' },
    green: { primary: '#10B981', secondary: '#047857', accent: '#34D399' },
    purple: { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' },
    red: { primary: '#EF4444', secondary: '#DC2626', accent: '#F87171' },
    orange: { primary: '#F59E0B', secondary: '#D97706', accent: '#FBBF24' },
    pink: { primary: '#EC4899', secondary: '#BE185D', accent: '#F472B6' },
    indigo: { primary: '#6366F1', secondary: '#4338CA', accent: '#818CF8' },
    teal: { primary: '#14B8A6', secondary: '#0F766E', accent: '#5EEAD4' }
  };

  // Parse custom color schemes and handle combinations
  const colors = parseColorScheme(colorScheme, colorSchemes);
  const industryData = industryContent[industry] || industryContent.technology;
  const styleGuide = styleGuidelines[style] || styleGuidelines.modern;

  const selectedComponents = components.length > 0 ? components : ['header', 'hero', 'features', 'footer'];
  const componentDescriptions = selectedComponents.map(c => componentMap[c]).filter(Boolean);

  // Build prompt dynamically based on model
  const prompt = `
You are a world-class frontend engineer & UX/UI designer. 
Your task is to generate a ${depthFocus ? 'highly detailed, production-ready' : 'clean and lightweight'} HTML5 layout.

RESPONSE RULES:
1. Return ONLY valid HTML5. No Markdown, JSON, comments, or explanations.
2. Start with <!DOCTYPE html> and end with </html>.
3. Include a complete <head> section with meta tags, title, and embedded CSS.
4. Inline ALL CSS in <style> tags within the <head> section.
5. Inline ALL JS in <script> tags before </body>.
6. Mobile-first responsive design with breakpoints at 640px, 768px, 1024px, and 1280px.
7. Use CSS variables in :root for colors, typography, spacing, shadows.
8. ${depthFocus ? 'Include advanced ARIA roles, WCAG compliance, and semantic structure' : 'Keep it simple but correct and semantic'}.
9. ${depthFocus ? 'Add IntersectionObserver animations, lazy loading, SEO meta tags, Open Graph' : 'Focus on speed and clean code'}.
10. All images MUST use reliable, working URLs from Unsplash, Pexels, or similar services with proper dimensions and alt text.

CRITICAL HTML VALIDATION RULES:
- Every opening tag MUST have a proper closing tag
- All attributes must be properly quoted with double quotes
- No malformed style attributes or broken CSS
- NO IMAGES IN HEAD SECTION - images must only be in <body> section
- No images embedded within other elements incorrectly
- All SVG paths must be properly formatted
- No broken or incomplete HTML structure
- Ensure all CSS is valid and properly closed
- <head> section must only contain: meta, title, link, style, script tags
- <body> section must contain all visible content including images

CODE QUALITY REQUIREMENTS:
- Write clean, professional, production-ready code
- Use proper CSS Grid and Flexbox for layouts
- Ensure proper text alignment and spacing
- Avoid awkward text wrapping and hyphenation
- Use consistent typography and spacing
- Implement proper responsive design
- Use semantic HTML elements
- Ensure proper contrast and accessibility
- Write maintainable and readable code

DESIGN SPECS:
- Layout: ${layoutType}
- Style: ${styleGuide}
- Primary: ${colors.primary} | Secondary: ${colors.secondary} | Accent: ${colors.accent}
- Industry: ${industry} | Target Audience: ${targetAudience}
- Color Preference: ${colorScheme} (use these colors as the foundation for the design)

COMPONENTS:
${componentDescriptions.map(c => `- ${c}`).join('\n')}

COMPONENT IMAGE REQUIREMENTS:
- Header: Use a logo or brand image (SVG or PNG) - ONLY in header content area
- Hero: Use a high-quality background image or hero image (1200x800px minimum) - ONLY in hero section
- Features: Use relevant icons or images for each feature (400x300px) - ONLY in features section
- Pricing: Use checkmark icons or pricing-related images - ONLY in pricing section
- Testimonials: Use professional headshot images (200x200px, circular) - ONLY in testimonials section
- Blog: Use featured image for blog posts (600x400px) - ONLY in blog section
- Newsletter: Use newsletter or email-related images - ONLY in newsletter section
- Contact: Use contact form or communication images - ONLY in contact section
- Footer: NO IMAGES ALLOWED - Footer should only contain text, links, and social media icons (SVG)
- Gallery: Use multiple high-quality images in grid layout - ONLY in gallery section
- FAQ: Use question mark or help icons - ONLY in FAQ section
- Sidebar: Use relevant sidebar images or icons - ONLY in sidebar section
- Social Media: Use social media platform icons (SVG) - ONLY in appropriate sections
- Product Grid: Use product images with consistent dimensions - ONLY in product grid section
- Dashboard Preview: Use dashboard or analytics images - ONLY in dashboard section
- CTA Banner: Use compelling call-to-action images - ONLY in CTA sections
- Onboarding Steps: Use step-by-step process images - ONLY in onboarding section
- Stats: Use charts, graphs, or statistics images - ONLY in stats section
- Partners: Use partner/client logo images - ONLY in partners section
- Team: Use professional team member photos (300x300px) - ONLY in team section

CRITICAL IMAGE PLACEMENT RULES:
- NO IMAGES in <head> section
- NO IMAGES in <footer> section (use SVG icons only)
- NO IMAGES in <nav> section (use SVG icons only)
- Images should ONLY be in content sections like hero, features, gallery, etc.
- Footer should contain only text links and SVG social media icons

CONTENT:
- Hero Title: ${industryData.heroTitle}
- Hero Subtitle: ${industryData.heroSubtitle}
- Features: ${industryData.features.join(', ')}
- CTA Button: ${industryData.cta}
- Image Keywords: ${industryData.imageKeywords} (use these keywords to find relevant images)

COLOR USAGE:
- CRITICAL: Use the specified color scheme (${colorScheme}) throughout the design
- Primary color (${colors.primary}) for main elements, headers, and CTAs
- Secondary color (${colors.secondary}) for supporting elements and backgrounds
- Accent color (${colors.accent}) for highlights, buttons, and interactive elements
- Ensure the design reflects the user's color preference: ${colorScheme}

IMAGE REQUIREMENTS:
- CRITICAL: Every image MUST use a working, tested URL from reliable sources
- Use ONLY these verified HD image sources with proper parameters:
  * Pexels: https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg?w=1200&h=800&fit=crop&auto=format&q=90
  * Lorem Picsum: https://picsum.photos/1200/800?random=[NUMBER]
  * Lorem Flickr: https://loremflickr.com/1200/800/[CATEGORY]
  * Placeholder.com: https://via.placeholder.com/1200x800/[COLOR]/FFFFFF?text=[TEXT]
  * PlaceKitten: https://placekitten.com/1200/800
  * Lorem Pixel: https://lorempixel.com/1200/800/[CATEGORY]
  * Lorem Picsum (specific): https://picsum.photos/1200/800?random=[NUMBER]
  * Lorem Flickr (specific): https://loremflickr.com/1200/800/fashion,technology,business,nature
- GUARANTEED WORKING HD IMAGE EXAMPLES (use these exact URLs):
  * https://images.pexels.com/photos/1441986300917/pexels-photo-1441986300917.jpeg?w=1200&h=800&fit=crop&auto=format&q=90
  * https://picsum.photos/1200/800?random=1
  * https://loremflickr.com/1200/800
  * https://via.placeholder.com/1200x800/0066CC/FFFFFF?text=Product+Image
  * https://placekitten.com/1200/800
  * https://lorempixel.com/1200/800
  * https://images.pexels.com/photos/1441984904996/pexels-photo-1441984904996.jpeg?w=1200&h=800&fit=crop&auto=format&q=90
  * https://picsum.photos/1200/800?random=2
  * https://loremflickr.com/1200/800/fashion
  * https://via.placeholder.com/1200x800/FF6B6B/FFFFFF?text=Style+Image
- NEVER use placeholder text or broken image URLs
- MANDATORY: Every image must have a working src attribute with a real URL
- MANDATORY: Every image must have proper alt text describing the image content
- MANDATORY: Every image must have width and height attributes
- ALWAYS include proper HD dimensions: ?w=1200&h=800&fit=crop&auto=format&q=90
- ALWAYS include descriptive alt text for accessibility
- Use high-quality images that match the industry and content context
- Test that all image URLs are accessible and load properly
- For each section, use appropriate image types:
  * Hero: High-quality background or featured images
  * Features: Relevant icons or product images
  * Testimonials: Professional headshots
  * Gallery: Multiple high-quality images
  * Products: Clear product photos with consistent styling

${customBrief ? `CUSTOM BRIEF: ${customBrief}` : ''}

IMAGE LOADING REQUIREMENTS:
- Use proper img tags with src, alt, width, and height attributes
- Include loading="lazy" for performance
- Add error handling with onerror fallbacks
- Use CSS to ensure images are responsive and properly sized
- MANDATORY IMAGE FORMAT: <img src="https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg?w=1200&h=800&fit=crop&auto=format&q=90" alt="Descriptive text" width="1200" height="800" loading="lazy" onerror="this.style.display='none'">
- CRITICAL: Every image must use this exact format with working URLs
- Ensure all images have proper fallback styling in CSS
- Use background images with proper fallback colors
- Test that all image URLs are accessible and load properly
- NO PLACEHOLDER TEXT: Never use text like "Image placeholder" or "Product image"
- NO BROKEN LINKS: Every image URL must be tested and working

CSS LAYOUT GUIDELINES:
- Use CSS Grid for complex layouts: display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
- Use Flexbox for component alignment: display: flex; align-items: center; justify-content: space-between;
- Prevent text overflow: word-wrap: break-word; overflow-wrap: break-word; hyphens: none;
- Ensure proper text alignment: text-align: left/center/right; vertical-align: top/middle/bottom;
- Use consistent spacing: margin: 0; padding: 1rem; gap: 1rem;
- Avoid awkward line breaks: white-space: nowrap; or use proper line-height
- Use proper column layouts: column-count: 2; column-gap: 2rem; column-fill: balance;
- Ensure responsive text: font-size: clamp(1rem, 2.5vw, 1.5rem);
- Use proper container widths: max-width: 1200px; margin: 0 auto; padding: 0 1rem;

DELIVERABLE:
A single standalone HTML5 file that runs immediately in a browser with all images rendering correctly and proper, professional code quality.`;


  return prompt;
};

// Enhanced function to generate layout with AI using the new prompt builder
const generateLayoutWithAI = async ({ prompt, layoutType, style, userPreferences, componentsRequired = [], colorScheme = '', industry = '', targetAudience = '', model = 'gemini-2.5-pro' }) => {
  try {
    // Validate required parameters
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    if (!layoutType) {
      throw new Error('Layout type is required');
    }
    // Build the universal prompt
    const aiPrompt = buildPrompt({
      layoutType,
      style,
      industry,
      components: componentsRequired,
      colorScheme,
      targetAudience,
      customBrief: prompt,
      model
    });

    const shouldDebug = true; // Always log/return prompt to aid debugging
    let promptDebugPreview;
    if (shouldDebug) {
      promptDebugPreview = aiPrompt.length > 4000 ? `${aiPrompt.slice(0, 4000)}... [truncated]` : aiPrompt;
    }

    const runWithModel = async (chosenModel) => {
      const geminiModel = genAI.getGenerativeModel({ model: chosenModel });
      try {
        return await geminiModel.generateContent(aiPrompt);
      } catch (sdkErr) {
        const msg = String(sdkErr?.message || sdkErr);
        const causeCode = sdkErr?.cause?.code || sdkErr?.code;
        console.warn('[AI][Layout] SDK call failed:', msg, causeCode ? `(code: ${causeCode})` : '');
        // Network/proxy/cert issues: try REST fallback via axios
        if (/fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|CERT|SSL|self[- ]signed/i.test(msg) ||
            /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|CERT|SSL|self[- ]signed/i.test(String(causeCode))) {
          console.warn('[AI][Layout] Trying REST fallback via axios');
          const rest = await generateViaAxios(chosenModel, aiPrompt);
          // Shape a minimal object compatible with downstream usage
          return { response: { text: () => rest.text } };
        }
        throw sdkErr;
      }
    };

    let result;
    try {
      result = await runWithModel(model);
    } catch (err) {
      const message = String(err?.message || err);
      if (/overloaded|503|unavailable|busy/i.test(message)) {
        const fallback = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';
        console.warn(`[AI][Layout] Primary model failed (${model}). Falling back to: ${fallback}`);
        result = await runWithModel(fallback);
      } else {
        throw err;
      }
    }
    
    if (!result || !result.response) {
      throw new Error('No response received from AI model');
    }
    
    let responseText = result.response.text();
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response received from AI model');
    }
    
    // Clean up the response more thoroughly
    responseText = responseText
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^```html$/gm, '')
      .replace(/^```$/gm, '')
      .replace(/^```json$/gm, '')
      .replace(/^```css$/gm, '')
      .replace(/^```javascript$/gm, '')
      .replace(/^```js$/gm, '')
      .trim();

    // Check if response is JSON and extract HTML
    if (responseText.startsWith('{') && responseText.includes('"html"')) {
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.html) {
          responseText = parsed.html;
        }
      } catch (error) {
        // Failed to parse JSON, treating as raw HTML
      }
    }

    // Extract HTML content
    const htmlStart = responseText.indexOf('<!DOCTYPE html>');
    const htmlEnd = responseText.lastIndexOf('</html>') + 7;
    
    if (htmlStart !== -1 && htmlEnd > htmlStart) {
      responseText = responseText.substring(htmlStart, htmlEnd);
    }


    // Fix common HTML issues
    // CRITICAL: Remove images from head section (invalid HTML)
    
    // Find head section and remove img tags
    const headMatch = responseText.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      const headContent = headMatch[1];
      const imgInHead = headContent.match(/<img[^>]*>/gi);
      if (imgInHead) {
        const cleanedHead = headContent.replace(/<img[^>]*>/gi, '');
        responseText = responseText.replace(headMatch[0], `<head>${cleanedHead}</head>`);
      }
    }
    
    responseText = responseText
      // Fix malformed image tags
      .replace(/<img([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<img$1$2>')
      .replace(/<img([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<img$1$2>')
      .replace(/<img([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi, '<img$1$2>')
      // Fix malformed SVG paths
      .replace(/<path([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<path$1$2>')
      .replace(/<path([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<path$1$2>')
      .replace(/<path([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi, '<path$1$2>')
      // Fix broken style attributes
      .replace(/style="[^"]*?word-wrap:\s*break-word[^"]*?"/gi, '')
      .replace(/style="[^"]*?overflow-wrap:\s*break-word[^"]*?"/gi, '')
      .replace(/style="[^"]*?hyphens:\s*none[^"]*?"/gi, '')
      // Fix malformed closing tags
      .replace(/<([^>]+?)\s*style="[^"]*?word-wrap:\s*break-word[^"]*?"\s*>/gi, '<$1>')
      .replace(/<([^>]+?)\s*style="[^"]*?overflow-wrap:\s*break-word[^"]*?"\s*>/gi, '<$1>')
      .replace(/<([^>]+?)\s*style="[^"]*?hyphens:\s*none[^"]*?"\s*>/gi, '<$1>')
      // Fix broken CSS
      .replace(/style="[^"]*?;\s*word-wrap:\s*break-word[^"]*?"/gi, '')
      .replace(/style="[^"]*?;\s*overflow-wrap:\s*break-word[^"]*?"/gi, '')
      .replace(/style="[^"]*?;\s*hyphens:\s*none[^"]*?"/gi, '')
      // Remove empty style attributes
      .replace(/style="\s*"/gi, '')
      .replace(/style='\s*'/gi, '')
      // Fix specific issues from the user's response
      .replace(/<img([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<img$1$2>')
      .replace(/<img([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<img$1$2>')
      .replace(/<img([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi, '<img$1$2>')
      // Fix broken SVG elements
      .replace(/<svg([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<svg$1$2>')
      .replace(/<svg([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi, '<svg$1$2>')
      .replace(/<svg([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi, '<svg$1$2>')
      // Fix broken closing tags with style attributes
      .replace(/<([^>]+?)\s*style="[^"]*?word-wrap:\s*break-word[^"]*?"\s*>/gi, '<$1>')
      .replace(/<([^>]+?)\s*style="[^"]*?overflow-wrap:\s*break-word[^"]*?"\s*>/gi, '<$1>')
      .replace(/<([^>]+?)\s*style="[^"]*?hyphens:\s*none[^"]*?"\s*>/gi, '<$1>')
      // Fix broken CSS selectors
      .replace(/style="[^"]*?;\s*word-wrap:\s*break-word[^"]*?"/gi, '')
      .replace(/style="[^"]*?;\s*overflow-wrap:\s*break-word[^"]*?"/gi, '')
      .replace(/style="[^"]*?;\s*hyphens:\s*none[^"]*?"/gi, '')
      // Remove empty style attributes
      .replace(/style="\s*"/gi, '')
      .replace(/style='\s*'/gi, '');


    // Validate final HTML output and ensure complete structure
    if (!responseText.includes('<!DOCTYPE html>')) {
      responseText = `<!DOCTYPE html>\n${responseText}`;
    }
    
    if (!responseText.includes('<html')) {
      responseText = responseText.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="en">') + '\n</html>';
    }
    
    if (!responseText.includes('<head>')) {
      responseText = responseText.replace('<html lang="en">', '<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Generated Layout</title>\n</head>');
    }
    
    if (!responseText.includes('<body>')) {
      responseText = responseText.replace('</head>', '</head>\n<body>') + '\n</body>';
    }

    
    // Add basic CSS if no styles are present
    if (!responseText.includes('<style>')) {
      const basicCSS = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            word-wrap: break-word; 
            overflow-wrap: break-word; 
            hyphens: none;
          }
          img { max-width: 100%; height: auto; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .hero { 
            padding: 60px 0; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
          }
          .hero h1 { 
            font-size: clamp(2rem, 5vw, 3rem); 
            margin-bottom: 20px; 
            line-height: 1.2;
          }
          .hero p { 
            font-size: clamp(1rem, 2.5vw, 1.2rem); 
            margin-bottom: 30px; 
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }
          .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px; 
            transition: background 0.3s ease;
          }
          .btn:hover { background: #0056b3; }
          .section { padding: 60px 0; }
          .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 30px; 
            align-items: start;
          }
          .card { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .two-column { 
            column-count: 2; 
            column-gap: 2rem; 
            column-fill: balance; 
          }
          @media (max-width: 768px) { 
            .hero h1 { font-size: 2rem; } 
            .grid { grid-template-columns: 1fr; } 
            .two-column { column-count: 1; }
          }
        </style>`;
      responseText = responseText.replace('</head>', basicCSS + '\n</head>');
    }
    
    // Fix image issues - ensure all images have proper URLs and attributes
    const workingImageUrls = [
      'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/3772510/pexels-photo-3772510.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/769749/pexels-photo-769749.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043472/pexels-photo-1043472.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043470/pexels-photo-1043470.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043469/pexels-photo-1043469.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043468/pexels-photo-1043468.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043467/pexels-photo-1043467.jpeg?w=1200&h=800&fit=crop&auto=format&q=90',
      'https://images.pexels.com/photos/1043466/pexels-photo-1043466.jpeg?w=1200&h=800&fit=crop&auto=format&q=90'
    ];
    
    // Replace placeholder text with working images
    responseText = responseText.replace(/placeholder[^>]*>/gi, '>');
    responseText = responseText.replace(/Image placeholder/gi, '');
    responseText = responseText.replace(/Product image/gi, '');
    responseText = responseText.replace(/A person wearing/gi, '');
    responseText = responseText.replace(/Colorful Y2K fashion/gi, '');
    responseText = responseText.replace(/Someone in functional/gi, '');
    responseText = responseText.replace(/Close-up of trendy/gi, '');
    responseText = responseText.replace(/Fashionable woman/gi, '');
    responseText = responseText.replace(/Stylish young person/gi, '');
    
    // Fix broken image tags and ensure all images have working URLs
    let imageIndex = 0;
    responseText = responseText.replace(/<img([^>]*)>/gi, (match, attributes) => {
      // Check if this image is in the head section - if so, remove it entirely
      const beforeMatch = responseText.substring(0, responseText.indexOf(match));
      const headEnd = beforeMatch.lastIndexOf('</head>');
      const headStart = beforeMatch.lastIndexOf('<head');
      
      if (headStart !== -1 && headEnd !== -1 && headStart < headEnd) {
        return ''; // Remove the image entirely
      }
      
      // Check if image has a proper src or if it's broken
      if (!attributes.includes('src=') || 
          attributes.includes('placeholder') || 
          attributes.includes('broken') ||
          attributes.includes('data:') ||
          attributes.includes('blob:')) {
        
        const workingUrl = workingImageUrls[imageIndex % workingImageUrls.length];
        const altText = attributes.includes('alt=') ? '' : ' alt="Product image"';
        const widthHeight = attributes.includes('width=') ? '' : ' width="1200" height="800"';
        const loading = attributes.includes('loading=') ? '' : ' loading="lazy"';
        const onerror = attributes.includes('onerror=') ? '' : ' onerror="this.style.display=\'none\'; this.style.backgroundColor=\'#f3f4f6\'; this.style.border=\'2px dashed #d1d5db\'; this.innerHTML=\'<div style=\\"display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:14px\\">Image not available</div>\';"';
        
        // Clean up the attributes to remove broken src
        const cleanAttributes = attributes
          .replace(/src\s*=\s*["'][^"']*["']/gi, '')
          .replace(/placeholder/gi, '')
          .replace(/broken/gi, '');
        
        return `<img src="${workingUrl}"${altText}${widthHeight}${loading}${onerror}${cleanAttributes}>`;
      }
      imageIndex++;
      return match;
    });
    
    // Also fix any divs or other elements that might contain placeholder text for images
    responseText = responseText.replace(/<div[^>]*class="[^"]*placeholder[^"]*"[^>]*>.*?<\/div>/gi, (match) => {
      const workingUrl = workingImageUrls[imageIndex % workingImageUrls.length];
      imageIndex++;
      return `<img src="${workingUrl}" alt="Product image" width="1200" height="800" loading="lazy" onerror="this.style.display='none'; this.style.backgroundColor='#f3f4f6'; this.style.border='2px dashed #d1d5db'; this.innerHTML='<div style=\\"display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:14px\\">Image not available</div>';">`;
    });
    
    // Final cleanup - replace any remaining text that looks like image descriptions
    responseText = responseText.replace(/<[^>]*>([^<]*?(?:wearing|fashion|clothing|outfit|style|trendy|colorful|person|woman|man|young|close-up|someone|stylish)[^<]*?)<\/[^>]*>/gi, (match, text) => {
      // If this looks like a description that should be an image, replace with an image
      if (text.length > 10 && text.length < 100) {
        const workingUrl = workingImageUrls[imageIndex % workingImageUrls.length];
        imageIndex++;
        return `<img src="${workingUrl}" alt="${text.trim()}" width="1200" height="800" loading="lazy" onerror="this.style.display='none'">`;
      }
      return match;
    });
    
    // Fix JavaScript syntax errors and common issues
    responseText = responseText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
      // Clean up common JavaScript syntax issues
      let cleanedScript = scriptContent
        .replace(/console\.log\([^)]*\);/gi, '') // Remove console.log statements
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Only return the script if it has valid content
      if (cleanedScript && cleanedScript.length > 10) {
        return `<script>${cleanedScript}</script>`;
      }
      return ''; // Remove empty or invalid scripts
    });

    // Fix common layout and typography issues
    responseText = responseText.replace(/style="[^"]*"/gi, (match) => {
      // Add word-wrap and overflow-wrap to existing styles
      if (!match.includes('word-wrap') && !match.includes('overflow-wrap')) {
        return match.replace('"', '; word-wrap: break-word; overflow-wrap: break-word; hyphens: none;"');
      }
      return match;
    });
    
    // Fix awkward text wrapping and hyphenation
    responseText = responseText.replace(/<p([^>]*)>/gi, '<p$1 style="word-wrap: break-word; overflow-wrap: break-word; hyphens: none;">');
    responseText = responseText.replace(/<div([^>]*)>/gi, '<div$1 style="word-wrap: break-word; overflow-wrap: break-word;">');
    
    // Ensure proper responsive text sizing
    responseText = responseText.replace(/font-size:\s*(\d+)px/gi, 'font-size: clamp($1px, 2.5vw, $1px)');
    
    // Fix column layouts to be more balanced
    responseText = responseText.replace(/column-count:\s*2/gi, 'column-count: 2; column-fill: balance; column-gap: 2rem;');
    
    if (!responseText.includes('</html>')) {
      responseText = `${responseText}\n</html>`;
    }

    // FINAL CLEANUP: Remove any images that might have been added to inappropriate sections
    
    // Remove images from head section
    const finalHeadMatch = responseText.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (finalHeadMatch) {
      const finalHeadContent = finalHeadMatch[1];
      const finalImgInHead = finalHeadContent.match(/<img[^>]*>/gi);
      if (finalImgInHead) {
        const finalCleanedHead = finalHeadContent.replace(/<img[^>]*>/gi, '');
        responseText = responseText.replace(finalHeadMatch[0], `<head>${finalCleanedHead}</head>`);
      }
    }
    
    // Remove images from footer section and replace with appropriate SVG icons
    const footerMatch = responseText.match(/<footer[^>]*>([\s\S]*?)<\/footer>/gi);
    if (footerMatch) {
      footerMatch.forEach((footer, index) => {
        const imgInFooter = footer.match(/<img[^>]*>/gi);
        if (imgInFooter) {
          // Replace images with appropriate SVG social media icons
          let cleanedFooter = footer.replace(/<img[^>]*>/gi, (imgTag) => {
            // Check if it's a social media icon by looking at alt text or src
            if (imgTag.includes('social') || imgTag.includes('instagram') || imgTag.includes('twitter') || imgTag.includes('facebook') || imgTag.includes('youtube')) {
              return '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12h8M12 8v8"/></svg>';
            }
            return ''; // Remove other images
          });
          
          responseText = responseText.replace(footer, cleanedFooter);
        }
      });
    }
    
    // Remove images from navigation sections
    const navMatch = responseText.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi);
    if (navMatch) {
      navMatch.forEach((nav, index) => {
        const imgInNav = nav.match(/<img[^>]*>/gi);
        if (imgInNav) {
          const cleanedNav = nav.replace(/<img[^>]*>/gi, '');
          responseText = responseText.replace(nav, cleanedNav);
        }
      });
    }

    const finalResponse = {
      success: true,
      htmlCode: responseText,
      cssCode: '', // CSS is embedded in HTML
      components: componentsRequired,
      layoutType,
      style,
      industry,
      colorScheme,
      title: `${industry} ${layoutType} - ${style} design`,
      description: `AI-generated ${layoutType} layout with ${style} design for ${industry} industry`
    };

    if (shouldDebug && promptDebugPreview) {
      finalResponse.promptDebug = promptDebugPreview;
    }


    return finalResponse;
    
  } catch (error) {
    console.error('❌ Layout generation error:', error);
    // Attach prompt for upstream handlers to return to client
    try {
      if (!error.promptDebug && typeof aiPrompt === 'string') {
        const preview = aiPrompt.length > 4000 ? `${aiPrompt.slice(0, 4000)}... [truncated]` : aiPrompt;
        error.promptDebug = preview;
      }
    } catch (_) {}
    throw error;
  }
};

// Legacy functions for backward compatibility
const generateLayoutJSON = async (options) => {
  // Return a simple JSON structure for compatibility
  return {
    success: true,
    components: options.componentsRequired || ['header', 'hero', 'features', 'footer'],
    layoutType: options.layoutType || 'landing-page',
    style: options.style || 'modern',
    industry: options.industry || 'technology'
  };
};

const generateHTMLCSS = async (layoutData, options) => {
  // Use the new universal generation
  return await generateLayoutWithAI(options);
};

// Advanced Color Palette Generator with gradients/semantic colors
const buildColorPalettePrompt = (options = {}) => {
  const {
    mood = 'modern',
    industry = 'technology',
    paletteType = 'custom',
    prompt = '',
    model = 'gemini-2.5-pro',
    includeGradients = true,
    includeTextureColors = false,
    semanticColors = true,
    colorHarmony = 'balanced',
    accessibilityLevel = 'AA'
  } = options;

  const depthFocus = model.includes('pro');

  const moodGuidelines = {
    modern: 'Clean, contemporary colors with high contrast and bold accents',
    minimal: 'Neutral tones with subtle variations and plenty of whitespace',
    vibrant: 'Bold, energetic colors with high saturation and strong contrasts',
    elegant: 'Sophisticated, muted tones with refined color relationships',
    playful: 'Bright, cheerful colors with fun combinations and gradients',
    professional: 'Conservative, trustworthy colors suitable for business',
    creative: 'Experimental, artistic colors with unique combinations',
    vintage: 'Retro-inspired colors with muted tones and nostalgic feel',
    futuristic: 'Neon accents, dark backgrounds, cyberpunk-inspired colors',
    organic: 'Earth tones, natural colors inspired by nature',
    luxury: 'Rich, premium colors with metallic accents',
    energetic: 'High-energy colors that inspire action and movement'
  };

  const industryContext = {
    technology: 'Tech companies, startups, software, digital products',
    healthcare: 'Medical, wellness, pharmaceutical, healthcare services',
    finance: 'Banking, investment, insurance, financial services',
    ecommerce: 'Online retail, shopping, marketplace, consumer goods',
    education: 'Schools, universities, online learning, educational content',
    realestate: 'Property, housing, real estate, construction',
    food: 'Restaurants, food delivery, culinary, hospitality',
    travel: 'Tourism, hospitality, travel booking, adventure',
    fashion: 'Clothing, beauty, lifestyle, luxury brands',
    entertainment: 'Media, gaming, music, entertainment content',
    fitness: 'Gyms, sports, wellness, health tracking apps',
    cryptocurrency: 'Blockchain, digital currency, fintech, trading',
    sustainability: 'Green energy, eco-friendly, environmental',
    automotive: 'Cars, transportation, mobility, racing'
  };

  const paletteTypes = {
    monochromatic: 'Single hue with various shades and tints',
    analogous: 'Adjacent colors on the color wheel',
    complementary: 'Opposite colors on the color wheel',
    triadic: 'Three evenly spaced colors on the color wheel',
    tetradic: 'Four colors forming a rectangle on the color wheel',
    splitComplementary: 'Base color plus two colors adjacent to its complement',
    square: 'Four colors evenly spaced around the color wheel',
    custom: 'Custom color combination based on specific requirements',
    gradient: 'Colors designed specifically for smooth gradient transitions'
  };

  const colorHarmonyTypes = {
    balanced: 'Equal visual weight across all colors',
    dominant: 'One primary color dominates with supporting colors',
    contrasting: 'High contrast between light and dark elements',
    subtle: 'Low contrast with gentle color transitions',
    dynamic: 'Varying intensities creating visual rhythm'
  };

  const moodGuide = moodGuidelines[mood] || moodGuidelines.modern;
  const industryDesc = industryContext[industry] || industryContext.technology;
  const paletteDesc = paletteTypes[paletteType] || paletteTypes.custom;
  const harmonyDesc = colorHarmonyTypes[colorHarmony] || colorHarmonyTypes.balanced;

  const gradientFeatures = includeGradients ? `
GRADIENT REQUIREMENTS:
- Create 3-5 gradient combinations using palette colors
- Include linear, radial, and conic gradient variations
- Provide CSS gradient syntax ready for implementation
- Ensure smooth color transitions without muddy middle tones
- Include gradient overlays for text readability` : '';

  const textureFeatures = includeTextureColors ? `
TEXTURE COLOR FEATURES:
- Provide shadow and highlight variations for depth
- Include noise/texture overlay colors
- Create color variations for different material surfaces
- Provide glass morphism color variations` : '';

  const semanticFeatures = semanticColors ? `
SEMANTIC COLORS:
- Success, warning, error, and info state colors
- Interactive state colors (hover, active, disabled)
- Loading and progress indicator colors
- Notification and badge colors` : '';

  const aiPrompt = `
You are a world-class color theory expert, UI/UX designer, and digital artist specializing in advanced color systems.
Generate a ${mood} color palette for ${industryDesc} applications with modern web design features.

RESPONSE RULES:
1. Return ONLY valid JSON. No markdown, explanations, or code blocks.
2. Include exactly 8-12 colors with proper naming and relationships.
3. Ensure accessibility compliance with WCAG ${accessibilityLevel} standards.
4. ${depthFocus ? 'Include detailed color psychology, usage guidelines, and design system recommendations' : 'Keep it practical with essential usage notes'}.
5. Include advanced features: gradients, semantic colors, and interactive states.

PALETTE REQUIREMENTS:
- Mood: ${moodGuide}
- Industry: ${industryDesc}
- Type: ${paletteDesc}
- Harmony: ${harmonyDesc}
- Colors: 8-12 colors including primary, secondary, accent, neutral, semantic, and state variations
- Accessibility: Ensure sufficient contrast ratios (4.5:1 for normal text, 3:1 for large text, 7:1 for AAA)

${gradientFeatures}
${textureFeatures}
${semanticFeatures}

${prompt ? `CUSTOM REQUIREMENTS: ${prompt}` : ''}

JSON STRUCTURE:
{
  "name": "Descriptive palette name",
  "description": "Brief description focusing on unique features",
  "mood": "${mood}",
  "industry": "${industry}",
  "paletteType": "${paletteType}",
  "colorHarmony": "${colorHarmony}",
  "colors": {
    "primary": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Primary", "usage": "Main brand color"},
    "primaryDark": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Primary Dark", "usage": "Hover/active state"},
    "primaryLight": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Primary Light", "usage": "Subtle highlights"},
    "secondary": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Secondary", "usage": "Supporting elements"},
    "accent": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Accent", "usage": "Call-to-action elements"},
    "neutral": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Neutral", "usage": "Text and borders"},
    "neutralLight": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Neutral Light", "usage": "Subtle backgrounds"},
    "background": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Background", "usage": "Page background"},
    "surface": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Surface", "usage": "Card/component backgrounds"},
    "text": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Text", "usage": "Primary text"},
    "textSecondary": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Text Secondary", "usage": "Secondary text"},
    "success": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Success", "usage": "Success states"},
    "warning": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Warning", "usage": "Warning states"},
    "error": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Error", "usage": "Error states"},
    "info": {"hex": "#000000", "rgb": "rgb(0,0,0)", "hsl": "hsl(0,0%,0%)", "name": "Info", "usage": "Information states"}
  },
  "gradients": {
    "primary": {
      "linear": "linear-gradient(135deg, #hex1 0%, #hex2 100%)",
      "radial": "radial-gradient(circle, #hex1 0%, #hex2 100%)",
      "usage": "Hero sections, buttons, cards"
    },
    "accent": {
      "linear": "linear-gradient(45deg, #hex1 0%, #hex2 100%)",
      "radial": "radial-gradient(ellipse, #hex1 0%, #hex2 100%)",
      "usage": "CTAs, highlights, special elements"
    },
    "neutral": {
      "linear": "linear-gradient(180deg, #hex1 0%, #hex2 100%)",
      "usage": "Backgrounds, overlays, subtle effects"
    },
    "glass": {
      "backdrop": "rgba(255,255,255,0.1)",
      "border": "rgba(255,255,255,0.2)",
      "usage": "Glass morphism effects"
    }
  },
  "interactiveStates": {
    "hover": {"primary": "#000000", "secondary": "#000000", "accent": "#000000"},
    "active": {"primary": "#000000", "secondary": "#000000", "accent": "#000000"},
    "focus": {"primary": "#000000", "secondary": "#000000", "accent": "#000000"},
    "disabled": {"primary": "#000000", "secondary": "#000000", "accent": "#000000"}
  },
  "shadows": {
    "light": "rgba(0,0,0,0.1)",
    "medium": "rgba(0,0,0,0.15)",
    "heavy": "rgba(0,0,0,0.25)",
    "colored": "rgba(primary_rgb,0.2)"
  },
  "accessibility": {
    "contrastRatio": ${accessibilityLevel === 'AAA' ? 7.0 : 4.5},
    "wcagCompliant": true,
    "level": "${accessibilityLevel}",
    "notes": "All color combinations tested for accessibility",
    "colorBlindSafe": true
  },
  "designSystem": {
    "spacing": "Use consistent spacing with color relationships",
    "typography": "Colors optimized for text hierarchy",
    "components": "Color variations for buttons, cards, forms, navigation",
    "darkMode": "Automatically generate dark mode variations"
  },
  "psychology": {
    "primaryEmotion": "Emotion evoked by primary color",
    "brandPersonality": "Personality traits conveyed",
    "targetAudience": "Ideal audience for this palette",
    "culturalConsiderations": "Cultural color meanings"
  },
  "usage": {
    "primary": "Main brand elements, primary CTAs, logo colors",
    "secondary": "Secondary buttons, supporting graphics, icons",
    "accent": "Highlights, notifications, special promotions",
    "gradients": "Hero sections, card backgrounds, loading states",
    "semantic": "Status indicators, form validation, alerts"
  },
  "cssVariables": {
    "--color-primary": "var(--primary-hex)",
    "--color-secondary": "var(--secondary-hex)",
    "--gradient-primary": "var(--gradient-primary-linear)",
    "--shadow-colored": "var(--shadow-colored)"
  },
  "exportFormats": {
    "sketch": "Ready for Sketch import",
    "figma": "Figma color styles format",
    "adobe": "Adobe Creative Suite compatible",
    "css": "CSS custom properties included"
  },
  "tags": ["${mood}", "${industry}", "accessible", "gradient-ready", "interactive", "modern", "semantic"]
}`;

  return aiPrompt;
};

// Theme variations prompt helper
const buildThemeVariations = (basePalette, options = {}) => {
  const { includeDark = true, includeHighContrast = false, includeSepia = false } = options;
  return `
Create theme variations for the base palette:
${includeDark ? '- Dark mode: Invert luminosity while maintaining color relationships' : ''}
${includeHighContrast ? '- High contrast: Maximum accessibility with bold color differences' : ''}
${includeSepia ? '- Sepia mode: Warm, vintage-inspired monochromatic variation' : ''}

Each theme should maintain:
1. Brand recognition through color relationships
2. Accessibility standards
3. Gradient compatibility
4. Semantic color meanings
`;
};

const { ColorPaletteGenerator } = require('./paletteService');

const generateColorPaletteWithAI = async ({ prompt, mood, industry, paletteType, model = 'gemini-2.5-pro' }) => {
  try {
    const generator = new ColorPaletteGenerator(genAI);
    const normalizedPalette = await generator.generate({
      prompt: `${prompt}`,
      mood,
      industry: industry || 'technology',
      paletteType: paletteType || 'custom',
      model
    });
    return normalizedPalette;
  } catch (error) {
    return generateDefaultColorPalette(mood, industry);
  }
};

// Helper function to normalize color palette data to backend schema
const normalizeColorPalette = (palette, mood, industry) => {
  // Ensure required fields exist
  const normalized = {
    name: palette.name || `${mood} ${industry} Palette`,
    description: palette.description || `A ${mood} color palette for ${industry} applications`,
    mood: palette.mood || mood,
    industry: palette.industry || industry,
    paletteType: palette.paletteType || 'custom',
    colors: {},
    accessibility: {
      contrastRatio: typeof palette.accessibility?.contrastRatio === 'number' 
        ? palette.accessibility.contrastRatio 
        : 4.5,
      wcagCompliant: Boolean(palette.accessibility?.wcagCompliant),
      notes: palette.accessibility?.notes || 'Accessibility compliant'
    },
    usage: palette.usage || {
      primary: 'Use for main CTAs, links, and brand elements',
      secondary: 'Use for supporting elements and highlights',
      accent: 'Use sparingly for emphasis and special elements'
    },
    tags: Array.isArray(palette.tags) ? palette.tags : [mood, industry, 'accessible', 'modern']
  };

  const src = palette.colors || {};
  const pickHex = (obj) => {
    if (!obj) return undefined;
    if (typeof obj === 'string') return obj;
    if (obj.hex) return obj.hex;
    return undefined;
  };

  // Map to backend schema keys only
  const primaryHex = pickHex(src.primary) || '#3B82F6';
  const secondaryHex = pickHex(src.secondary) || '#64748B';
  const accentHex = pickHex(src.accent) || '#F59E0B';
  const backgroundHex = pickHex(src.background) || '#FFFFFF';
  const textHex = pickHex(src.text || src.textPrimary) || '#1F2937';

  normalized.colors.primary = { hex: primaryHex };
  normalized.colors.secondary = { hex: secondaryHex };
  normalized.colors.accent = { hex: accentHex };
  normalized.colors.background = { hex: backgroundHex };
  normalized.colors.text = { hex: textHex };
  // Neutrals array (optional)
  const neutrals = [];
  if (Array.isArray(src.neutrals)) {
    src.neutrals.forEach((n) => {
      const hx = pickHex(n);
      if (hx) neutrals.push({ hex: hx, name: n.name });
    });
  } else if (Array.isArray(src.neutral)) {
    src.neutral.forEach((n) => {
      const hx = pickHex(n);
      if (hx) neutrals.push({ hex: hx, name: n.name });
    });
  }
  if (neutrals.length) normalized.colors.neutral = neutrals;

  // Map gradients if provided
  if (palette.gradients && typeof palette.gradients === 'object') {
    normalized.gradients = {};
    if (palette.gradients.primary) {
      normalized.gradients.primary = {
        linear: palette.gradients.primary.linear,
        radial: palette.gradients.primary.radial,
        usage: palette.gradients.primary.usage
      };
    }
    if (palette.gradients.accent) {
      normalized.gradients.accent = {
        linear: palette.gradients.accent.linear,
        radial: palette.gradients.accent.radial,
        usage: palette.gradients.accent.usage
      };
    }
    if (palette.gradients.neutral) {
      normalized.gradients.neutral = {
        linear: palette.gradients.neutral.linear,
        usage: palette.gradients.neutral.usage
      };
    }
    if (palette.gradients.glass) {
      normalized.gradients.glass = {
        backdrop: palette.gradients.glass.backdrop,
        border: palette.gradients.glass.border,
        usage: palette.gradients.glass.usage
      };
    }
  }

  // Fallback gradients if missing
  if (!normalized.gradients) {
    const p = normalized.colors.primary?.hex || '#3B82F6';
    const a = normalized.colors.accent?.hex || '#F59E0B';
    const n = (normalized.colors.neutral?.[0]?.hex) || '#E5E7EB';
    normalized.gradients = {
      primary: {
        linear: `linear-gradient(135deg, ${p} 0%, ${a} 100%)`,
        radial: `radial-gradient(circle, ${p} 0%, ${a} 100%)`,
        usage: 'Hero sections, buttons, cards'
      },
      accent: {
        linear: `linear-gradient(45deg, ${a} 0%, ${p} 100%)`,
        radial: `radial-gradient(ellipse, ${a} 0%, ${p} 100%)`,
        usage: 'CTAs, highlights, special elements'
      },
      neutral: {
        linear: `linear-gradient(180deg, ${n} 0%, #ffffff 100%)`,
        usage: 'Backgrounds, overlays, subtle effects'
      }
    };
  }

  return normalized;
};

// Enhanced Font Suggestions
const buildFontSuggestionsPrompt = (options = {}) => {
  const {
    industry = 'technology',
    tone = 'professional',
    usage = 'web',
    prompt = '',
    model = 'gemini-2.5-pro'
  } = options;

  const depthFocus = model.includes('pro');

  const toneGuidelines = {
    professional: 'Clean, authoritative, trustworthy, and business-appropriate',
    modern: 'Contemporary, sleek, minimalist, and forward-thinking',
    elegant: 'Sophisticated, refined, luxurious, and graceful',
    playful: 'Fun, friendly, approachable, and energetic',
    creative: 'Artistic, unique, experimental, and expressive',
    minimal: 'Simple, clean, uncluttered, and focused',
    bold: 'Strong, confident, impactful, and attention-grabbing',
    friendly: 'Warm, approachable, welcoming, and personable'
  };

  const industryContext = {
    technology: 'Tech companies, software, digital products, startups',
    healthcare: 'Medical, wellness, healthcare, pharmaceutical',
    finance: 'Banking, investment, insurance, financial services',
    ecommerce: 'Online retail, shopping, marketplace, consumer goods',
    education: 'Schools, universities, online learning, educational content',
    realestate: 'Property, housing, real estate, construction',
    food: 'Restaurants, food delivery, culinary, hospitality',
    travel: 'Tourism, hospitality, travel booking, adventure',
    fashion: 'Clothing, beauty, lifestyle, luxury brands',
    entertainment: 'Media, gaming, music, entertainment content'
  };

  const usageContext = {
    web: 'Web applications, websites, responsive design',
    mobile: 'Mobile apps, iOS, Android, touch interfaces',
    print: 'Print materials, brochures, magazines, books',
    branding: 'Logo design, brand identity, marketing materials',
    ui: 'User interface design, dashboards, admin panels'
  };

  const toneGuide = toneGuidelines[tone] || toneGuidelines.professional;
  const industryDesc = industryContext[industry] || industryContext.technology;
  const usageDesc = usageContext[usage] || usageContext.web;

  const aiPrompt = `
You are a world-class typography expert and UI/UX designer.
Suggest font combinations for ${industryDesc} applications with ${toneGuide} tone.

RESPONSE RULES:
1. Return ONLY valid JSON. No markdown, explanations, or code blocks.
2. Include 3-5 font combinations with detailed reasoning.
3. Ensure web-safe fonts and Google Fonts availability.
4. ${depthFocus ? 'Include detailed typography principles and usage guidelines' : 'Keep it practical and actionable'}.

FONT REQUIREMENTS:
- Industry: ${industryDesc}
- Tone: ${toneGuide}
- Usage: ${usageDesc}
- Accessibility: Ensure good readability and contrast
- Web-safe: Prioritize Google Fonts and system fonts
- Pairing: Create harmonious combinations with clear hierarchy

${prompt ? `CUSTOM REQUIREMENTS: ${prompt}` : ''}

JSON STRUCTURE:
{
  "industry": "${industry}",
  "tone": "${tone}",
  "usage": "${usage}",
  "combinations": [
    {
      "name": "Combination name",
      "description": "Brief description of the combination",
      "heading": {
        "primary": "Font Name",
        "fallback": "Arial, sans-serif",
        "weight": "600",
        "size": "2.5rem",
        "usage": "Main headings, hero text"
      },
      "body": {
        "primary": "Font Name",
        "fallback": "Arial, sans-serif",
        "weight": "400",
        "size": "1rem",
        "usage": "Body text, paragraphs"
      },
      "accent": {
        "primary": "Font Name",
        "fallback": "Arial, sans-serif",
        "weight": "500",
        "size": "1.125rem",
        "usage": "Subheadings, captions"
      },
      "reasoning": "Why this combination works well",
      "bestFor": ["Use case 1", "Use case 2"],
      "googleFonts": ["Font Name 1", "Font Name 2"],
      "accessibility": "Accessibility considerations"
    }
  ],
  "principles": {
    "contrast": "Guidelines for font contrast and hierarchy",
    "spacing": "Line height and letter spacing recommendations",
    "scaling": "Responsive font sizing strategy"
  },
  "tags": ["${tone}", "${industry}", "${usage}", "accessible"]
}`;

  return aiPrompt;
};

const generateFontSuggestionsWithAI = async ({ prompt, industry, tone, usage, model = 'gemini-2.5-pro' }) => {
  try {
    const aiPrompt = buildFontSuggestionsPrompt({
      industry,
      tone,
      usage,
      prompt,
      model
    });

    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(aiPrompt);
    let responseText = result.response.text();
    
    responseText = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    
    try {
      const fonts = JSON.parse(responseText);
      
      // Normalize and validate the font suggestions data
      const normalizedFonts = normalizeFontSuggestions(fonts, industry, tone, usage);
      return normalizedFonts;
    } catch (parseError) {
      return generateDefaultFontSuggestions(industry, tone);
    }
  } catch (error) {
    return generateDefaultFontSuggestions(industry, tone);
  }
};

// Helper function to normalize font suggestions data
const normalizeFontSuggestions = (fonts, industry, tone, usage) => {
  const normalized = {
    industry: fonts.industry || industry,
    tone: fonts.tone || tone,
    usage: fonts.usage || usage,
    combinations: Array.isArray(fonts.combinations) ? fonts.combinations.map(combo => ({
      name: combo.name || 'Font Combination',
      description: combo.description || 'Professional font combination',
      heading: {
        primary: combo.heading?.primary || 'Inter',
        fallback: combo.heading?.fallback || 'Arial, sans-serif',
        weight: combo.heading?.weight || '600',
        size: combo.heading?.size || '2.5rem',
        usage: combo.heading?.usage || 'Main headings, hero text'
      },
      body: {
        primary: combo.body?.primary || 'Inter',
        fallback: combo.body?.fallback || 'Arial, sans-serif',
        weight: combo.body?.weight || '400',
        size: combo.body?.size || '1rem',
        usage: combo.body?.usage || 'Body text, paragraphs'
      },
      accent: {
        primary: combo.accent?.primary || 'Inter',
        fallback: combo.accent?.fallback || 'Arial, sans-serif',
        weight: combo.accent?.weight || '500',
        size: combo.accent?.size || '1.125rem',
        usage: combo.accent?.usage || 'Subheadings, captions'
      },
      reasoning: combo.reasoning || 'Professional and readable combination',
      bestFor: Array.isArray(combo.bestFor) ? combo.bestFor : ['General use'],
      googleFonts: Array.isArray(combo.googleFonts) ? combo.googleFonts : [combo.heading?.primary || 'Inter'],
      accessibility: combo.accessibility || 'Good contrast and readability'
    })) : [],
    principles: fonts.principles || {
      contrast: 'Ensure sufficient contrast between text and background',
      spacing: 'Use appropriate line height and letter spacing',
      scaling: 'Implement responsive font sizing'
    },
    tags: Array.isArray(fonts.tags) ? fonts.tags : [tone, industry, usage, 'accessible']
  };

  return normalized;
};

// Enhanced UX Audit
const buildUXAuditPrompt = (options = {}) => {
  const {
    imageUrl = '',
    description = '',
    context = 'general web application',
    focusAreas = ['all'],
    model = 'gemini-2.5-pro'
  } = options;

  const depthFocus = model.includes('pro');

  const focusAreaGuidelines = {
    accessibility: 'WCAG compliance, screen reader support, keyboard navigation, color contrast',
    usability: 'User flow, navigation, information architecture, task completion',
    visualDesign: 'Visual hierarchy, consistency, branding, aesthetics, layout',
    performance: 'Loading speed, responsiveness, optimization, technical performance',
    content: 'Clarity, readability, information density, content strategy',
    engagement: 'User engagement, call-to-actions, conversion optimization',
    mobile: 'Mobile responsiveness, touch interactions, mobile-specific UX',
    all: 'Comprehensive analysis across all UX dimensions'
  };

  const contextGuidelines = {
    'general web application': 'Standard web application with typical user flows',
    'e-commerce': 'Online shopping, product discovery, checkout process',
    'landing page': 'Marketing page, lead generation, conversion focus',
    'dashboard': 'Data visualization, admin interface, complex interactions',
    'mobile app': 'Mobile-first design, touch interactions, app-specific patterns',
    'portfolio': 'Creative showcase, visual presentation, personal branding',
    'blog': 'Content consumption, reading experience, information architecture',
    'saas': 'Software as a service, feature discovery, user onboarding'
  };

  const focusDesc = focusAreas.map(area => focusAreaGuidelines[area] || area).join(', ');
  const contextDesc = contextGuidelines[context] || contextGuidelines['general web application'];

  const aiPrompt = `
You are a world-class UX researcher and design expert.
Perform a comprehensive UX audit for a ${contextDesc}.

RESPONSE RULES:
1. Return ONLY valid JSON. No markdown, explanations, or code blocks.
2. Provide specific, actionable recommendations with clear priorities.
3. Include quantitative scores (0-100) for each category.
4. ${depthFocus ? 'Include detailed analysis with specific examples and best practices' : 'Keep it concise but comprehensive'}.

AUDIT REQUIREMENTS:
- Context: ${contextDesc}
- Focus Areas: ${focusDesc}
- Image Analysis: ${imageUrl ? 'Analyze the provided image for visual design and layout issues' : 'No image provided'}
- Description: ${description || 'No description provided'}
- Scoring: Use 0-100 scale (90-100: Excellent, 70-89: Good, 50-69: Needs Improvement, 0-49: Poor)

${imageUrl ? `IMAGE URL: ${imageUrl}` : ''}

JSON STRUCTURE:
{
  "overallScore": 85,
  "summary": "Brief overall assessment",
  "categories": {
    "accessibility": {
      "score": 80,
      "issues": [
        {
          "type": "error|warning|info",
          "title": "Issue title",
          "description": "Detailed description",
          "severity": "high|medium|low",
          "suggestion": "Specific recommendation",
          "priority": "high|medium|low"
        }
      ]
    },
    "usability": {
      "score": 85,
      "issues": []
    },
    "visualDesign": {
      "score": 90,
      "issues": []
    },
    "performance": {
      "score": 75,
      "issues": []
    },
    "content": {
      "score": 80,
      "issues": []
    },
    "engagement": {
      "score": 85,
      "issues": []
    }
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "accessibility|usability|visualDesign|performance|content|engagement",
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "impact": "Expected impact on user experience",
      "effort": "Implementation effort required"
    }
  ],
  "strengths": [
    "What's working well",
    "Positive aspects to maintain"
  ],
  "quickWins": [
    "Easy improvements with high impact"
  ],
  "nextSteps": [
    "Immediate actions to take",
    "Follow-up items"
  ],
  "tags": ["${context}", "ux-audit", "recommendations"]
}`;

  return aiPrompt;
};

const performUXAuditWithAI = async ({ imageUrl, description, context, focusAreas, model = 'gemini-2.5-pro' }) => {
  try {
    const aiPrompt = buildUXAuditPrompt({
      imageUrl,
      description,
      context,
      focusAreas,
      model
    });

    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(aiPrompt);
    let responseText = result.response.text();
    
    responseText = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    
    try {
      const audit = JSON.parse(responseText);
      
      // Normalize and validate the audit data
      const normalizedAudit = normalizeUXAudit(audit, context, focusAreas);
      return normalizedAudit;
    } catch (parseError) {
      return generateDefaultUXAudit();
    }
  } catch (error) {
    return generateDefaultUXAudit();
  }
};

// Helper function to normalize UX audit data
const normalizeUXAudit = (audit, context, focusAreas) => {
  const safeScore = (score, defaultScore = 75) => {
    const numScore = typeof score === 'number' ? score : parseInt(score) || defaultScore;
    return Math.max(0, Math.min(100, numScore));
  };

  const safeIssues = (issues) => {
    if (!Array.isArray(issues)) return [];
    return issues.map(issue => ({
      type: issue.type || 'info',
      title: issue.title || 'Issue',
      description: issue.description || '',
      severity: issue.severity || 'low',
      suggestion: issue.suggestion || '',
      priority: issue.priority || 'low'
    }));
  };

  const normalized = {
    overallScore: safeScore(audit.overallScore, 75),
    summary: audit.summary || 'UX audit completed',
    categories: {
      accessibility: {
        score: safeScore(audit.categories?.accessibility?.score, 70),
        issues: safeIssues(audit.categories?.accessibility?.issues)
      },
      usability: {
        score: safeScore(audit.categories?.usability?.score, 75),
        issues: safeIssues(audit.categories?.usability?.issues)
      },
      visualDesign: {
        score: safeScore(audit.categories?.visualDesign?.score, 80),
        issues: safeIssues(audit.categories?.visualDesign?.issues)
      },
      performance: {
        score: safeScore(audit.categories?.performance?.score, 75),
        issues: safeIssues(audit.categories?.performance?.issues)
      },
      content: {
        score: safeScore(audit.categories?.content?.score, 80),
        issues: safeIssues(audit.categories?.content?.issues)
      },
      engagement: {
        score: safeScore(audit.categories?.engagement?.score, 75),
        issues: safeIssues(audit.categories?.engagement?.issues)
      }
    },
    recommendations: Array.isArray(audit.recommendations) ? audit.recommendations.map(rec => ({
      priority: rec.priority || 'medium',
      category: rec.category || 'general',
      title: rec.title || 'Recommendation',
      description: rec.description || '',
      impact: rec.impact || 'Medium impact',
      effort: rec.effort || 'Medium effort'
    })) : [],
    strengths: Array.isArray(audit.strengths) ? audit.strengths : ['Good overall design'],
    quickWins: Array.isArray(audit.quickWins) ? audit.quickWins : ['Improve contrast ratios'],
    nextSteps: Array.isArray(audit.nextSteps) ? audit.nextSteps : ['Implement recommendations'],
    tags: Array.isArray(audit.tags) ? audit.tags : [context, 'ux-audit', 'recommendations']
  };

  return normalized;
};

// Default fallback functions
const generateDefaultColorPalette = (mood, industry) => ({
  name: `${mood} ${industry} Palette`,
  description: `A ${mood} color palette for ${industry} applications`,
  colors: {
    primary: { hex: '#3B82F6', rgb: { r: 59, g: 130, b: 246 }, hsl: { h: 217, s: 91, l: 60 } },
    secondary: { hex: '#64748B', rgb: { r: 100, g: 116, b: 139 }, hsl: { h: 215, s: 16, l: 47 } },
    accent: { hex: '#F59E0B', rgb: { r: 245, g: 158, b: 11 }, hsl: { h: 43, s: 92, l: 50 } },
    background: { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 } },
    text: { hex: '#1F2937', rgb: { r: 31, g: 41, b: 55 }, hsl: { h: 220, s: 26, l: 17 } }
  }
});

const generateDefaultFontSuggestions = (industry, tone) => ({
  heading: { primary: 'Inter', secondary: 'Poppins', accent: 'Playfair Display' },
  body: { primary: 'Inter', secondary: 'Open Sans', accent: 'Source Sans Pro' },
  display: { primary: 'Montserrat', secondary: 'Roboto', accent: 'Lora' }
});

const generateDefaultUXAudit = () => ({
  overallScore: 75,
  scores: {
    usability: 80,
    accessibility: 70,
    performance: 75,
    design: 80
  },
  recommendations: [
    'Improve color contrast for better accessibility',
    'Add more whitespace for better readability',
    'Optimize images for faster loading'
  ]
});

module.exports = {
  buildPrompt,
  generateLayoutWithAI,
  buildColorPalettePrompt,
  generateColorPaletteWithAI,
  buildFontSuggestionsPrompt,
  generateFontSuggestionsWithAI,
  buildUXAuditPrompt,
  performUXAuditWithAI,
  analyzeBrand,
  generateSite
};
