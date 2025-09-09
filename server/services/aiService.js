const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const JSON5 = require('json5');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
      cta: 'Get Started Free'
    },
    healthcare: {
      heroTitle: 'Advanced Healthcare Solutions',
      heroSubtitle: 'Improving patient care through innovative technology',
      features: ['Patient Management', 'Telemedicine', 'Data Security', 'Compliance'],
      cta: 'Schedule Demo'
    },
    finance: {
      heroTitle: 'Secure Financial Solutions',
      heroSubtitle: 'Banking and financial services you can trust',
      features: ['Secure Banking', 'Investment Tools', 'Risk Management', 'Compliance'],
      cta: 'Open Account'
    },
    ecommerce: {
      heroTitle: 'Boost Your Online Sales',
      heroSubtitle: 'Complete e-commerce solutions for modern businesses',
      features: ['Online Store', 'Payment Processing', 'Inventory Management', 'Analytics'],
      cta: 'Start Selling'
    },
    education: {
      heroTitle: 'Transform Learning Experience',
      heroSubtitle: 'Advanced educational platforms for modern learning',
      features: ['Interactive Courses', 'Progress Tracking', 'Certification', 'Community'],
      cta: 'Start Learning'
    },
    realestate: {
      heroTitle: 'Find Your Dream Property',
      heroSubtitle: 'Premium real estate solutions for buyers and sellers',
      features: ['Property Search', 'Virtual Tours', 'Market Analysis', 'Expert Agents'],
      cta: 'Browse Properties'
    },
    food: {
      heroTitle: 'Delicious Food Delivered',
      heroSubtitle: 'Fresh ingredients, amazing flavors, delivered to your door',
      features: ['Fresh Ingredients', 'Fast Delivery', 'Custom Orders', 'Quality Guarantee'],
      cta: 'Order Now'
    },
    travel: {
      heroTitle: 'Explore the World',
      heroSubtitle: 'Discover amazing destinations and create unforgettable memories',
      features: ['Best Deals', 'Expert Guides', '24/7 Support', 'Flexible Booking'],
      cta: 'Book Now'
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

  const colors = colorSchemes[colorScheme] || colorSchemes.blue;
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
3. Inline ALL CSS in <style> and ALL JS in <script>.
4. Mobile-first responsive design with breakpoints at 640px, 768px, 1024px, and 1280px.
5. Use CSS variables in :root for colors, typography, spacing, shadows.
6. ${depthFocus ? 'Include advanced ARIA roles, WCAG compliance, and semantic structure' : 'Keep it simple but correct and semantic'}.
7. ${depthFocus ? 'Add IntersectionObserver animations, lazy loading, SEO meta tags, Open Graph' : 'Focus on speed and clean code'}.
8. All images MUST be real Unsplash links.

DESIGN SPECS:
- Layout: ${layoutType}
- Style: ${styleGuide}
- Primary: ${colors.primary} | Secondary: ${colors.secondary} | Accent: ${colors.accent}
- Industry: ${industry} | Target Audience: ${targetAudience}

COMPONENTS:
${componentDescriptions.map(c => `- ${c}`).join('\n')}

CONTENT:
- Hero Title: ${industryData.heroTitle}
- Hero Subtitle: ${industryData.heroSubtitle}
- Features: ${industryData.features.join(', ')}
- CTA Button: ${industryData.cta}

${customBrief ? `CUSTOM BRIEF: ${customBrief}` : ''}

DELIVERABLE:
A single standalone HTML5 file that runs immediately in a browser.`;


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

    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(aiPrompt);
    
    if (!result || !result.response) {
      throw new Error('No response received from AI model');
    }
    
    let responseText = result.response.text();
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response received from AI model');
    }
    
    // Clean up the response
    responseText = responseText
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^```html$/gm, '')
      .replace(/^```$/gm, '')
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


    // Validate final HTML output
    if (!responseText.includes('<!DOCTYPE html>')) {
      responseText = `<!DOCTYPE html>\n${responseText}`;
    }
    
    if (!responseText.includes('</html>')) {
      responseText = `${responseText}\n</html>`;
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


    return finalResponse;
    
  } catch (error) {
    console.error('❌ Layout generation error:', error);
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

// Color Palette Generation
const generateColorPaletteWithAI = async ({ prompt, mood, industry, paletteType, model = 'gemini-2.5-pro' }) => {
  try {
    const systemPrompt = `Generate a ${mood} color palette for ${industry} applications. Return JSON with primary, secondary, accent colors and their hex codes.`;
    
    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(systemPrompt);
    let responseText = result.response.text();
    
    responseText = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    
    try {
      const palette = JSON.parse(responseText);
      return palette;
    } catch (parseError) {
      return generateDefaultColorPalette(mood, industry);
    }
  } catch (error) {
    return generateDefaultColorPalette(mood, industry);
  }
};

// Font Suggestion
const generateFontSuggestionsWithAI = async ({ prompt, industry, tone, usage, model = 'gemini-2.5-pro' }) => {
  try {
    const systemPrompt = `Suggest fonts for ${industry} applications with ${tone} tone. Return JSON with heading, body, and accent font suggestions.`;
    
    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(systemPrompt);
    let responseText = result.response.text();
    
    responseText = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    
    try {
      const fonts = JSON.parse(responseText);
      return fonts;
    } catch (parseError) {
      return generateDefaultFontSuggestions(industry, tone);
    }
  } catch (error) {
    return generateDefaultFontSuggestions(industry, tone);
  }
};

// UX Audit
const performUXAuditWithAI = async ({ imageUrl, description, context, focusAreas, model = 'gemini-2.5-pro' }) => {
  try {
    const systemPrompt = `Perform a UX audit based on the provided image and description. Focus on: ${focusAreas.join(', ')}. Return JSON with scores and recommendations.`;
    
    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(systemPrompt);
    let responseText = result.response.text();
    
    responseText = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    
    try {
      const audit = JSON.parse(responseText);
      return audit;
    } catch (parseError) {
      return generateDefaultUXAudit();
    }
  } catch (error) {
    return generateDefaultUXAudit();
  }
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
  generateLayoutWithAI
};
