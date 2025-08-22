const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const JSON5 = require('json5');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parsing helpers
const stripCodeFences = (text) => text.replace(/```[a-zA-Z]*|```/g, '').trim();
const tryParsers = (text) => {
  try { return JSON.parse(text); } catch (_) {}
  try { return JSON5.parse(text); } catch (_) {}
  return undefined;
};
const extractBracketed = (text) => {
  const objStart = text.indexOf('{');
  const objEnd = text.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    const candidate = text.slice(objStart, objEnd + 1);
    const parsed = tryParsers(candidate);
    if (parsed !== undefined) return parsed;
  }
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const candidate = text.slice(arrStart, arrEnd + 1);
    const parsed = tryParsers(candidate);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};
const parseGeminiJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return undefined;
  const cleaned = stripCodeFences(rawText);
  let parsed = tryParsers(cleaned);
  if (parsed !== undefined) return parsed;
  parsed = extractBracketed(cleaned);
  return parsed;
};

// Layout Generation
const generateLayoutWithAI = async ({ prompt, layoutType, style, userPreferences }) => {
  try {
    const systemPrompt = `You are an expert UI/UX designer and frontend developer. Generate a comprehensive layout structure based on the user's requirements.\n\nLayout Type: ${layoutType}\nStyle: ${style}\nUser Preferences: ${JSON.stringify(userPreferences || {})}\n\nAlways include a non-empty 'components' array with at least a header, hero section, and footer. Always output full, valid JSON for all nested objects and arrays. Do not use [Object] or [Array] placeholders. Generate a JSON response with the following structure: ...`;
    const userPrompt = `Create a ${layoutType} layout with ${style} style. Requirements: ${prompt}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    let responseText = result.response.text();
    responseText = stripCodeFences(responseText);
    try {
      let layout = parseGeminiJson(responseText);
      // Ensure components is an array, not a string
      
      if (layout && typeof layout.components === 'string') {
        let compStr = layout.components.trim();
        // Fallback: Replace [Object] with {} and [Array] with []
        compStr = compStr.replace(/\[Object\]/g, '{}').replace(/\[Array\]/g, '[]');
        try {
          layout.components = JSON5.parse(compStr);
          if (!Array.isArray(layout.components)) layout.components = [];
          // If any [Object] or [Array] remain, treat as invalid
          const asString = JSON.stringify(layout.components);
          if (asString.includes('[Object]') || asString.includes('[Array]')) {
            layout.components = [];
          }
        } catch (e) {
          layout.components = [];
        }
      }
      // Truncate description to 500 characters if needed
      if (layout && typeof layout.description === 'string' && layout.description.length > 500) {
        layout.description = layout.description.slice(0, 500);
      }
      return layout;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return generateDefaultLayout(layoutType, style);
    }
  } catch (error) {
    console.error('Gemini layout generation error:', error);
    return generateDefaultLayout(layoutType, style);
  }
};

// Color Palette Generation
const generateColorPaletteWithAI = async ({ prompt, mood, industry, paletteType }) => {
  try {
    const systemPrompt = `You are an expert color theorist and designer. Generate a color palette based on the user's requirements.\n\nMood: ${mood}\nIndustry: ${industry}\nPalette Type: ${paletteType}\n\nGenerate a JSON response with the following structure: ...`;
    const userPrompt = `Create a ${paletteType} color palette with ${mood} mood for ${industry} industry. Requirements: ${prompt}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    let responseText = result.response.text();
    responseText = stripCodeFences(responseText);
    try {
      const parsed = parseGeminiJson(responseText);
      if (parsed !== undefined) return parsed;
      const hexes = responseText.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || [];
      if (hexes.length) {
        return { name: `${mood} ${industry} Palette`, description: 'Extracted from model output', colors: hexes };
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return generateDefaultColorPalette(mood, industry);
    }
  } catch (error) {
    console.error('Gemini color palette generation error:', error);
    return generateDefaultColorPalette(mood, industry);
  }
};

// Font Suggestion
const generateFontSuggestionsWithAI = async ({ prompt, industry, tone, usage }) => {
  try {
    const systemPrompt = `You are an expert typographer and designer. Suggest font pairings based on the user's requirements.\n\nIndustry: ${industry}\nTone: ${tone}\nUsage: ${usage}\n\nGenerate a JSON response with the following structure: ...`;
    const userPrompt = `Suggest font pairings for ${industry} industry with ${tone} tone for ${usage} usage. Requirements: ${prompt}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    let responseText = result.response.text();
    responseText = stripCodeFences(responseText);
    try {
      const parsed = parseGeminiJson(responseText);
      if (parsed !== undefined) return parsed;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return generateDefaultFontSuggestions(industry, tone);
    }
  } catch (error) {
    console.error('Gemini font suggestion error:', error);
    return generateDefaultFontSuggestions(industry, tone);
  }
};

// UX Audit
const performUXAuditWithAI = async ({ imageUrl, description, context, focusAreas }) => {
  try {
    const systemPrompt = `You are an expert UX auditor. Score the design across 5 categories (0-20 each): Visual Design, Usability, Accessibility, Content Clarity, Engagement & Feedback. Provide a total UX score out of 100. Return STRICT JSON only with this exact schema (no extra prose):\n{\n  overallScore: number,\n  categories: {\n    visualDesign: { score: number, issues: Array<{ title: string, description: string, recommendation: string, severity: 'low'|'medium'|'high' }> },\n    usability: { score: number, issues: Array<{ title: string, description: string, recommendation: string, severity: 'low'|'medium'|'high' }> },\n    accessibility: { score: number, issues: Array<{ title: string, description: string, recommendation: string, severity: 'low'|'medium'|'high' }> },\n    contentClarity: { score: number, issues: Array<{ title: string, description: string, recommendation: string, severity: 'low'|'medium'|'high' }> },\n    engagementFeedback: { score: number, issues: Array<{ title: string, description: string, recommendation: string, severity: 'low'|'medium'|'high' }> }\n  },\n  strengths: string[],\n  recommendations: string[],\n  quickWins: string[],\n  brief: string\n}`;
    const inputDescr = description ? `Description:\n${description}` : '';
    const inputImage = imageUrl ? `Image URL: ${imageUrl}` : '';
    const userPrompt = `${inputImage}\n${inputDescr}\nFocus Areas: ${focusAreas || 'all areas'}\nContext: ${context || 'general web application'}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    let responseText = result.response.text();
    responseText = stripCodeFences(responseText);
    try {
      let parsed;
      try {
        parsed = parseGeminiJson(responseText);
      } catch (innerErr) {
        console.error('UX audit parse error (inner):', innerErr);
        parsed = undefined;
      }
      if (parsed !== undefined) return parsed;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
    }
    return generateDefaultUXAudit();
  } catch (error) {
    console.error('Gemini UX audit error:', error);
    return generateDefaultUXAudit();
  }
};

// Default generators for fallback
const generateDefaultLayout = (layoutType, style) => ({
  title: `${style} ${layoutType} Layout`,
  description: `A ${style} ${layoutType} layout generated by DesignMate AI`,
  structure: {
    header: { type: 'fixed', height: '60px', components: ['logo', 'navigation'] },
    main: { type: 'grid', columns: 12, sections: ['hero', 'content'] },
    footer: { type: 'full-width', sections: ['links', 'copyright'] }
  },
  components: [
    {
      name: 'Hero Section',
      type: 'hero',
      position: { x: 0, y: 0 },
      size: { width: '100%', height: '400px' },
      properties: { background: 'solid', textAlign: 'center' },
      content: 'Hero content'
    }
  ],
  responsive: {
    mobile: { columns: 1, spacing: '16px' },
    tablet: { columns: 6, spacing: '24px' },
    desktop: { columns: 12, spacing: '32px' }
  },
  colors: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    accent: 'Inter'
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px'
  },
  grid: {
    columns: 12,
    gap: '24px',
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' }
  },
  accessibility: {
    contrastRatio: 4.5,
    colorBlindFriendly: true,
    keyboardNavigation: true,
    screenReaderFriendly: true
  },
  performance: {
    loadTime: 2.5,
    optimization: ['lazy-loading', 'image-optimization']
  },
  tags: [style, layoutType, 'responsive']
});

const generateDefaultColorPalette = (mood, industry) => ({
  name: `${mood} ${industry} Palette`,
  description: `A ${mood} color palette for ${industry} applications`,
  colors: {
    primary: { hex: '#3B82F6', rgb: { r: 59, g: 130, b: 246 }, hsl: { h: 217, s: 91, l: 60 } },
    secondary: { hex: '#64748B', rgb: { r: 100, g: 116, b: 139 }, hsl: { h: 215, s: 16, l: 47 } },
    accent: { hex: '#F59E0B', rgb: { r: 245, g: 158, b: 11 }, hsl: { h: 43, s: 92, l: 50 } },
    neutral: [
      { hex: '#F8FAFC', rgb: { r: 248, g: 250, b: 252 }, hsl: { h: 210, s: 40, l: 98 }, name: 'Light Gray' }
    ],
    background: { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 } },
    text: { hex: '#1F2937', rgb: { r: 31, g: 41, b: 55 }, hsl: { h: 220, s: 13, l: 18 } }
  },
  paletteType: 'complementary',
  mood,
  industry,
  accessibility: {
    contrastRatio: 4.5,
    wcagAA: true,
    wcagAAA: false,
    colorBlindFriendly: true
  },
  usage: { web: true, mobile: true, print: false, branding: true },
  tags: [mood, industry, 'accessible']
});

const generateDefaultFontSuggestions = (industry, tone) => ({
  heading: { primary: 'Inter', secondary: 'Poppins', accent: 'Playfair Display' },
  body: { primary: 'Inter', secondary: 'Open Sans', accent: 'Source Sans Pro' },
  display: { primary: 'Playfair Display', secondary: 'Merriweather', accent: 'Lora' },
  monospace: { primary: 'Fira Code', secondary: 'JetBrains Mono', accent: 'Source Code Pro' },
  pairings: [
    {
      name: 'Modern Professional',
      heading: 'Inter',
      body: 'Inter',
      description: 'Clean and modern for professional applications'
    }
  ],
  recommendations: [
    'Use Inter for headings and body text for consistency',
    'Consider Poppins for accent text',
    'Ensure proper font loading and fallbacks'
  ],
  tags: ['modern', 'professional', 'readable']
});

const generateDefaultUXAudit = () => ({
  overallScore: 75,
  issues: [
    {
      type: 'accessibility',
      severity: 'medium',
      title: 'Improve contrast',
      description: 'Some text elements could benefit from better contrast',
      recommendation: 'Review color combinations for better readability',
      location: 'general'
    }
  ],
  strengths: [
    {
      title: 'Good visual hierarchy',
      description: 'Clear organization of content elements'
    }
  ],
  accessibility: { score: 70, issues: ['contrast'], recommendations: ['improve contrast'] },
  usability: { score: 80, issues: [], recommendations: ['continue current practices'] },
  visual: { score: 85, issues: [], recommendations: ['maintain current design quality'] },
  performance: { score: 75, issues: ['optimization'], recommendations: ['optimize assets'] },
  summary: 'Good design with room for accessibility improvements',
  priority: ['accessibility', 'performance', 'usability', 'visual']
});

module.exports = {
  generateLayoutWithAI,
  generateColorPaletteWithAI,
  generateFontSuggestionsWithAI,
  performUXAuditWithAI
}; 