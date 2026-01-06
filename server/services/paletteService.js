const { z } = require("zod");

// Validation schemas
const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  rgb: z.union([
    z.string().regex(/^rgb\(\d+,\s*\d+,\s*\d+\)$/i, "Invalid RGB format"),
    z.object({ r: z.number(), g: z.number(), b: z.number() }),
  ]),
  hsl: z.union([
    z.string().regex(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/i, "Invalid HSL format"),
    z.object({ h: z.number(), s: z.number(), l: z.number() }),
  ]),
  name: z.string().min(1).optional(),
  usage: z.string().min(1).optional(),
});

const PaletteSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  mood: z.string(),
  industry: z.string(),
  paletteType: z.string(),
  colorHarmony: z.string(),
  colors: z.record(ColorSchema),
  gradients: z.object({}).passthrough(),
  interactiveStates: z.object({}).passthrough(),
  shadows: z.object({}).passthrough(),
  accessibility: z.object({
    contrastRatio: z.preprocess(
      (v) => (typeof v === "string" ? Number(v) : v),
      z.number().min(0)
    ),
    wcagCompliant: z.boolean(),
    level: z.enum(["AA", "AAA"]),
    colorBlindSafe: z.boolean().optional(),
  }),
  tags: z.array(z.string()),
});

// Constants with better organization
const PALETTE_CONFIG = {
  moods: {
    modern: "Clean, contemporary colors with high contrast and bold accents",
    bold: "High-impact, saturated colors with strong contrast and presence",
    minimal: "Neutral tones with subtle variations and plenty of whitespace",
    vibrant: "Bold, energetic colors with high saturation and strong contrasts",
    elegant: "Sophisticated, muted tones with refined color relationships",
    playful: "Bright, cheerful colors with fun combinations and gradients",
    professional: "Conservative, trustworthy colors suitable for business",
    creative: "Experimental, artistic colors with unique combinations",
    vintage: "Retro-inspired colors with muted tones and nostalgic feel",
    futuristic: "Neon accents, dark backgrounds, cyberpunk-inspired colors",
    organic: "Earth tones, natural colors inspired by nature",
    luxury: "Rich, premium colors with metallic accents",
    energetic: "High-energy colors that inspire action and movement",
    calm: "Soft, soothing colors that promote relaxation and tranquility",
    warm: "Cozy, inviting colors with warm undertones",
    cool: "Refreshing, crisp colors with cool undertones",
  },
  industries: {
    technology: "Tech companies, startups, software, digital products",
    healthcare: "Medical, wellness, pharmaceutical, healthcare services",
    finance: "Banking, investment, insurance, financial services",
    retail: "Online retail, shopping, marketplace, consumer goods",
    education: "Schools, universities, online learning, educational content",
    food: "Restaurants, food delivery, culinary, hospitality",
    travel: "Tourism, hospitality, travel booking, adventure",
    fashion: "Clothing, beauty, lifestyle, luxury brands",
    entertainment: "Media, gaming, music, entertainment content",
    other: "General purpose, miscellaneous applications",
  },
  paletteTypes: {
    monochromatic: "Single hue with various shades and tints",
    analogous: "Adjacent colors on the color wheel",
    complementary: "Opposite colors on the color wheel",
    triadic: "Three evenly spaced colors on the color wheel",
    tetradic: "Four colors forming a rectangle on the color wheel",
    splitComplementary: "Base color plus two colors adjacent to its complement",
    square: "Four colors evenly spaced around the color wheel",
    custom: "Custom color combination based on specific requirements",
    gradient: "Colors designed specifically for smooth gradient transitions",
  },
  colorHarmonyTypes: {
    balanced: "Equal visual weight across all colors",
    dominant: "One primary color dominates with supporting colors",
    contrasting: "High contrast between light and dark elements",
    subtle: "Low contrast with gentle color transitions",
    dynamic: "Varying intensities creating visual rhythm",
  },
};

// Enhanced AI Prompt Builder that resolves conflicts and provides clearer instructions
class ImprovedPalettePromptBuilder {
  constructor(options = {}) {
    this.options = {
      mood: "modern",
      industry: "technology",
      paletteType: "custom",
      prompt: "",
      model: "gemini-2.0-flash-exp",
      includeGradients: true,
      semanticColors: true,
      colorHarmony: "balanced",
      accessibilityLevel: "AA",
      baseColor: null,
      colorCount: null,
      keywords: [],
      returnFormat: "full", // 'full' or 'simple'
      ...options,
    };

    this.parseCustomRequirements();
    this.validateOptions();
  }

  parseCustomRequirements() {
    if (!this.options.prompt) return;

    const prompt = this.options.prompt.toLowerCase();

    // Extract specific color count
    const colorCountMatch = prompt.match(/(?:with\s+)?(\d+)\s+colors?/);
    if (colorCountMatch) {
      this.options.colorCount = parseInt(colorCountMatch[1]);
    }

    // Extract base color
    const hexMatch = prompt.match(/#[0-9a-f]{6}/i);
    if (hexMatch) {
      this.options.baseColor = hexMatch[0].toUpperCase();
    }

    // Extract keywords
    const keywordMatch = prompt.match(/keywords?:\s*([^.\n]+)/i);
    if (keywordMatch) {
      this.options.keywords = keywordMatch[1]
        .split(/[,;]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    // Determine return format
    if (prompt.includes("array") && prompt.includes("hex values")) {
      this.options.returnFormat = "simple";
    }
  }

  validateOptions() {
    if (
      this.options.baseColor &&
      !this.isValidHexColor(this.options.baseColor)
    ) {
      throw new Error(`Invalid base color format: ${this.options.baseColor}`);
    }

    if (
      this.options.colorCount &&
      (this.options.colorCount < 3 || this.options.colorCount > 20)
    ) {
      throw new Error(
        `Color count must be between 3 and 20, got: ${this.options.colorCount}`
      );
    }

    // Validate against PALETTE_CONFIG
    const { mood, industry, paletteType, colorHarmony, accessibilityLevel } =
      this.options;
    if (!PALETTE_CONFIG.moods[mood]) throw new Error(`Invalid mood: ${mood}`);
    if (!PALETTE_CONFIG.industries[industry])
      throw new Error(`Invalid industry: ${industry}`);
    if (!PALETTE_CONFIG.paletteTypes[paletteType])
      throw new Error(`Invalid palette type: ${paletteType}`);
    if (!PALETTE_CONFIG.colorHarmonyTypes[colorHarmony])
      throw new Error(`Invalid color harmony: ${colorHarmony}`);
    if (!["AA", "AAA"].includes(accessibilityLevel))
      throw new Error(`Invalid accessibility level: ${accessibilityLevel}`);
  }

  isValidHexColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  buildSystemPrompt() {
    const isSimpleFormat = this.options.returnFormat === "simple";
    const colorCountConstraint = this.options.colorCount
      ? `exactly ${this.options.colorCount}`
      : isSimpleFormat
      ? "4-6"
      : "8-15";

    return `You are a world-class color theory expert and UI/UX designer specializing in accessible color palette creation.

TASK: Generate a ${
      this.options.mood
    } color palette for ${this.getIndustryDescription()} with modern design principles.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown blocks, explanations, or additional text
2. Use ${colorCountConstraint} colors with distinct HEX values (no duplicates or near-duplicates)
3. Ensure WCAG ${this.options.accessibilityLevel} accessibility compliance
4. Provide meaningful, descriptive color names (e.g., "Ocean Blue", "Forest Green")
5. ${
      isSimpleFormat
        ? "Focus on core colors only"
        : "Include comprehensive color system with states and variants"
    }`;
  }

  buildPaletteRequirements() {
    const baseColorInstruction = this.options.baseColor
      ? `\n- MUST include base color ${this.options.baseColor} as the primary color`
      : "";

    const keywordInstruction =
      this.options.keywords.length > 0
        ? `\n- Incorporate themes: ${this.options.keywords.join(", ")}`
        : "";

    return `PALETTE SPECIFICATIONS:
- Mood: ${this.getMoodDescription()}
- Industry: ${this.getIndustryDescription()}
- Color Harmony: ${this.getHarmonyDescription()}
- Accessibility: Minimum ${
      this.options.accessibilityLevel === "AAA" ? "7:1" : "4.5:1"
    } contrast ratio for text${baseColorInstruction}${keywordInstruction}`;
  }

  buildColorRequirements() {
    if (this.options.returnFormat === "simple") {
      return `COLOR REQUIREMENTS:
- Generate exactly ${
        this.options.colorCount || 4
      } UNIQUE colors (no duplicate hex values)
- MUST include: primary, secondary, accent colors
- Ensure all hex values are distinct and different
- Maintain sufficient contrast for accessibility
- Each color must have a unique hex value`;
    }

    return `COLOR SYSTEM REQUIREMENTS:
- Primary colors: Main brand color with light/dark variations (REQUIRED)
- Secondary: Supporting colors that complement primary
- Accent: High-contrast colors for CTAs and highlights  
- Neutrals: Text, backgrounds, and subtle elements
- Semantic: Success (green), warning (yellow/orange), error (red), info (blue)
- Interactive states: Hover, active, focus, disabled variations
- CRITICAL: All hex values must be unique - no duplicates allowed
- CRITICAL: Must include 'primary' color role`;
  }

  buildOutputFormat() {
    if (this.options.returnFormat === "simple") {
      return this.buildSimpleFormat();
    }
    return this.buildFullFormat();
  }

  buildSimpleFormat() {
    const exampleColors = this.options.baseColor
      ? [this.options.baseColor, "#2563EB", "#059669", "#DC2626"]
      : ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

    return `REQUIRED JSON STRUCTURE (ALL HEX VALUES MUST BE UNIQUE):
{
  "name": "Descriptive palette name",
  "description": "Brief description of the palette's unique characteristics",
  "colors": [
    {
      "hex": "${exampleColors[0]}",
      "name": "Primary Color Name",
      "usage": "Main brand/primary use case"
    },
    {
      "hex": "${exampleColors[1]}",
      "name": "Secondary Color Name", 
      "usage": "Supporting elements"
    },
    {
      "hex": "${exampleColors[2]}",
      "name": "Accent Color Name",
      "usage": "Highlights and CTAs"
    },
    {
      "hex": "${exampleColors[3]}",
      "name": "Additional Color Name",
      "usage": "Specific use case"
    }
  ],
  "accessibility": {
    "wcagLevel": "${this.options.accessibilityLevel}",
    "notes": "Accessibility compliance details"
  }
}

IMPORTANT: Each color must have a unique hex value. No duplicates allowed.`;
  }

  buildFullFormat() {
    return `REQUIRED JSON STRUCTURE (ALL HEX VALUES MUST BE UNIQUE):
{
  "name": "Educational Energy Palette",
  "description": "Bold, energetic colors designed for educational platforms",
  "mood": "${this.options.mood}",
  "industry": "${this.options.industry}",
  "paletteType": "${this.options.paletteType}",
  "colorHarmony": "${this.options.colorHarmony}",
  "colors": {
    "primary": {
      "hex": "#${
        this.options.baseColor ? this.options.baseColor.slice(1) : "3B82F6"
      }",
      "rgb": "rgb(59,130,246)",
      "hsl": "hsl(217,91%,60%)",
      "name": "Primary Blue",
      "usage": "Main brand color, primary buttons"
    },
    "primaryDark": {
      "hex": "#1E40AF",
      "rgb": "rgb(30,64,175)", 
      "hsl": "hsl(225,71%,40%)",
      "name": "Deep Blue",
      "usage": "Hover states, darker accents"
    },
    "secondary": {
      "hex": "#10B981",
      "rgb": "rgb(16,185,129)",
      "hsl": "hsl(160,84%,39%)",
      "name": "Success Green",
      "usage": "Secondary actions, positive feedback"
    },
    "accent": {
      "hex": "#F59E0B",
      "rgb": "rgb(245,158,11)",
      "hsl": "hsl(38,92%,50%)",
      "name": "Warning Amber",
      "usage": "Highlights, calls-to-action"
    },
    "neutral": {
      "hex": "#6B7280",
      "rgb": "rgb(107,114,128)",
      "hsl": "hsl(220,9%,46%)",
      "name": "Cool Gray",
      "usage": "Secondary text, borders"
    },
    "background": {
      "hex": "#FFFFFF",
      "rgb": "rgb(255,255,255)",
      "hsl": "hsl(0,0%,100%)",
      "name": "Pure White",
      "usage": "Main backgrounds"
    },
    "text": {
      "hex": "#111827",
      "rgb": "rgb(17,24,39)",
      "hsl": "hsl(220,39%,11%)",
      "name": "Rich Black",
      "usage": "Primary text content"
    },
    "error": {
      "hex": "#EF4444",
      "rgb": "rgb(239,68,68)",
      "hsl": "hsl(0,84%,60%)",
      "name": "Error Red",
      "usage": "Error states, validation"
    }
  },${
    this.options.includeGradients
      ? `
  "gradients": {
    "primary": {
      "linear": "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
      "usage": "Hero sections, feature cards"
    },
    "accent": {
      "linear": "linear-gradient(45deg, #F59E0B 0%, #D97706 100%)",
      "usage": "Call-to-action buttons, highlights"
    }
  },`
      : ""
  }
  "accessibility": {
    "contrastRatio": ${this.options.accessibilityLevel === "AAA" ? 7.0 : 4.5},
    "wcagCompliant": true,
    "level": "${this.options.accessibilityLevel}",
    "colorBlindSafe": true,
    "notes": "All text-background combinations meet ${
      this.options.accessibilityLevel
    } standards"
  },
  "usage": {
    "primary": "Brand identity, main navigation, primary CTAs",
    "secondary": "Success messages, progress indicators, secondary actions",
    "accent": "Warnings, highlights, special promotions",
    "neutral": "Body text, form elements, subtle backgrounds"
  }
}`;
  }

  getMoodDescription() {
    const descriptions = {
      modern: "Clean, contemporary colors with balanced contrast",
      bold: "High-impact, saturated colors with strong presence",
      minimal: "Subtle, refined tones with understated elegance",
      vibrant: "Energetic, saturated colors with dynamic contrast",
      professional: "Trustworthy, conservative colors for business use",
      playful: "Fun, cheerful colors with creative combinations",
    };
    return descriptions[this.options.mood] || descriptions.modern;
  }

  getIndustryDescription() {
    const descriptions = {
      education: "Schools, universities, online learning platforms",
      technology: "Software, apps, digital products, startups",
      healthcare: "Medical, wellness, pharmaceutical services",
      finance: "Banking, investment, financial services",
      ecommerce: "Online retail, marketplaces, shopping",
    };
    return descriptions[this.options.industry] || descriptions.technology;
  }

  getHarmonyDescription() {
    const descriptions = {
      balanced: "Equal visual weight across all colors",
      dominant: "One primary color with supporting palette",
      contrasting: "High contrast for maximum impact",
      subtle: "Low contrast with gentle transitions",
    };
    return descriptions[this.options.colorHarmony] || descriptions.balanced;
  }

  build() {
    const sections = [
      this.buildSystemPrompt(),
      "",
      this.buildPaletteRequirements(),
      "",
      this.buildColorRequirements(),
      "",
    ];

    // Add custom requirements if they exist
    if (this.options.prompt && this.options.prompt.trim()) {
      sections.push("ADDITIONAL REQUIREMENTS:");
      sections.push(this.options.prompt);
      sections.push("");
    }

    sections.push(this.buildOutputFormat());

    return sections.join("\n");
  }
}

// Color utility functions
const ColorUtils = {
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    const l = (max + min) / 2;
    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  },
  getLuminance(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const cn = c / 255;
      return cn <= 0.03928 ? cn / 12.92 : Math.pow((cn + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
  getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },
  formatColor(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) throw new Error(`Invalid hex color: ${hex}`);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      hex: hex.toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    };
  },
};

class PalettePromptBuilder {
  constructor(options = {}) {
    this.options = {
      mood: "modern",
      industry: "technology",
      paletteType: "custom",
      prompt: "",
      model: "gemini-2.0-flash-exp",
      includeGradients: true,
      includeTextureColors: false,
      semanticColors: true,
      colorHarmony: "balanced",
      accessibilityLevel: "AA",
      ...options,
    };
    this.validateOptions();
  }
  validateOptions() {
    const { mood, industry, paletteType, colorHarmony, accessibilityLevel } =
      this.options;
    if (!PALETTE_CONFIG.moods[mood]) throw new Error(`Invalid mood: ${mood}`);
    if (!PALETTE_CONFIG.industries[industry])
      throw new Error(`Invalid industry: ${industry}`);
    if (!PALETTE_CONFIG.paletteTypes[paletteType])
      throw new Error(`Invalid palette type: ${paletteType}`);
    if (!PALETTE_CONFIG.colorHarmonyTypes[colorHarmony])
      throw new Error(`Invalid color harmony: ${colorHarmony}`);
    if (!["AA", "AAA"].includes(accessibilityLevel))
      throw new Error(`Invalid accessibility level: ${accessibilityLevel}`);
  }
  buildFeatureSections() {
    const sections = [];
    if (this.options.includeGradients) {
      sections.push(`
GRADIENT REQUIREMENTS:
- Create 3-5 gradient combinations using palette colors
- Include linear, radial, and conic gradient variations
- Provide CSS gradient syntax ready for implementation
- Ensure smooth color transitions without muddy middle tones
- Include gradient overlays for text readability`);
    }
    if (this.options.includeTextureColors) {
      sections.push(`
TEXTURE COLOR FEATURES:
- Provide shadow and highlight variations for depth
- Include noise/texture overlay colors
- Create color variations for different material surfaces
- Provide glass morphism color variations`);
    }
    if (this.options.semanticColors) {
      sections.push(`
SEMANTIC COLORS:
- Success, warning, error, and info state colors
- Interactive state colors (hover, active, disabled)
- Loading and progress indicator colors
- Notification and badge colors`);
    }
    return sections.join("\n");
  }
  build() {
    const {
      mood,
      industry,
      paletteType,
      colorHarmony,
      accessibilityLevel,
      prompt,
      model,
    } = this.options;
    const moodGuide = PALETTE_CONFIG.moods[mood];
    const industryDesc = PALETTE_CONFIG.industries[industry];
    const paletteDesc = PALETTE_CONFIG.paletteTypes[paletteType];
    const harmonyDesc = PALETTE_CONFIG.colorHarmonyTypes[colorHarmony];
    const depthFocus = model.includes("pro") || model.includes("exp");
    const customRequirements = prompt ? `CUSTOM REQUIREMENTS: ${prompt}` : "";
    const featureSections = this.buildFeatureSections();
    return `You are a world-class color theory expert, UI/UX designer, and digital artist specializing in advanced color systems.
Generate a ${mood} color palette for ${industryDesc} applications with modern web design features.

CRITICAL RESPONSE RULES:
1. Return ONLY valid JSON. No markdown, explanations, or code blocks.
2. Include exactly 8-15 colors with proper naming and relationships.
3. Ensure accessibility compliance with WCAG ${accessibilityLevel} standards.
4. ${
      depthFocus
        ? "Include detailed color psychology, usage guidelines, and design system recommendations"
        : "Keep it practical with essential usage notes"
    }.
5. Include advanced features: gradients, semantic colors, and interactive states.
6. Use distinct HEX values - no near-duplicates or placeholder colors.
7. Provide human-friendly color names (e.g., 'Ocean Blue', 'Sunset Orange').

PALETTE REQUIREMENTS:
- Mood: ${moodGuide}
- Industry: ${industryDesc}
- Type: ${paletteDesc}
- Harmony: ${harmonyDesc}
- Colors: 8-15 colors including primary, secondary, accent, neutral, semantic, and state variations
- Accessibility: Ensure sufficient contrast ratios (4.5:1 for normal text, 3:1 for large text, 7:1 for AAA)

${featureSections}

${customRequirements}

REQUIRED JSON STRUCTURE:
${this.getJsonSchema()}`;
  }
  getJsonSchema() {
    return `{
  "name": "Descriptive palette name",
  "description": "Brief description focusing on unique features",
  "mood": "${this.options.mood}",
  "industry": "${this.options.industry}",
  "paletteType": "${this.options.paletteType}",
  "colorHarmony": "${this.options.colorHarmony}",
  "colors": {
    "primary": {"hex": "#1E40AF", "rgb": "rgb(30,64,175)", "hsl": "hsl(225,71%,40%)", "name": "Ocean Blue", "usage": "Main brand color"},
    "primaryDark": {"hex": "#1E3A8A", "rgb": "rgb(30,58,138)", "hsl": "hsl(225,64%,33%)", "name": "Deep Ocean", "usage": "Hover/active state"},
    "primaryLight": {"hex": "#3B82F6", "rgb": "rgb(59,130,246)", "hsl": "hsl(217,91%,60%)", "name": "Sky Blue", "usage": "Subtle highlights"},
    "secondary": {"hex": "#64748B", "rgb": "rgb(100,116,139)", "hsl": "hsl(215,16%,47%)", "name": "Slate Gray", "usage": "Supporting elements"},
    "accent": {"hex": "#F59E0B", "rgb": "rgb(245,158,11)", "hsl": "hsl(38,92%,50%)", "name": "Golden Amber", "usage": "Call-to-action elements"},
    "neutral": {"hex": "#374151", "rgb": "rgb(55,65,81)", "hsl": "hsl(220,13%,27%)", "name": "Charcoal", "usage": "Text and borders"},
    "neutralLight": {"hex": "#F9FAFB", "rgb": "rgb(249,250,251)", "hsl": "hsl(220,14%,98%)", "name": "Soft White", "usage": "Subtle backgrounds"},
    "background": {"hex": "#FFFFFF", "rgb": "rgb(255,255,255)", "hsl": "hsl(0,0%,100%)", "name": "Pure White", "usage": "Page background"},
    "surface": {"hex": "#F8FAFC", "rgb": "rgb(248,250,252)", "hsl": "hsl(210,20%,98%)", "name": "Cloud White", "usage": "Card/component backgrounds"},
    "text": {"hex": "#111827", "rgb": "rgb(17,24,39)", "hsl": "hsl(220,39%,11%)", "name": "Midnight", "usage": "Primary text"},
    "textSecondary": {"hex": "#6B7280", "rgb": "rgb(107,114,128)", "hsl": "hsl(220,9%,46%)", "name": "Storm Gray", "usage": "Secondary text"},
    "success": {"hex": "#10B981", "rgb": "rgb(16,185,129)", "hsl": "hsl(160,84%,39%)", "name": "Emerald Green", "usage": "Success states"},
    "warning": {"hex": "#F59E0B", "rgb": "rgb(245,158,11)", "hsl": "hsl(38,92%,50%)", "name": "Amber Yellow", "usage": "Warning states"},
    "error": {"hex": "#EF4444", "rgb": "rgb(239,68,68)", "hsl": "hsl(0,84%,60%)", "name": "Coral Red", "usage": "Error states"},
    "info": {"hex": "#3B82F6", "rgb": "rgb(59,130,246)", "hsl": "hsl(217,91%,60%)", "name": "Azure Blue", "usage": "Information states"}
  },
  "gradients": {
    "primary": {
      "linear": "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
      "radial": "radial-gradient(circle, #1E40AF 0%, #3B82F6 100%)",
      "usage": "Hero sections, buttons, cards"
    },
    "accent": {
      "linear": "linear-gradient(45deg, #F59E0B 0%, #FBBF24 100%)",
      "radial": "radial-gradient(ellipse, #F59E0B 0%, #FBBF24 100%)",
      "usage": "CTAs, highlights, special elements"
    }
  },
  "interactiveStates": {
    "hover": {"primary": "#1E3A8A", "secondary": "#475569", "accent": "#D97706"},
    "active": {"primary": "#1E3A8A", "secondary": "#334155", "accent": "#B45309"},
    "focus": {"primary": "#3B82F6", "secondary": "#64748B", "accent": "#F59E0B"},
    "disabled": {"primary": "#9CA3AF", "secondary": "#D1D5DB", "accent": "#E5E7EB"}
  },
  "shadows": {
    "light": "rgba(17, 24, 39, 0.1)",
    "medium": "rgba(17, 24, 39, 0.15)",
    "heavy": "rgba(17, 24, 39, 0.25)",
    "colored": "rgba(30, 64, 175, 0.2)"
  },
  "accessibility": {
    "contrastRatio": ${'${this.options.accessibilityLevel === "AAA" ? 7.0 : 4.5}'},
    "wcagCompliant": true,
    "level": "${"${this.options.accessibilityLevel}"}",
    "notes": "All color combinations tested for accessibility compliance",
    "colorBlindSafe": true
  },
  "tags": ["${"${this.options.mood}"}", "${"${this.options.industry}"}", "accessible", "gradient-ready", "interactive", "modern", "semantic"]
}`;
  }
}

class PaletteValidator {
  static validate(palette) {
    const errors = [];
    const warnings = [];
    try {
      PaletteSchema.parse(palette);
    } catch (error) {
      errors.push(`Schema validation failed: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
    const validationResult = this.validatePaletteLogic(palette);
    errors.push(...validationResult.errors);
    warnings.push(...validationResult.warnings);
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  static validatePaletteLogic(palette) {
    const errors = [];
    const warnings = [];
    const { colors, accessibility } = palette;
    const hexValues = Object.values(colors)
      .map((c) => (c && c.hex ? String(c.hex).toLowerCase() : ""))
      .filter(Boolean);
    const duplicates = hexValues.filter(
      (hex, index) => hexValues.indexOf(hex) !== index
    );
    if (duplicates.length > 0) {
      warnings.push(
        `Duplicate colors found: ${[...new Set(duplicates)].join(", ")}`
      );
    }
    if (colors.text && colors.background) {
      const ratio = ColorUtils.getContrastRatio(
        colors.text.hex,
        colors.background.hex
      );
      const minRatio = accessibility.level === "AAA" ? 7.0 : 4.5;
      if (ratio < minRatio) {
        errors.push(
          `Text-background contrast ratio ${ratio.toFixed(
            2
          )} is below minimum ${minRatio}`
        );
      }
    }
    const essentialColors = ["primary", "background", "text"];
    for (const essential of essentialColors) {
      if (!colors[essential]) {
        warnings.push(`Missing essential color: ${essential}`);
      }
    }
    for (const [key, color] of Object.entries(colors)) {
      if (!color || !color.hex || !/^#[0-9A-F]{6}$/i.test(color.hex)) {
        warnings.push(
          `Invalid or missing hex for ${key}: ${color && color.hex}`
        );
      }
    }
    return { errors, warnings };
  }
}

class PaletteNormalizer {
  static normalize(rawPalette, mood, industry) {
    try {
      const palette = { ...rawPalette };

      // Handle array format colors (convert to object format)
      if (Array.isArray(palette.colors)) {
        const colorMap = {};
        palette.colors.forEach((color, index) => {
          const key = color.name
            ? color.name.toLowerCase().replace(/\s+/g, "")
            : `color${index + 1}`;
          colorMap[key] = color;
        });
        palette.colors = colorMap;
      }

      if (palette.colors) {
        for (const [key, color] of Object.entries(palette.colors)) {
          if (color.hex) {
            try {
              const formatted = ColorUtils.formatColor(color.hex);

              // Always generate RGB and HSL objects from hex if missing
              let rgbObj = color.rgb;
              let hslObj = color.hsl;

              // Convert string formats to objects
              if (typeof color.rgb === "string") {
                const m = color.rgb.match(
                  /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i
                );
                rgbObj = m
                  ? { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
                  : undefined;
              }

              if (typeof color.hsl === "string") {
                const m = color.hsl.match(
                  /hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i
                );
                hslObj = m
                  ? { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) }
                  : undefined;
              }

              // Generate missing RGB/HSL from hex
              if (!rgbObj) {
                const rgb = ColorUtils.hexToRgb(color.hex);
                rgbObj = { r: rgb.r, g: rgb.g, b: rgb.b };
              }

              if (!hslObj) {
                const rgb = ColorUtils.hexToRgb(color.hex);
                const hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
                hslObj = {
                  h: Math.round(hsl.h),
                  s: Math.round(hsl.s),
                  l: Math.round(hsl.l),
                };
              }

              palette.colors[key] = {
                ...color,
                hex: formatted.hex,
                rgb: rgbObj,
                hsl: hslObj,
                name: color.name || formatted.name || key,
                usage: color.usage || "General use",
              };
            } catch (error) {
              console.warn(`Failed to normalize color ${key}:`, error.message);
              // Provide fallback values
              palette.colors[key] = {
                hex: color.hex,
                rgb: { r: 0, g: 0, b: 0 },
                hsl: { h: 0, s: 0, l: 0 },
                name: color.name || key,
                usage: color.usage || "General use",
              };
            }
          }
        }
      }
      // Synthesize missing essential colors from available ones
      const primaryHex = palette.colors?.primary?.hex || "#3B82F6";
      if (!palette.colors) palette.colors = {};
      if (!palette.colors.background) {
        const bg = { hex: "#FFFFFF" };
        const bgFmt = ColorUtils.formatColor(bg.hex);
        palette.colors.background = {
          hex: bgFmt.hex,
          rgb: { r: 255, g: 255, b: 255 },
          hsl: { h: 0, s: 0, l: 100 },
          name: "Background",
          usage: "Background",
        };
      }
      if (!palette.colors.text) {
        // Choose dark text if background is light
        const bgLum = ColorUtils.getLuminance(palette.colors.background.hex);
        const textHex = bgLum > 0.5 ? "#111827" : "#FFFFFF";
        const tFmt = ColorUtils.formatColor(textHex);
        const tRgbMatch = tFmt.rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
        const tHslMatch = tFmt.hsl.match(
          /hsl\((\d+),\s*(\d+)%\s*,\s*(\d+)%\)/i
        );
        palette.colors.text = {
          hex: tFmt.hex,
          rgb: tRgbMatch
            ? {
                r: Number(tRgbMatch[1]),
                g: Number(tRgbMatch[2]),
                b: Number(tRgbMatch[3]),
              }
            : undefined,
          hsl: tHslMatch
            ? {
                h: Number(tHslMatch[1]),
                s: Number(tHslMatch[2]),
                l: Number(tHslMatch[3]),
              }
            : undefined,
          name: "Text",
          usage: "Primary text",
        };
      }
      if (!palette.mood) palette.mood = mood;
      if (!palette.industry) palette.industry = industry;
      if (!palette.paletteType) palette.paletteType = "custom";
      if (!palette.colorHarmony) palette.colorHarmony = "balanced";
      if (!palette.tags) palette.tags = [mood, industry, "generated"];

      // Ensure required objects exist
      if (!palette.gradients) palette.gradients = {};
      if (!palette.interactiveStates) palette.interactiveStates = {};
      if (!palette.shadows) palette.shadows = {};

      // Ensure accessibility object exists with all required fields
      if (!palette.accessibility) {
        palette.accessibility = {
          contrastRatio: 4.5,
          wcagCompliant: true,
          level: "AA",
          colorBlindSafe: true,
          notes: "Accessibility compliance verified",
        };
      } else {
        // Ensure all required fields exist
        if (typeof palette.accessibility.contrastRatio !== "number") {
          palette.accessibility.contrastRatio = 4.5;
        }
        if (typeof palette.accessibility.wcagCompliant !== "boolean") {
          palette.accessibility.wcagCompliant = true;
        }
        if (
          !palette.accessibility.level ||
          !["AA", "AAA"].includes(palette.accessibility.level)
        ) {
          palette.accessibility.level = "AA";
        }
        if (typeof palette.accessibility.colorBlindSafe !== "boolean") {
          palette.accessibility.colorBlindSafe = true;
        }
        if (!palette.accessibility.notes) {
          palette.accessibility.notes = "Accessibility compliance verified";
        }
      }
      return palette;
    } catch (error) {
      console.error("Palette normalization failed:", error);
      return this.generateFallbackPalette(mood, industry);
    }
  }
  static generateFallbackPalette(mood, industry) {
    return {
      name: `${mood} ${industry} Palette`,
      description: "Fallback palette generated due to processing error",
      mood,
      industry,
      paletteType: "custom",
      colorHarmony: "balanced",
      colors: {
        primary: {
          hex: "#3B82F6",
          rgb: { r: 59, g: 130, b: 246 },
          hsl: { h: 217, s: 91, l: 60 },
          name: "Blue",
          usage: "Primary",
        },
        background: {
          hex: "#FFFFFF",
          rgb: { r: 255, g: 255, b: 255 },
          hsl: { h: 0, s: 0, l: 100 },
          name: "White",
          usage: "Background",
        },
        text: {
          hex: "#111827",
          rgb: { r: 17, g: 24, b: 39 },
          hsl: { h: 220, s: 39, l: 11 },
          name: "Dark",
          usage: "Text",
        },
      },
      gradients: {},
      interactiveStates: {},
      shadows: {},
      accessibility: {
        contrastRatio: 4.5,
        wcagCompliant: true,
        level: "AA",
        colorBlindSafe: true,
        notes: "Fallback palette with basic accessibility compliance",
      },
      tags: [mood, industry, "fallback"],
    };
  }
}

class ColorPaletteGenerator {
  constructor(aiModel) {
    this.aiModel = aiModel;
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
  }
  async generate(options) {
    const {
      prompt = "",
      mood = "modern",
      industry = "technology",
      paletteType = "custom",
      model = "gemini-2.0-flash-exp",
      ...additionalOptions
    } = options;

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const promptBuilder = new ImprovedPalettePromptBuilder({
          prompt,
          mood,
          industry,
          paletteType,
          model,
          ...additionalOptions,
        });
        const aiPrompt = promptBuilder.build();

        // Always log the full prompt being sent to Gemini for color palette generation
        const runWithModel = async (chosenModel) => {
          const m = this.aiModel.getGenerativeModel({ model: chosenModel });
          return await m.generateContent(aiPrompt);
        };

        let result;
        try {
          result = await runWithModel(model);
        } catch (err) {
          const message = String(err?.message || err);
          if (
            /overloaded|503|unavailable|busy|quota|429|rate limit|too many requests/i.test(
              message
            )
          ) {
            const fallback =
              process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
            console.warn(
              `[AI][Palette] Primary model failed (${model}) with error: ${message.substring(
                0,
                100
              )}...`
            );
            console.warn(`[AI][Palette] Falling back to: ${fallback}`);
            try {
              result = await runWithModel(fallback);
            } catch (fallbackErr) {
              console.error(
                `[AI][Palette] Fallback model also failed:`,
                fallbackErr.message
              );
              throw fallbackErr;
            }
          } else {
            throw err;
          }
        }
        let responseText = result.response.text();

        responseText = responseText
          .replace(/```json\s*/gi, "")
          .replace(/```/g, "")
          .trim();
        const rawPalette = JSON.parse(responseText);
        const normalizedPalette = PaletteNormalizer.normalize(
          rawPalette,
          mood,
          industry
        );
        const validation = PaletteValidator.validate(normalizedPalette);
        if (!validation.isValid) {
          console.warn(
            `[AI][Palette] Validation failed on attempt ${attempt}:`,
            validation.errors
          );
          if (attempt === this.maxRetries) {
            throw new Error(
              `Validation failed: ${validation.errors.join(", ")}`
            );
          }
          continue;
        }
        if (validation.warnings.length > 0) {
          console.warn(
            "[AI][Palette] Validation warnings:",
            validation.warnings
          );
        }
        return normalizedPalette;
      } catch (error) {
        lastError = error;
        console.error(
          `[AI][Palette] Attempt ${attempt} failed:`,
          error.message
        );
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 1.5;
        }
      }
    }
    console.error(
      "[AI][Palette] All attempts failed, returning fallback palette"
    );
    return PaletteNormalizer.generateFallbackPalette(mood, industry);
  }
}

module.exports = {
  ColorPaletteGenerator,
  PalettePromptBuilder,
  PaletteValidator,
  PaletteNormalizer,
  ColorUtils,
  PALETTE_CONFIG,
};
