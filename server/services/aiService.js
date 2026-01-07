const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const JSON5 = require("json5");
const { z } = require("zod");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback via REST in case SDK fetch fails (proxy/cert issues)
async function generateViaAxios(modelName, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ],
  };
  const resp = await axios.post(url, body, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });
  const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text };
}

// Generic JSON-call helper for Gemini (v1beta SDK payload shape)
async function callGeminiJSON(modelName, systemText, userText) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemText}\n\n${userText}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  const result = await model.generateContent(payload);
  const text = result?.response?.text?.() || "";
  try {
    return JSON.parse(text);
  } catch (e) {
    // If model returned code fences or stray text, try to clean
    const cleaned = String(text)
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned);
  }
}

async function callGeminiJSONWithRetry(
  primaryModel,
  systemText,
  userText,
  opts = {}
) {
  const {
    retries = 3,
    backoffMs = 2000,
    fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash",
  } = opts;
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await callGeminiJSON(primaryModel, systemText, userText);
    } catch (err) {
      lastError = err;
      const message = String(err?.message || err);
      const status = err?.status;
      const delay = backoffMs * Math.pow(2, attempt);
      // Retry on transient errors (503/overloaded/timeouts)
      if (
        /overloaded|503|unavailable|timeout|rate limit|busy/i.test(message) ||
        status === 503
      ) {
        const waitTime = attempt === retries - 1 ? delay : delay;
        console.warn(
          `[AI] Transient error (attempt ${
            attempt + 1
          }/${retries}). Retrying in ${waitTime}ms...`
        );
        await new Promise((r) => setTimeout(r, waitTime));
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

// Helper function to parse color schemes and handle custom combinations
const parseColorScheme = (colorScheme, colorSchemes) => {
  if (!colorScheme || typeof colorScheme !== "string") {
    return colorSchemes.blue;
  }

  const scheme = colorScheme.toLowerCase().trim();

  // Direct match
  if (colorSchemes[scheme]) {
    return colorSchemes[scheme];
  }

  // Handle combinations like "purple and pink", "blue and green", etc.
  if (scheme.includes("and") || scheme.includes("&") || scheme.includes(",")) {
    const colors = scheme
      .split(/[\s,&]+/)
      .map((c) => c.trim())
      .filter((c) => c);

    if (colors.length >= 2) {
      const primaryColor = colors[0];
      const secondaryColor = colors[1];

      // Create a custom combination
      if (colorSchemes[primaryColor] && colorSchemes[secondaryColor]) {
        return {
          primary: colorSchemes[primaryColor].primary,
          secondary: colorSchemes[secondaryColor].primary,
          accent: colorSchemes[primaryColor].accent,
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
    purple: colorSchemes.purple,
    pink: colorSchemes.pink,
    blue: colorSchemes.blue,
    green: colorSchemes.green,
    red: colorSchemes.red,
    orange: colorSchemes.orange,
    indigo: colorSchemes.indigo,
    teal: colorSchemes.teal,
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
    layoutType = "landing-page",
    style = "modern",
    industry = "technology",
    components = [],
    colorScheme = "blue",
    targetAudience = "general",
    customBrief = "",
    model = "gemini-2.5-flash", // 👈 Pass 'gemini-2.5-flash' or 'gemini-2.5-flash'
  } = options;

  // Model-specific tuning
  const depthFocus = model.includes("pro");

  const componentMap = {
    header:
      "Professional navigation bar with clean logo, organized menu items, and subtle call-to-action button",
    hero: "Executive-quality hero section with compelling headline, professional imagery, and clear value proposition",
    features:
      "Clean feature showcase with organized grid layout, professional icons, and concise descriptions",
    pricing:
      "Clean pricing comparison with organized tables, clear value propositions, and professional styling",
    testimonials:
      "Professional customer testimonials with credible presentation and clean typography",
    blog: "Executive blog preview with organized grid layout and professional content presentation",
    newsletter:
      "Professional newsletter signup with clean form design and clear value proposition",
    contact:
      "Business-grade contact section with organized information and professional form styling",
    footer:
      "Professional footer with organized navigation, company information, and clean social media integration",
    gallery:
      "Beautiful single-image carousel with 5-6 contextually relevant, high-quality images that perfectly match the website's industry and content. Display one image at a time with smooth transitions, elegant navigation arrows, dot indicators, and professional styling - clean, modern, and visually appealing",
    faq: "Professional FAQ section with clean accordion design and organized Q&A presentation",
    sidebar:
      "Clean sidebar with organized quick links and professional content presentation",
    socialMedia:
      "Professional social media integration with clean icons and subtle hover effects",
    productGrid: "Product/service cards with pricing and ratings",
    dashboardPreview: "Dashboard preview cards/tables (for apps)",
    ctaBanner: "Prominent call-to-action banner",
    onboardingSteps: "Step-by-step onboarding cards",
    stats: "Animated KPI counters",
    partners: "Partner/client logo showcase",
    team: "Team member grid with bios",
  };

  const styleGuidelines = {
    minimal:
      "Ultra-clean design with generous white space, crisp typography (Inter/Helvetica), subtle micro-interactions, precise alignment, and sophisticated use of negative space - think Apple/Stripe level simplicity",
    modern:
      "Professional typography (system fonts), refined color gradients, subtle rounded corners (8-12px), consistent spacing grid (8px base), elegant micro-animations, and premium visual hierarchy",
    vintage:
      "Elegant serif fonts (Georgia/Times), sophisticated muted palettes, refined decorative elements, classic grid systems, and timeless layout principles",
    corporate:
      "Executive-level professional design with structured layouts, conservative premium colors (#1a1a1a, #f8f9fa), formal yet approachable typography, and enterprise-grade visual consistency",
    creative:
      "Sophisticated artistic elements, carefully curated color palettes, innovative yet usable layouts, premium creative typography, and thoughtful experimental design patterns",
    professional:
      "Business-grade design with clean typography, consistent branding elements, professional color schemes, structured layouts, and executive presentation quality",
    playful:
      "Friendly yet professional design with subtle animations, approachable colors, rounded elements, and engaging but tasteful visual elements",
  };

  const industryContent = {
    technology: {
      heroTitle: "Revolutionary Tech Solutions",
      heroSubtitle: "Transform your business with cutting-edge technology",
      features: [
        "AI Integration",
        "Cloud Solutions",
        "Data Analytics",
        "Security",
      ],
      cta: "Get Started Free",
      imageKeywords:
        "technology, coding, software, digital, innovation, computer, data, cloud",
    },
    healthcare: {
      heroTitle: "Advanced Healthcare Solutions",
      heroSubtitle: "Improving patient care through innovative technology",
      features: [
        "Patient Management",
        "Telemedicine",
        "Data Security",
        "Compliance",
      ],
      cta: "Schedule Demo",
      imageKeywords:
        "healthcare, medical, doctor, hospital, health, medicine, patient, medical technology",
    },
    finance: {
      heroTitle: "Secure Financial Solutions",
      heroSubtitle: "Banking and financial services you can trust",
      features: [
        "Secure Banking",
        "Investment Tools",
        "Risk Management",
        "Compliance",
      ],
      cta: "Open Account",
      imageKeywords:
        "finance, banking, money, investment, financial, business, economy, trading",
    },
    ecommerce: {
      heroTitle: "Boost Your Online Sales",
      heroSubtitle: "Complete e-commerce solutions for modern businesses",
      features: [
        "Online Store",
        "Payment Processing",
        "Inventory Management",
        "Analytics",
      ],
      cta: "Start Selling",
      imageKeywords:
        "ecommerce, shopping, online store, retail, products, commerce, marketplace",
    },
    education: {
      heroTitle: "Transform Learning Experience",
      heroSubtitle: "Advanced educational platforms for modern learning",
      features: [
        "Interactive Courses",
        "Progress Tracking",
        "Certification",
        "Community",
      ],
      cta: "Start Learning",
      imageKeywords:
        "education, learning, students, school, university, online learning, study, knowledge",
    },
    realestate: {
      heroTitle: "Find Your Dream Property",
      heroSubtitle: "Premium real estate solutions for buyers and sellers",
      features: [
        "Property Search",
        "Virtual Tours",
        "Market Analysis",
        "Expert Agents",
      ],
      cta: "Browse Properties",
      imageKeywords:
        "real estate, house, property, home, architecture, building, real estate agent",
    },
    food: {
      heroTitle: "Delicious Food Delivered",
      heroSubtitle:
        "Fresh ingredients, amazing flavors, delivered to your door",
      features: [
        "Fresh Ingredients",
        "Fast Delivery",
        "Custom Orders",
        "Quality Guarantee",
      ],
      cta: "Order Now",
      imageKeywords:
        "food, restaurant, cooking, chef, delicious, meal, cuisine, dining",
    },
    travel: {
      heroTitle: "Explore the World",
      heroSubtitle:
        "Discover amazing destinations and create unforgettable memories",
      features: [
        "Best Deals",
        "Expert Guides",
        "24/7 Support",
        "Flexible Booking",
      ],
      cta: "Book Now",
      imageKeywords:
        "travel, vacation, destination, tourism, adventure, journey, world, explore",
    },
  };

  const colorSchemes = {
    blue: { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" },
    green: { primary: "#10B981", secondary: "#047857", accent: "#34D399" },
    purple: { primary: "#8B5CF6", secondary: "#7C3AED", accent: "#A78BFA" },
    red: { primary: "#EF4444", secondary: "#DC2626", accent: "#F87171" },
    orange: { primary: "#F59E0B", secondary: "#D97706", accent: "#FBBF24" },
    pink: { primary: "#EC4899", secondary: "#BE185D", accent: "#F472B6" },
    indigo: { primary: "#6366F1", secondary: "#4338CA", accent: "#818CF8" },
    teal: { primary: "#14B8A6", secondary: "#0F766E", accent: "#5EEAD4" },
  };

  // Parse custom color schemes and handle combinations
  const colors = parseColorScheme(colorScheme, colorSchemes);
  const industryData = industryContent[industry] || industryContent.technology;
  const styleGuide = styleGuidelines[style] || styleGuidelines.modern;

  const selectedComponents =
    components.length > 0
      ? components
      : ["header", "hero", "features", "footer"];
  const componentDescriptions = selectedComponents
    .map((c) => componentMap[c])
    .filter(Boolean);

  // Build prompt dynamically based on model
  const prompt = `
You are a world-class frontend engineer & UX/UI designer. 
Your task is to generate a ${
    depthFocus ? "highly detailed, production-ready" : "clean and lightweight"
  } HTML5 layout.

RESPONSE RULES:
1. Return ONLY valid HTML5. No Markdown, JSON, comments, or explanations.
2. Start with <!DOCTYPE html> and end with </html>.
3. Include a complete <head> section with meta tags, title, and embedded CSS.
4. Inline ALL CSS in <style> tags within the <head> section.
5. Inline ALL JS in <script> tags before </body>.
6. Mobile-first responsive design with breakpoints at 640px, 768px, 1024px, and 1280px.
7. Use CSS variables in :root for colors, typography, spacing, shadows.
8. ${
    depthFocus
      ? "Include advanced ARIA roles, WCAG compliance, and semantic structure"
      : "Keep it simple but correct and semantic"
  }.
9. ${
    depthFocus
      ? "Add IntersectionObserver animations, lazy loading, SEO meta tags, Open Graph"
      : "Focus on speed and clean code"
  }.
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
- Primary: ${colors.primary} | Secondary: ${colors.secondary} | Accent: ${
    colors.accent
  }
- Industry: ${industry} | Target Audience: ${targetAudience}
- Color Preference: ${colorScheme} (use these colors as the foundation for the design)

COMPONENTS:
${componentDescriptions.map((c) => `- ${c}`).join("\n")}

COMPONENT IMAGE REQUIREMENTS:
- Header: Use a logo or brand image (SVG or PNG) - ONLY in header content area
- Hero: Use a high-quality background image or hero image (1200x800px minimum) - ONLY in hero section
- Features: Use relevant icons or images for each feature (400x300px) - ONLY in features section, ONE IMAGE PER FEATURE CARD MAXIMUM
- Pricing: Use checkmark icons or pricing-related images - ONLY in pricing section
- Testimonials: Use professional headshot images (200x200px, circular) - ONLY in testimonials section
- Blog: Use featured image for blog posts (600x400px) - ONLY in blog section
- Newsletter: Use newsletter or email-related images - ONLY in newsletter section
- Contact: Use contact form or communication images - ONLY in contact section
- Footer: NO IMAGES ALLOWED - Footer should only contain text, links, and social media icons (SVG)
- Gallery: Create beautiful single-image carousel with exactly 5-6 contextually relevant images (1200x800px each) that perfectly match the website's industry/content. Display ONE image at a time with smooth CSS transitions, elegant navigation arrows (left/right), dot pagination indicators, and professional carousel styling. Images must be thematically consistent and relevant to the site content - ONLY in gallery section
- FAQ: Use question mark or help icons - ONLY in FAQ section
- Sidebar: Use relevant sidebar images or icons - ONLY in sidebar section
- Social Media: Use social media platform icons (SVG) - ONLY in appropriate sections
- Product Grid: Use product images with consistent dimensions - ONLY in product grid section

CRITICAL IMAGE RESTRICTIONS:
- NEVER place multiple images in a single feature card or text content area
- NEVER use random people photos that don't match the content context
- NEVER place images inside paragraph text or between text elements
- Each feature card should have EXACTLY ONE relevant image that matches its heading and description
- Images must be contextually relevant to the specific content they accompany
- NO placeholder or stock people photos unless specifically requested for testimonials
- Verify each image ID corresponds to appropriate content before use
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

HTML STRUCTURE REQUIREMENTS:
- Each feature card must follow this EXACT structure: <div class="feature-card"> <img.../> <h3>Title</h3> <p>Description</p> </div>
- NEVER place additional images after the description paragraph
- NEVER place multiple images in the same content container
- Images must be the FIRST element inside their container, followed by text content
- Verify each image placement serves a specific structural purpose
- Review final HTML for any orphaned or misplaced image tags

CONTENT:
- Hero Title: ${industryData.heroTitle}
- Hero Subtitle: ${industryData.heroSubtitle}
- Features: ${industryData.features.join(", ")}
- CTA Button: ${industryData.cta}
- Image Keywords: ${
    industryData.imageKeywords
  } (use these keywords to find relevant images)

COLOR USAGE:
- CRITICAL: Use the specified color scheme (${colorScheme}) throughout the design
- Primary color (${colors.primary}) for main elements, headers, and CTAs
- Secondary color (${colors.secondary}) for supporting elements and backgrounds
- Accent color (${
    colors.accent
  }) for highlights, buttons, and interactive elements
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
  * Gallery: CLEAN SINGLE-IMAGE CAROUSEL with exactly 5-6 contextually relevant images (1200x800px) that perfectly match the website's content/industry. Display ONE image at a time with smooth transitions, elegant left/right navigation arrows, dot pagination, and beautiful professional styling
  * Products: Clear product photos with consistent styling

${customBrief ? `CUSTOM BRIEF: ${customBrief}` : ""}

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

PROFESSIONAL DESIGN PRINCIPLES:
- Use 8px spacing grid system for perfect alignment: margin/padding in multiples of 8px (8px, 16px, 24px, 32px, 48px, 64px)
- Professional typography scale: 12px, 14px, 16px, 18px, 24px, 32px, 48px, 64px
- Consistent color system: max 3-4 main colors with proper contrast ratios (4.5:1 minimum)
- Use professional fonts: Inter, System UI, Helvetica Neue, Arial for sans-serif; Georgia, Times New Roman for serif
- Apply subtle shadows for depth: box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
- Use consistent border radius: 4px for small elements, 8px for cards, 12px for large containers

CSS LAYOUT GUIDELINES:
- Professional CSS Grid layouts: display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px;
- Clean Flexbox alignment: display: flex; align-items: center; justify-content: space-between; gap: 16px;
- Prevent text overflow professionally: word-wrap: break-word; overflow-wrap: break-word; line-height: 1.6;
- Perfect text alignment: text-align: left/center; line-height: 1.5; letter-spacing: -0.01em;
- Consistent professional spacing: margin: 0; padding: 16px 24px; gap: 24px;
- Professional typography: font-weight: 400|500|600; font-size: clamp(16px, 2vw, 18px);
- Optimal container widths: max-width: 1200px; margin: 0 auto; padding: 0 24px;
- Professional responsive breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)

GALLERY/CAROUSEL PROFESSIONAL REQUIREMENTS (when gallery component is requested):
- Create beautiful single-image carousel that displays ONE image at a time (not masonry/grid)
- Use exactly 5-6 contextually relevant images (1200x800px) that match the website's industry/content theme
- Implement smooth CSS transitions: transition: all 0.3s ease-in-out;
- Add elegant navigation arrows: left/right arrows with subtle hover effects and smooth transitions
- Include dot pagination indicators: clean circles that show current position with active state styling
- Apply professional carousel container: centered layout with proper spacing and subtle shadows
- Use CSS-only carousel functionality with smooth slide animations (translateX transforms)
- Images should fill the container beautifully: object-fit: cover; border-radius: 12px;
- Add fade or slide transitions between images for smooth visual flow
- Ensure all images are thematically consistent and relevant to the site's purpose/industry
- Mobile-responsive with touch-friendly navigation and swipe support
- Professional loading states and elegant fallback handling

DELIVERABLE:
A single standalone HTML5 file that runs immediately in a browser with all images rendering correctly and proper, professional code quality.`;

  return prompt;
};

// Enhanced function to generate layout with AI using the new prompt builder
const generateLayoutWithAI = async ({
  prompt,
  layoutType,
  style,
  userPreferences,
  componentsRequired = [],
  colorScheme = "",
  industry = "",
  targetAudience = "",
  model = "gemini-2.5-flash",
}) => {
  try {
    // Validate required parameters
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!layoutType) {
      throw new Error("Layout type is required");
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
      model,
    });

    const shouldDebug = true; // Always log/return prompt to aid debugging
    let promptDebugPreview;
    if (shouldDebug) {
      promptDebugPreview =
        aiPrompt.length > 4000
          ? `${aiPrompt.slice(0, 4000)}... [truncated]`
          : aiPrompt;
    }

    const runWithModel = async (chosenModel) => {
      const geminiModel = genAI.getGenerativeModel({ model: chosenModel });
      try {
        return await geminiModel.generateContent(aiPrompt);
      } catch (sdkErr) {
        const msg = String(sdkErr?.message || sdkErr);
        const status = sdkErr?.status || sdkErr?.cause?.status;
        const causeCode = sdkErr?.cause?.code || sdkErr?.code;
        console.warn(
          "[AI][Layout] SDK call failed:",
          msg,
          status ? `(status: ${status})` : "",
          causeCode ? `(code: ${causeCode})` : ""
        );

        // Detect leaked / revoked API key scenario (403 with specific message)
        if (
          /reported as leaked/i.test(msg) ||
          (status === 403 && /Forbidden/i.test(msg))
        ) {
          console.error(
            "[AI][Layout] Gemini API key appears leaked or revoked. Returning safe fallback layout."
          );
          return { leakError: true, leakMessage: msg };
        }

        // Network/proxy/cert issues: try REST fallback via axios
        if (
          /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|CERT|SSL|self[- ]signed/i.test(
            msg
          ) ||
          /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|CERT|SSL|self[- ]signed/i.test(
            String(causeCode)
          )
        ) {
          console.warn("[AI][Layout] Trying REST fallback via axios");
          const rest = await generateViaAxios(chosenModel, aiPrompt);
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
        const fallback =
          process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
        console.warn(
          `[AI][Layout] Primary model failed (${model}). Falling back to: ${fallback}`
        );
        result = await runWithModel(fallback);
      } else {
        throw err;
      }
    }

    // Handle leaked key fallback early
    if (result?.leakError) {
      const fallbackHTML = generateFallbackHTML(
        layoutType,
        style,
        industry,
        componentsRequired
      );
      return {
        success: true,
        htmlCode: fallbackHTML,
        cssCode: "",
        components: componentsRequired,
        layoutType,
        style,
        industry,
        colorScheme,
        title: `${industry} ${layoutType} - ${style} design (Fallback)`,
        description:
          "AI temporarily unavailable due to leaked / revoked Gemini API key. Please rotate GEMINI_API_KEY and restart the server.",
        aiModel: "fallback-local",
        isFallback: true,
        error: "gemini_api_key_leaked",
        leakMessage: result.leakMessage,
        promptDebug: promptDebugPreview,
      };
    }

    if (!result || !result.response) {
      throw new Error("No response received from AI model");
    }

    let responseText = result.response.text();

    // Log the raw Gemini response for debugging
    console.log("\uD83D\uDCAC [Gemini RAW RESPONSE]:\n", responseText);
    // Attach the raw response to return to the route (for frontend display)
    let rawGeminiResponse = responseText;

    if (!responseText || responseText.trim().length === 0) {
      throw new Error("Empty response received from AI model");
    }

    // Clean up the response more thoroughly
    responseText = responseText
      .replace(/```html\s*/gi, "")
      .replace(/```\s*/g, "")
      .replace(/^```html$/gm, "")
      .replace(/^```$/gm, "")
      .replace(/^```json$/gm, "")
      .replace(/^```css$/gm, "")
      .replace(/^```javascript$/gm, "")
      .replace(/^```js$/gm, "")
      .trim();

    // Validate and normalize the response
    const validationResult = validateAndNormalizeLayoutResponse(responseText, {
      layoutType,
      style,
      industry,
      componentsRequired,
    });

    if (!validationResult.isValid) {
      console.warn(
        "⚠️ [AI Response Validation Failed]:",
        validationResult.errors
      );
      console.log("📄 [Using Fallback Response Structure]");
    }

    // Use validated/normalized response or fallback
    responseText = validationResult.htmlCode;

    // Check if response is JSON and extract HTML
    if (responseText.startsWith("{") && responseText.includes('"html"')) {
      try {
        const parsed = JSON.parse(responseText);
        // Log the parsed JSON for debugging
        console.log("\uD83D\uDCC4 [Gemini PARSED JSON]:\n", parsed);
        if (parsed.html) {
          responseText = parsed.html;
        }
      } catch (error) {
        // Failed to parse JSON, treating as raw HTML
      }
    }

    // Extract HTML content
    const htmlStart = responseText.indexOf("<!DOCTYPE html>");
    const htmlEnd = responseText.lastIndexOf("</html>") + 7;

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
        const cleanedHead = headContent.replace(/<img[^>]*>/gi, "");
        responseText = responseText.replace(
          headMatch[0],
          `<head>${cleanedHead}</head>`
        );
      }
    }

    responseText = responseText
      // Fix malformed image tags
      .replace(
        /<img([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<img$1$2>"
      )
      .replace(
        /<img([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<img$1$2>"
      )
      .replace(
        /<img([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi,
        "<img$1$2>"
      )
      // Fix malformed SVG paths
      .replace(
        /<path([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<path$1$2>"
      )
      .replace(
        /<path([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<path$1$2>"
      )
      .replace(
        /<path([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi,
        "<path$1$2>"
      )
      // Fix broken style attributes
      .replace(/style="[^"]*?word-wrap:\s*break-word[^"]*?"/gi, "")
      .replace(/style="[^"]*?overflow-wrap:\s*break-word[^"]*?"/gi, "")
      .replace(/style="[^"]*?hyphens:\s*none[^"]*?"/gi, "")
      // Fix malformed closing tags
      .replace(
        /<([^>]+?)\s*style="[^"]*?word-wrap:\s*break-word[^"]*?"\s*>/gi,
        "<$1>"
      )
      .replace(
        /<([^>]+?)\s*style="[^"]*?overflow-wrap:\s*break-word[^"]*?"\s*>/gi,
        "<$1>"
      )
      .replace(/<([^>]+?)\s*style="[^"]*?hyphens:\s*none[^"]*?"\s*>/gi, "<$1>")
      // Fix broken CSS
      .replace(/style="[^"]*?;\s*word-wrap:\s*break-word[^"]*?"/gi, "")
      .replace(/style="[^"]*?;\s*overflow-wrap:\s*break-word[^"]*?"/gi, "")
      .replace(/style="[^"]*?;\s*hyphens:\s*none[^"]*?"/gi, "")
      // Remove empty style attributes
      .replace(/style="\s*"/gi, "")
      .replace(/style='\s*'/gi, "")
      // Fix specific issues from the user's response
      .replace(
        /<img([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<img$1$2>"
      )
      .replace(
        /<img([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<img$1$2>"
      )
      .replace(
        /<img([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi,
        "<img$1$2>"
      )
      // Fix broken SVG elements
      .replace(
        /<svg([^>]*?)style="[^"]*?word-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<svg$1$2>"
      )
      .replace(
        /<svg([^>]*?)style="[^"]*?overflow-wrap:\s*break-word[^"]*?"([^>]*?)>/gi,
        "<svg$1$2>"
      )
      .replace(
        /<svg([^>]*?)style="[^"]*?hyphens:\s*none[^"]*?"([^>]*?)>/gi,
        "<svg$1$2>"
      )
      // Fix broken closing tags with style attributes
      .replace(
        /<([^>]+?)\s*style="[^"]*?word-wrap:\s*break-word[^"]*?"\s*>/gi,
        "<$1>"
      )
      .replace(
        /<([^>]+?)\s*style="[^"]*?overflow-wrap:\s*break-word[^"]*?"\s*>/gi,
        "<$1>"
      )
      .replace(/<([^>]+?)\s*style="[^"]*?hyphens:\s*none[^"]*?"\s*>/gi, "<$1>")
      // Fix broken CSS selectors
      .replace(/style="[^"]*?;\s*word-wrap:\s*break-word[^"]*?"/gi, "")
      .replace(/style="[^"]*?;\s*overflow-wrap:\s*break-word[^"]*?"/gi, "")
      .replace(/style="[^"]*?;\s*hyphens:\s*none[^"]*?"/gi, "")
      // Remove empty style attributes
      .replace(/style="\s*"/gi, "")
      .replace(/style='\s*'/gi, "");

    // Validate final HTML output and ensure complete structure
    if (!responseText.includes("<!DOCTYPE html>")) {
      responseText = `<!DOCTYPE html>\n${responseText}`;
    }

    if (!responseText.includes("<html")) {
      responseText =
        responseText.replace(
          "<!DOCTYPE html>",
          '<!DOCTYPE html>\n<html lang="en">'
        ) + "\n</html>";
    }

    if (!responseText.includes("<head>")) {
      responseText = responseText.replace(
        '<html lang="en">',
        '<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Generated Layout</title>\n</head>'
      );
    }

    if (!responseText.includes("<body>")) {
      responseText =
        responseText.replace("</head>", "</head>\n<body>") + "\n</body>";
    }

    // Add basic CSS if no styles are present
    if (!responseText.includes("<style>")) {
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
      responseText = responseText.replace("</head>", basicCSS + "\n</head>");
    }

    // Fix image issues - ensure all images have proper URLs and attributes
    const workingImageUrls = [
      "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Technology/Generic
      "https://images.pexels.com/photos/3772510/pexels-photo-3772510.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Business/Office
      "https://images.pexels.com/photos/769749/pexels-photo-769749.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Nature/Clean
      "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Abstract/Clean
      "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Professional/Clean
      "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Modern/Clean
      "https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Business/Professional
      // REMOVED: "https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // PROBLEMATIC MAN IMAGE
      "https://images.pexels.com/photos/1043472/pexels-photo-1043472.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Abstract/Background
      "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Clean/Professional
      "https://images.pexels.com/photos/1043470/pexels-photo-1043470.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Modern/Abstract
      "https://images.pexels.com/photos/1043469/pexels-photo-1043469.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Professional/Background
      "https://images.pexels.com/photos/1043468/pexels-photo-1043468.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Clean/Modern
      "https://images.pexels.com/photos/1043467/pexels-photo-1043467.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Abstract/Professional
      "https://images.pexels.com/photos/1043466/pexels-photo-1043466.jpeg?w=1200&h=800&fit=crop&auto=format&q=90", // Background/Clean
    ];

    // Replace placeholder text with working images
    responseText = responseText.replace(/placeholder[^>]*>/gi, ">");
    responseText = responseText.replace(/Image placeholder/gi, "");
    responseText = responseText.replace(/Product image/gi, "");
    responseText = responseText.replace(/A person wearing/gi, "");
    responseText = responseText.replace(/Colorful Y2K fashion/gi, "");
    responseText = responseText.replace(/Someone in functional/gi, "");
    responseText = responseText.replace(/Close-up of trendy/gi, "");
    responseText = responseText.replace(/Fashionable woman/gi, "");
    responseText = responseText.replace(/Stylish young person/gi, "");

    // Fix broken image tags and ensure all images have working URLs - ONLY replace truly broken images
    let imageIndex = 0;
    responseText = responseText.replace(
      /<img([^>]*)>/gi,
      (match, attributes) => {
        // Check if this image is in the head section - if so, remove it entirely
        const beforeMatch = responseText.substring(
          0,
          responseText.indexOf(match)
        );
        const headEnd = beforeMatch.lastIndexOf("</head>");
        const headStart = beforeMatch.lastIndexOf("<head");

        if (headStart !== -1 && headEnd !== -1 && headStart < headEnd) {
          return ""; // Remove the image entirely
        }

        // ONLY replace images that are genuinely broken or have invalid src attributes
        // Do NOT replace images with valid pexels URLs
        const hasSrc = attributes.includes("src=");
        const hasValidPexelsUrl = attributes.includes("images.pexels.com");
        const hasPlaceholder = attributes.includes("placeholder");
        const hasBrokenSrc =
          attributes.includes("broken") ||
          attributes.includes("data:") ||
          attributes.includes("blob:");

        // If image has valid pexels URL, keep it as-is
        if (hasSrc && hasValidPexelsUrl && !hasPlaceholder && !hasBrokenSrc) {
          imageIndex++;
          return match; // Keep the original image unchanged
        }

        // Only replace if truly broken or missing src
        if (!hasSrc || hasPlaceholder || hasBrokenSrc) {
          const workingUrl =
            workingImageUrls[imageIndex % workingImageUrls.length];
          const altText = attributes.includes("alt=")
            ? ""
            : ' alt="Product image"';
          const widthHeight = attributes.includes("width=")
            ? ""
            : ' width="1200" height="800"';
          const loading = attributes.includes("loading=")
            ? ""
            : ' loading="lazy"';
          const onerror = attributes.includes("onerror=")
            ? ""
            : " onerror=\"this.style.display='none'; this.style.backgroundColor='#f3f4f6'; this.style.border='2px dashed #d1d5db'; this.innerHTML='<div style=\\\"display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:14px\\\">Image not available</div>';\"";

          // Clean up the attributes to remove broken src
          const cleanAttributes = attributes
            .replace(/src\s*=\s*["'][^"']*["']/gi, "")
            .replace(/placeholder/gi, "")
            .replace(/broken/gi, "");

          return `<img src="${workingUrl}"${altText}${widthHeight}${loading}${onerror}${cleanAttributes}>`;
        }
        imageIndex++;
        return match;
      }
    );

    // Also fix any divs or other elements that might contain placeholder text for images
    responseText = responseText.replace(
      /<div[^>]*class="[^"]*placeholder[^"]*"[^>]*>.*?<\/div>/gi,
      (match) => {
        const workingUrl =
          workingImageUrls[imageIndex % workingImageUrls.length];
        imageIndex++;
        return `<img src="${workingUrl}" alt="Product image" width="1200" height="800" loading="lazy" onerror="this.style.display='none'; this.style.backgroundColor='#f3f4f6'; this.style.border='2px dashed #d1d5db'; this.innerHTML='<div style=\\"display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:14px\\">Image not available</div>';">`;
      }
    );

    // Final cleanup - replace any remaining text that looks like image descriptions
    responseText = responseText.replace(
      /<[^>]*>([^<]*?(?:wearing|fashion|clothing|outfit|style|trendy|colorful|person|woman|man|young|close-up|someone|stylish)[^<]*?)<\/[^>]*>/gi,
      (match, text) => {
        // If this looks like a description that should be an image, replace with an image
        if (text.length > 10 && text.length < 100) {
          const workingUrl =
            workingImageUrls[imageIndex % workingImageUrls.length];
          imageIndex++;
          return `<img src="${workingUrl}" alt="${text.trim()}" width="1200" height="800" loading="lazy" onerror="this.style.display='none'">`;
        }
        return match;
      }
    );

    // Fix JavaScript syntax errors and common issues
    responseText = responseText.replace(
      /<script[^>]*>([\s\S]*?)<\/script>/gi,
      (match, scriptContent) => {
        // Clean up common JavaScript syntax issues
        let cleanedScript = scriptContent
          .replace(/console\.log\([^)]*\);/gi, "") // Remove console.log statements
          .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
          .replace(/\/\/.*$/gm, "") // Remove line comments
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();

        // Only return the script if it has valid content
        if (cleanedScript && cleanedScript.length > 10) {
          return `<script>${cleanedScript}</script>`;
        }
        return ""; // Remove empty or invalid scripts
      }
    );

    // Fix common layout and typography issues
    responseText = responseText.replace(/style="[^"]*"/gi, (match) => {
      // Add word-wrap and overflow-wrap to existing styles
      if (!match.includes("word-wrap") && !match.includes("overflow-wrap")) {
        return match.replace(
          '"',
          '; word-wrap: break-word; overflow-wrap: break-word; hyphens: none;"'
        );
      }
      return match;
    });

    // Fix awkward text wrapping and hyphenation
    responseText = responseText.replace(
      /<p([^>]*)>/gi,
      '<p$1 style="word-wrap: break-word; overflow-wrap: break-word; hyphens: none;">'
    );
    responseText = responseText.replace(
      /<div([^>]*)>/gi,
      '<div$1 style="word-wrap: break-word; overflow-wrap: break-word;">'
    );

    // Ensure proper responsive text sizing
    responseText = responseText.replace(
      /font-size:\s*(\d+)px/gi,
      "font-size: clamp($1px, 2.5vw, $1px)"
    );

    // Fix column layouts to be more balanced
    responseText = responseText.replace(
      /column-count:\s*2/gi,
      "column-count: 2; column-fill: balance; column-gap: 2rem;"
    );

    if (!responseText.includes("</html>")) {
      responseText = `${responseText}\n</html>`;
    }

    // FINAL CLEANUP: Remove any images that might have been added to inappropriate sections

    // Remove images from head section
    const finalHeadMatch = responseText.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (finalHeadMatch) {
      const finalHeadContent = finalHeadMatch[1];
      const finalImgInHead = finalHeadContent.match(/<img[^>]*>/gi);
      if (finalImgInHead) {
        const finalCleanedHead = finalHeadContent.replace(/<img[^>]*>/gi, "");
        responseText = responseText.replace(
          finalHeadMatch[0],
          `<head>${finalCleanedHead}</head>`
        );
      }
    }

    // Remove images from footer section and replace with appropriate SVG icons
    const footerMatch = responseText.match(
      /<footer[^>]*>([\s\S]*?)<\/footer>/gi
    );
    if (footerMatch) {
      footerMatch.forEach((footer, index) => {
        const imgInFooter = footer.match(/<img[^>]*>/gi);
        if (imgInFooter) {
          // Replace images with appropriate SVG social media icons
          let cleanedFooter = footer.replace(/<img[^>]*>/gi, (imgTag) => {
            // Check if it's a social media icon by looking at alt text or src
            if (
              imgTag.includes("social") ||
              imgTag.includes("instagram") ||
              imgTag.includes("twitter") ||
              imgTag.includes("facebook") ||
              imgTag.includes("youtube")
            ) {
              return '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12h8M12 8v8"/></svg>';
            }
            return ""; // Remove other images
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
          const cleanedNav = nav.replace(/<img[^>]*>/gi, "");
          responseText = responseText.replace(nav, cleanedNav);
        }
      });
    }

    // Log the normalized components before returning
    console.log(
      "\uD83D\uDEE0 [Normalized components to save]:\n",
      componentsRequired
    );

    const finalResponse = {
      success: true,
      htmlCode: responseText,
      cssCode: "", // CSS is embedded in HTML
      components: componentsRequired,
      layoutType,
      style,
      industry,
      colorScheme,
      title: `${industry} ${layoutType} - ${style} design`,
      description: `AI-generated ${layoutType} layout with ${style} design for ${industry} industry`,
      rawGeminiResponse,
      validationWarnings: validationResult.errors || null,
      isFallback: !validationResult.isValid,
    };

    if (shouldDebug && promptDebugPreview) {
      finalResponse.promptDebug = promptDebugPreview;
    }

    return finalResponse;
  } catch (error) {
    console.error("❌ Layout generation error:", error);
    // Attach prompt for upstream handlers to return to client
    try {
      if (!error.promptDebug && typeof aiPrompt === "string") {
        const preview =
          aiPrompt.length > 4000
            ? `${aiPrompt.slice(0, 4000)}... [truncated]`
            : aiPrompt;
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
    components: options.componentsRequired || [
      "header",
      "hero",
      "features",
      "footer",
    ],
    layoutType: options.layoutType || "landing-page",
    style: options.style || "modern",
    industry: options.industry || "technology",
  };
};

const generateHTMLCSS = async (layoutData, options) => {
  // Use the new universal generation
  return await generateLayoutWithAI(options);
};

// Advanced Color Palette Generator with gradients/semantic colors
const buildColorPalettePrompt = (options = {}) => {
  const {
    mood = "modern",
    industry = "technology",
    paletteType = "custom",
    prompt = "",
    model = "gemini-2.5-flash",
    includeGradients = true,
    includeTextureColors = false,
    semanticColors = true,
    colorHarmony = "balanced",
    accessibilityLevel = "AA",
  } = options;

  const depthFocus = model.includes("pro");

  const moodGuidelines = {
    modern: "Clean, contemporary colors with high contrast and bold accents",
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
  };

  const industryContext = {
    technology: "Tech companies, startups, software, digital products",
    healthcare: "Medical, wellness, pharmaceutical, healthcare services",
    finance: "Banking, investment, insurance, financial services",
    ecommerce: "Online retail, shopping, marketplace, consumer goods",
    education: "Schools, universities, online learning, educational content",
    realestate: "Property, housing, real estate, construction",
    food: "Restaurants, food delivery, culinary, hospitality",
    travel: "Tourism, hospitality, travel booking, adventure",
    fashion: "Clothing, beauty, lifestyle, luxury brands",
    entertainment: "Media, gaming, music, entertainment content",
    fitness: "Gyms, sports, wellness, health tracking apps",
    cryptocurrency: "Blockchain, digital currency, fintech, trading",
    sustainability: "Green energy, eco-friendly, environmental",
    automotive: "Cars, transportation, mobility, racing",
  };

  const paletteTypes = {
    monochromatic: "Single hue with various shades and tints",
    analogous: "Adjacent colors on the color wheel",
    complementary: "Opposite colors on the color wheel",
    triadic: "Three evenly spaced colors on the color wheel",
    tetradic: "Four colors forming a rectangle on the color wheel",
    splitComplementary: "Base color plus two colors adjacent to its complement",
    square: "Four colors evenly spaced around the color wheel",
    custom: "Custom color combination based on specific requirements",
    gradient: "Colors designed specifically for smooth gradient transitions",
  };

  const colorHarmonyTypes = {
    balanced: "Equal visual weight across all colors",
    dominant: "One primary color dominates with supporting colors",
    contrasting: "High contrast between light and dark elements",
    subtle: "Low contrast with gentle color transitions",
    dynamic: "Varying intensities creating visual rhythm",
  };

  const moodGuide = moodGuidelines[mood] || moodGuidelines.modern;
  const industryDesc = industryContext[industry] || industryContext.technology;
  const paletteDesc = paletteTypes[paletteType] || paletteTypes.custom;
  const harmonyDesc =
    colorHarmonyTypes[colorHarmony] || colorHarmonyTypes.balanced;

  const gradientFeatures = includeGradients
    ? `
GRADIENT REQUIREMENTS:
- Create 3-5 gradient combinations using palette colors
- Include linear, radial, and conic gradient variations
- Provide CSS gradient syntax ready for implementation
- Ensure smooth color transitions without muddy middle tones
- Include gradient overlays for text readability`
    : "";

  const textureFeatures = includeTextureColors
    ? `
TEXTURE COLOR FEATURES:
- Provide shadow and highlight variations for depth
- Include noise/texture overlay colors
- Create color variations for different material surfaces
- Provide glass morphism color variations`
    : "";

  const semanticFeatures = semanticColors
    ? `
SEMANTIC COLORS:
- Success, warning, error, and info state colors
- Interactive state colors (hover, active, disabled)
- Loading and progress indicator colors
- Notification and badge colors`
    : "";

  const aiPrompt = `
You are a world-class color theory expert, UI/UX designer, and digital artist specializing in advanced color systems.
Generate a ${mood} color palette for ${industryDesc} applications with modern web design features.

RESPONSE RULES:
1. Return ONLY valid JSON. No markdown, explanations, or code blocks.
2. Include exactly 8-12 colors with proper naming and relationships.
3. Ensure accessibility compliance with WCAG ${accessibilityLevel} standards.
4. ${
    depthFocus
      ? "Include detailed color psychology, usage guidelines, and design system recommendations"
      : "Keep it practical with essential usage notes"
  }.
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

${prompt ? `CUSTOM REQUIREMENTS: ${prompt}` : ""}

CRITICAL VALIDATION RULES:
1. "mood" field MUST be EXACTLY one of: "calm", "energetic", "professional", "playful", "elegant", "bold", "minimal", "warm", "cool"
2. "industry" field MUST be EXACTLY one of: "technology", "healthcare", "finance", "education", "retail", "food", "travel", "fashion", "entertainment", "other"
3. "paletteType" field MUST be EXACTLY one of: "monochromatic", "analogous", "complementary", "triadic", "tetradic", "split-complementary", "custom"
4. Do NOT combine values, add commas, or create custom text for these fields.

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
    "contrastRatio": ${accessibilityLevel === "AAA" ? 7.0 : 4.5},
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
  const {
    includeDark = true,
    includeHighContrast = false,
    includeSepia = false,
  } = options;
  return `
Create theme variations for the base palette:
${
  includeDark
    ? "- Dark mode: Invert luminosity while maintaining color relationships"
    : ""
}
${
  includeHighContrast
    ? "- High contrast: Maximum accessibility with bold color differences"
    : ""
}
${
  includeSepia
    ? "- Sepia mode: Warm, vintage-inspired monochromatic variation"
    : ""
}

Each theme should maintain:
1. Brand recognition through color relationships
2. Accessibility standards
3. Gradient compatibility
4. Semantic color meanings
`;
};

const { ColorPaletteGenerator } = require("./paletteService");

// Map mood input to valid enum values
const mapMoodToEnum = (mood) => {
  const validMoods = [
    "calm",
    "energetic",
    "professional",
    "playful",
    "elegant",
    "bold",
    "minimal",
    "warm",
    "cool",
  ];

  if (!mood) return "professional";

  const normalized = mood.toLowerCase().trim();

  // Direct match
  if (validMoods.includes(normalized)) return normalized;

  // Mapping for common variations
  const moodMap = {
    modern: "professional",
    minimalist: "minimal",
    minimalistic: "minimal",
    simple: "minimal",
    clean: "minimal",
    vibrant: "energetic",
    dynamic: "energetic",
    active: "energetic",
    sophisticated: "elegant",
    refined: "elegant",
    luxury: "elegant",
    fun: "playful",
    creative: "playful",
    exciting: "energetic",
    serious: "professional",
    business: "professional",
    corporate: "professional",
    relaxed: "calm",
    peaceful: "calm",
    soothing: "calm",
    cozy: "warm",
    inviting: "warm",
    fresh: "cool",
    crisp: "cool",
  };

  // Check if any keyword matches
  for (const [key, value] of Object.entries(moodMap)) {
    if (normalized.includes(key)) return value;
  }

  // Default fallback
  return "professional";
};

// Map paletteType input to valid enum values
const mapPaletteTypeToEnum = (paletteType) => {
  const validTypes = [
    "monochromatic",
    "analogous",
    "complementary",
    "triadic",
    "tetradic",
    "split-complementary",
    "custom",
  ];

  if (!paletteType) return "custom";

  const normalized = paletteType.toLowerCase().trim();

  // Direct match
  if (validTypes.includes(normalized)) return normalized;

  // Mapping for common variations
  const typeMap = {
    mono: "monochromatic",
    single: "monochromatic",
    adjacent: "analogous",
    similar: "analogous",
    opposite: "complementary",
    contrast: "complementary",
    triad: "triadic",
    three: "triadic",
    quad: "tetradic",
    four: "tetradic",
    split: "split-complementary",
  };

  // Check if any keyword matches
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalized.includes(key)) return value;
  }

  // Default fallback
  return "custom";
};

// Map industry input to valid enum values
const mapIndustryToEnum = (industry) => {
  const validIndustries = [
    "technology",
    "healthcare",
    "finance",
    "education",
    "retail",
    "food",
    "travel",
    "fashion",
    "entertainment",
    "other",
  ];

  if (!industry) return "technology";

  const normalized = industry.toLowerCase().trim();

  // Direct match
  if (validIndustries.includes(normalized)) return normalized;

  // Mapping for common variations
  const industryMap = {
    tech: "technology",
    software: "technology",
    it: "technology",
    saas: "technology",
    ecommerce: "retail",
    "e-commerce": "retail",
    shopping: "retail",
    medical: "healthcare",
    health: "healthcare",
    fintech: "finance",
    banking: "finance",
    school: "education",
    learning: "education",
    restaurant: "food",
    hospitality: "travel",
    tourism: "travel",
    clothing: "fashion",
    media: "entertainment",
    gaming: "entertainment",
  };

  // Check if any keyword matches
  for (const [key, value] of Object.entries(industryMap)) {
    if (normalized.includes(key)) return value;
  }

  // Default fallback
  return "other";
};

const generateColorPaletteWithAI = async ({
  prompt,
  mood,
  industry,
  paletteType,
  model = "gemini-2.5-flash",
}) => {
  try {
    // Map to valid enum values
    const validMood = mapMoodToEnum(mood);
    const validIndustry = mapIndustryToEnum(industry);
    const validPaletteType = mapPaletteTypeToEnum(paletteType);

    const generator = new ColorPaletteGenerator(genAI);
    const normalizedPalette = await generator.generate({
      prompt: `${prompt}`,
      mood: validMood,
      industry: validIndustry,
      paletteType: validPaletteType,
      model,
    });
    return normalizedPalette;
  } catch (error) {
    return generateDefaultColorPalette(
      mapMoodToEnum(mood),
      mapIndustryToEnum(industry)
    );
  }
};

// Helper function to normalize color palette data to backend schema
const normalizeColorPalette = (palette, mood, industry) => {
  // Map all enum fields to valid values
  const validMood = mapMoodToEnum(mood);
  const validIndustry = mapIndustryToEnum(industry);
  const aiMood = mapMoodToEnum(palette.mood);
  const aiIndustry = mapIndustryToEnum(palette.industry);
  const aiPaletteType = mapPaletteTypeToEnum(palette.paletteType);

  // Ensure required fields exist
  const normalized = {
    name: palette.name || `${validMood} ${validIndustry} Palette`,
    description:
      palette.description ||
      `A ${validMood} color palette for ${validIndustry} applications`,
    mood: aiMood || validMood,
    industry: aiIndustry || validIndustry,
    paletteType: aiPaletteType || "custom",
    colors: {},
    accessibility: {
      contrastRatio:
        typeof palette.accessibility?.contrastRatio === "number"
          ? palette.accessibility.contrastRatio
          : 4.5,
      wcagCompliant: Boolean(palette.accessibility?.wcagCompliant),
      notes: palette.accessibility?.notes || "Accessibility compliant",
    },
    usage: palette.usage || {
      primary: "Use for main CTAs, links, and brand elements",
      secondary: "Use for supporting elements and highlights",
      accent: "Use sparingly for emphasis and special elements",
    },
    tags: Array.isArray(palette.tags)
      ? palette.tags
      : [mood, industry, "accessible", "modern"],
  };

  const src = palette.colors || {};
  const pickHex = (obj) => {
    if (!obj) return undefined;
    if (typeof obj === "string") return obj;
    if (obj.hex) return obj.hex;
    return undefined;
  };

  // Map to backend schema keys only
  const primaryHex = pickHex(src.primary) || "#3B82F6";
  const secondaryHex = pickHex(src.secondary) || "#64748B";
  const accentHex = pickHex(src.accent) || "#F59E0B";
  const backgroundHex = pickHex(src.background) || "#FFFFFF";
  const textHex = pickHex(src.text || src.textPrimary) || "#1F2937";

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
  if (palette.gradients && typeof palette.gradients === "object") {
    normalized.gradients = {};
    if (palette.gradients.primary) {
      normalized.gradients.primary = {
        linear: palette.gradients.primary.linear,
        radial: palette.gradients.primary.radial,
        usage: palette.gradients.primary.usage,
      };
    }
    if (palette.gradients.accent) {
      normalized.gradients.accent = {
        linear: palette.gradients.accent.linear,
        radial: palette.gradients.accent.radial,
        usage: palette.gradients.accent.usage,
      };
    }
    if (palette.gradients.neutral) {
      normalized.gradients.neutral = {
        linear: palette.gradients.neutral.linear,
        usage: palette.gradients.neutral.usage,
      };
    }
    if (palette.gradients.glass) {
      normalized.gradients.glass = {
        backdrop: palette.gradients.glass.backdrop,
        border: palette.gradients.glass.border,
        usage: palette.gradients.glass.usage,
      };
    }
  }

  // Fallback gradients if missing
  if (!normalized.gradients) {
    const p = normalized.colors.primary?.hex || "#3B82F6";
    const a = normalized.colors.accent?.hex || "#F59E0B";
    const n = normalized.colors.neutral?.[0]?.hex || "#E5E7EB";
    normalized.gradients = {
      primary: {
        linear: `linear-gradient(135deg, ${p} 0%, ${a} 100%)`,
        radial: `radial-gradient(circle, ${p} 0%, ${a} 100%)`,
        usage: "Hero sections, buttons, cards",
      },
      accent: {
        linear: `linear-gradient(45deg, ${a} 0%, ${p} 100%)`,
        radial: `radial-gradient(ellipse, ${a} 0%, ${p} 100%)`,
        usage: "CTAs, highlights, special elements",
      },
      neutral: {
        linear: `linear-gradient(180deg, ${n} 0%, #ffffff 100%)`,
        usage: "Backgrounds, overlays, subtle effects",
      },
    };
  }

  return normalized;
};

// Enhanced Font Suggestions (Updated for simplified frontend form)
const buildFontSuggestionsPrompt = (options = {}) => {
  const {
    projectType = "Website",
    tone = "professional",
    accessibilityLevel = "AA",
    brandPersonality = [],
    includePairings = true,
    previewText = "",
    prompt = "",
    model = "gemini-2.5-flash",
  } = options;

  console.log("🎯 Building AI prompt with options:", {
    projectType,
    tone,
    accessibilityLevel,
    brandPersonalityCount: brandPersonality.length,
    hasPreviewText: !!previewText,
    includePairings,
  });

  const depthFocus = model.includes("pro");

  const toneGuidelines = {
    professional:
      "Clean, authoritative, trustworthy, and business-appropriate - inspires confidence and competence",
    modern:
      "Contemporary, sleek, minimalist, and forward-thinking - cutting-edge and innovative",
    elegant:
      "Sophisticated, refined, luxurious, and graceful - timeless beauty and premium quality",
    playful:
      "Fun, friendly, approachable, and energetic - creates joy and engagement",
    creative:
      "Artistic, unique, experimental, and expressive - pushes boundaries and inspires",
    minimal:
      "Simple, clean, uncluttered, and focused - less is more philosophy",
    bold: "Strong, confident, impactful, and attention-grabbing - commands attention and respect",
    friendly:
      "Warm, approachable, welcoming, and personable - builds human connections",
    luxury:
      "Exclusive, premium, sophisticated, and aspirational - high-end appeal",
    classic:
      "Traditional, timeless, reliable, and established - enduring quality",
    casual:
      "Relaxed, informal, accessible, and down-to-earth - everyday appeal",
    serious:
      "Authoritative, formal, credible, and substantial - professional gravitas",
  };

  const projectTypeContext = {
    Website:
      "Web applications, responsive design, user interfaces, digital experiences",
    "Mobile App":
      "Mobile interfaces, iOS/Android apps, touch-first design, small screens",
    Logo: "Brand identity, logomarks, scalable graphics, brand recognition",
    "Print Design":
      "Printed materials, brochures, magazines, high-resolution output",
    "Brand Identity":
      "Complete brand systems, visual identity, brand guidelines",
    "Marketing Materials":
      "Promotional content, advertising, sales materials, campaigns",
    "UI/UX Design":
      "User interface design, dashboards, admin panels, interactive elements",
    Typography: "Type-focused design, editorial layouts, typographic hierarchy",
    Editorial:
      "Publications, articles, content-heavy layouts, reading experiences",
  };

  const accessibilityRequirements = {
    A: "Basic WCAG compliance with good readability",
    AA: "Standard accessibility excellence (4.5:1 contrast minimum)",
    AAA: "Premium accessibility with enhanced legibility (7:1 contrast minimum)",
  };

  const toneGuide = toneGuidelines[tone] || toneGuidelines.professional;
  const projectDesc =
    projectTypeContext[projectType] || projectTypeContext["Website"];
  const accessibilityReq =
    accessibilityRequirements[accessibilityLevel] ||
    accessibilityRequirements["AA"];

  // Build brand personality context
  const personalityContext =
    brandPersonality.length > 0
      ? `Brand should feel: ${brandPersonality.join(
          ", "
        )} - integrate these personality traits into font selection.`
      : "";

  // Build preview text context
  const previewContext =
    previewText &&
    previewText.trim() !== "The quick brown fox jumps over the lazy dog" &&
    previewText.trim() !== ""
      ? `Test fonts with this specific text: "${previewText}"`
      : "Use standard typography samples for demonstration";

  const aiPrompt = `
You are a typography expert. Generate ${
    depthFocus ? "4-5" : "3-4"
  } font combinations for ${projectDesc} with a ${toneGuide} style.

PROJECT DETAILS:
• Project Type: ${projectType}
• Style: ${toneGuide}
${personalityContext}
• ${previewContext}

${prompt ? `REQUIREMENTS: ${prompt}` : ""}

Focus on:
✓ Clean, readable fonts
✓ Good font pairings
✓ Modern Google Fonts
✓ Simple usage guidelines

RETURN ONLY VALID JSON:

{
  "success": true,
  "projectType": "${projectType}",
  "tone": "${tone}",
  "summary": "Short summary for ${projectType} project",
  "suggestions": [
    {
      "id": "combo_1",
      "name": "Font Combination Name",
      "description": "Brief description of this font pairing",
      "score": 95,
      "primaryFont": {
        "name": "Google Font Name",
        "category": "Sans-serif",
        "weight": "400, 500, 600, 700",
        "url": "https://fonts.google.com/specimen/Font+Name"
      },
      "secondaryFont": {
        "name": "Google Font Name", 
        "category": "Serif",
        "weight": "400, 600",
        "url": "https://fonts.google.com/specimen/Font+Name"
      },
      "usage": {
        "headings": "Font Name (600, 700)",
        "body": "Font Name (400, 500)", 
        "accents": "Font Name (400, 600)"
      },
      "reasoning": "Short explanation why this combination works well",
      "bestFor": ["Use case 1", "Use case 2", "Use case 3"],
      "implementation": {
        "cssImport": "@import url('https://fonts.googleapis.com/css2?family=Font+Name:wght@400;500;600;700&display=swap');",
        "fontStack": "font-family: 'Font Name', -apple-system, BlinkMacSystemFont, sans-serif;"
      }
    }
  ],
  "tags": ["${tone}", "${projectType}", "modern", "clean"${
    brandPersonality.length > 0 ? `, "${brandPersonality.join('", "')}"` : ""
  }]
}`;

  return aiPrompt;
};

const generateFontSuggestionsWithAI = async ({
  prompt,
  projectType,
  tone,
  accessibilityLevel,
  brandPersonality,
  includePairings,
  previewText,
  model = "gemini-2.5-flash",
}) => {
  try {
    const aiPrompt = buildFontSuggestionsPrompt({
      projectType,
      tone,
      accessibilityLevel,
      brandPersonality,
      includePairings,
      previewText,
      prompt,
      model,
    });

    console.log("🚀 FONT SUGGESTIONS PROMPT:");
    console.log("=".repeat(80));
    console.log(aiPrompt);
    console.log("=".repeat(80));

    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(aiPrompt);
    let responseText = result.response.text();

    console.log("🎯 GEMINI RESPONSE:");
    console.log("-".repeat(80));
    console.log(responseText);
    console.log("-".repeat(80));

    responseText = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const fonts = JSON.parse(responseText);

      // Normalize and validate the font suggestions data
      const normalizedFonts = normalizeFontSuggestions(
        fonts,
        projectType,
        tone,
        accessibilityLevel
      );
      return normalizedFonts;
    } catch (parseError) {
      return generateDefaultFontSuggestions(projectType, tone);
    }
  } catch (error) {
    return generateDefaultFontSuggestions(projectType, tone);
  }
};

// Enhanced function to normalize font suggestions data (updated for new form fields)
const normalizeFontSuggestions = (
  fonts,
  projectType,
  tone,
  accessibilityLevel
) => {
  console.log("📊 Normalizing font suggestions:", {
    hasSuccess: fonts.success,
    hasSuggestions: Array.isArray(fonts.suggestions),
    hasCombinations: Array.isArray(fonts.combinations),
    suggestionsLength: fonts.suggestions?.length,
    combinationsLength: fonts.combinations?.length,
    projectType,
    tone,
    accessibilityLevel,
  });

  // Handle both new format (suggestions) and legacy format (combinations)
  const rawSuggestions = fonts.suggestions || fonts.combinations || [];

  console.log("🔍 Raw suggestions before mapping:", {
    rawSuggestionsType: typeof rawSuggestions,
    isArray: Array.isArray(rawSuggestions),
    length: rawSuggestions?.length,
    firstItem: rawSuggestions?.[0] ? Object.keys(rawSuggestions[0]) : null,
  });

  const normalizedSuggestions = Array.isArray(rawSuggestions)
    ? rawSuggestions.map((item, index) => {
        console.log(`🔄 Processing suggestion ${index + 1}:`, {
          hasId: !!item.id,
          hasName: !!item.name,
          hasPrimaryFont: !!item.primaryFont,
          hasSecondaryFont: !!item.secondaryFont,
        });
        // New format handling
        if (item.primaryFont && item.secondaryFont) {
          return {
            id: item.id || `suggestion_${index + 1}`,
            name: item.name || `Font Combination ${index + 1}`,
            description:
              item.description || "AI-generated typography recommendation",
            primaryFont: {
              name: item.primaryFont?.name || "Inter",
              category: item.primaryFont?.category || "Sans-serif",
              weight: item.primaryFont?.weight || "400, 500, 600, 700",
              url:
                item.primaryFont?.url ||
                "https://fonts.google.com/specimen/Inter",
            },
            secondaryFont: {
              name: item.secondaryFont?.name || "Source Sans Pro",
              category: item.secondaryFont?.category || "Sans-serif",
              weight: item.secondaryFont?.weight || "400, 600",
              url:
                item.secondaryFont?.url ||
                "https://fonts.google.com/specimen/Source+Sans+Pro",
            },
            usage: item.usage || {
              headings: `${item.primaryFont?.name || "Inter"} (600, 700)`,
              body: `${item.primaryFont?.name || "Inter"} (400, 500)`,
              accents: `${
                item.secondaryFont?.name || "Source Sans Pro"
              } (400, 600)`,
            },
            score: typeof item.score === "number" ? item.score : 8.5,
            reasoning:
              item.reasoning || "This combination works well for your project",
            bestFor: Array.isArray(item.bestFor)
              ? item.bestFor
              : ["Web applications", "Professional content"],
            psychology: item.psychology || "Clean and professional appearance",
            accessibility: item.accessibility || {
              contrastRatio: "4.5:1 AA compliant",
              readability: "Good readability",
              screenReader: "Screen reader friendly",
            },
            performance: item.performance || {
              loadTime: "Fast loading",
              fileSize: "Optimized",
              fallback: "System font fallbacks",
            },
            implementation: item.implementation || {
              cssImport: `@import url('https://fonts.googleapis.com/css2?family=${(
                item.primaryFont?.name || "Inter"
              ).replace(" ", "+")}:wght@400;500;600;700&display=swap');`,
              fontStack: `font-family: '${
                item.primaryFont?.name || "Inter"
              }', -apple-system, BlinkMacSystemFont, sans-serif;`,
            },
            tags: Array.isArray(item.tags)
              ? item.tags
              : [tone, projectType, "accessible", "optimized"],
          };
        }

        // Legacy format handling (combinations with heading/body/accent structure)
        return {
          id: `legacy_${index + 1}`,
          name: item.name || `Font Combination ${index + 1}`,
          description: item.description || "Professional font combination",
          primaryFont: {
            name: item.heading?.primary || "Inter",
            category: "Sans-serif",
            weight: item.heading?.weight || "400, 500, 600, 700",
            url: `https://fonts.google.com/specimen/${(
              item.heading?.primary || "Inter"
            ).replace(" ", "+")}`,
          },
          secondaryFont: {
            name:
              item.body?.primary || item.accent?.primary || "Source Sans Pro",
            category: "Sans-serif",
            weight: item.body?.weight || "400, 600",
            url: `https://fonts.google.com/specimen/${(
              item.body?.primary || "Source+Sans+Pro"
            ).replace(" ", "+")}`,
          },
          usage: {
            headings:
              item.heading?.usage ||
              `${item.heading?.primary || "Inter"} (600, 700)`,
            body:
              item.body?.usage || `${item.body?.primary || "Inter"} (400, 500)`,
            accents:
              item.accent?.usage || `${item.accent?.primary || "Inter"} (500)`,
          },
          score: 8.0,
          reasoning: item.reasoning || "Professional and readable combination",
          bestFor: Array.isArray(item.bestFor) ? item.bestFor : ["General use"],
          psychology: "Creates professional impression with good readability",
          accessibility: item.accessibility || "Good contrast and readability",
          performance: "Optimized Google Fonts loading",
          implementation: {
            cssImport: `@import url('https://fonts.googleapis.com/css2?family=${(
              item.heading?.primary || "Inter"
            ).replace(" ", "+")}:wght@400;500;600;700&display=swap');`,
            fontStack: `font-family: '${
              item.heading?.primary || "Inter"
            }', -apple-system, BlinkMacSystemFont, sans-serif;`,
          },
          tags: [tone, projectType, `WCAG-${accessibilityLevel}`, "accessible"],
        };
      })
    : [];

  console.log("🎯 Normalized suggestions result:", {
    normalizedCount: normalizedSuggestions.length,
    suggestionIds: normalizedSuggestions.map((s) => s.id),
    suggestionNames: normalizedSuggestions.map((s) => s.name),
  });

  const normalized = {
    success: fonts.success || true,
    projectType: fonts.projectType || projectType,
    tone: fonts.tone || tone,
    accessibilityLevel: fonts.accessibilityLevel || accessibilityLevel,
    summary: fonts.summary || `Font recommendations for ${projectType}`,
    suggestions: normalizedSuggestions,
    // Legacy support - map suggestions back to combinations for backward compatibility
    combinations: normalizedSuggestions,
    designSystem: fonts.designSystem || {
      typeScale: { ratio: 1.25, baseSize: "1rem" },
      spacing: { lineHeight: { body: 1.6, headings: 1.2 } },
    },
    businessImpact: fonts.businessImpact || {
      brandPerception:
        "Enhanced professional credibility and brand recognition",
      userExperience: "Improved readability, engagement, and user satisfaction",
      conversionOptimization:
        "Clear typography hierarchy that drives user actions",
    },
    principles: fonts.principles || {
      contrast:
        "Clear visual hierarchy through font weight and size variations",
      spacing:
        "Optimal line height (1.4-1.6) and letter spacing for readability",
      scaling: "Responsive typography using modular scales for all devices",
    },
    tags: Array.isArray(fonts.tags)
      ? fonts.tags
      : [
          tone,
          projectType,
          `WCAG-${accessibilityLevel}`,
          "accessible",
          "optimized",
        ],
  };

  console.log("✅ Font suggestions normalized:", {
    suggestionsCount: normalized.suggestions.length,
    hasDesignSystem: !!normalized.designSystem,
    hasBusinessImpact: !!normalized.businessImpact,
  });

  return normalized;
};

// Enhanced UX Audit with Image Analysis
const buildUXAuditPrompt = (options = {}) => {
  const {
    imageUrl = "",
    description = "",
    context = "general web application",
    focusAreas = ["all"],
    model = "gemini-2.5-flash",
  } = options;

  const depthFocus = model.includes("pro");

  const focusAreaGuidelines = {
    accessibility:
      "WCAG compliance, screen reader support, keyboard navigation, color contrast, alt text, focus indicators",
    usability:
      "User flow, navigation, information architecture, task completion, user journey optimization",
    visualDesign:
      "Visual hierarchy, consistency, branding, aesthetics, layout, typography, color theory",
    performance:
      "Loading speed, responsiveness, optimization, technical performance, perceived performance",
    content:
      "Clarity, readability, information density, content strategy, microcopy, error messages",
    engagement:
      "User engagement, call-to-actions, conversion optimization, user retention strategies",
    mobile:
      "Mobile responsiveness, touch interactions, mobile-specific UX, gesture support",
    all: "Comprehensive analysis across all UX dimensions with detailed insights",
  };

  const contextGuidelines = {
    "general web application":
      "Standard web application with typical user flows and business requirements",
    "e-commerce":
      "Online shopping experience, product discovery, checkout process, conversion optimization",
    "landing page":
      "Marketing page, lead generation, conversion focus, first impressions",
    dashboard:
      "Data visualization, admin interface, complex interactions, information density",
    "mobile app":
      "Mobile-first design, touch interactions, app-specific patterns, native feel",
    portfolio:
      "Creative showcase, visual presentation, personal branding, storytelling",
    blog: "Content consumption, reading experience, information architecture, engagement",
    saas: "Software as a service, feature discovery, user onboarding, complex workflows",
  };

  const focusDesc = focusAreas
    .map((area) => focusAreaGuidelines[area] || area)
    .join(", ");
  const contextDesc =
    contextGuidelines[context] || contextGuidelines["general web application"];

  const aiPrompt = `
You are a world-class Senior UX/UI Design Auditor with 15+ years of experience at top tech companies (Google, Apple, Airbnb). 
You specialize in comprehensive design audits, accessibility compliance, conversion optimization, and design system architecture.

🎯 MISSION: Provide a surgical analysis of this design screenshot that rivals the best UX consultants in the industry.

CONTEXT: ${contextDesc}
FOCUS AREAS: ${focusDesc}
DESCRIPTION: ${
    description ||
    "Analyze the provided design screenshot with expert precision"
  }

═══════════════════════════════════════════════════════════════════════════════

🔍 COMPREHENSIVE ANALYSIS FRAMEWORK:

1. **EXECUTIVE SUMMARY ANALYSIS**
   - Immediate visual impression and cognitive load assessment
   - Primary user journey effectiveness 
   - Business impact potential of current design
   - Critical issues requiring immediate attention

2. **DEEP UX PSYCHOLOGY ANALYSIS**
   - Apply Fitts's Law for clickable element placement and sizing
   - Hick's Law analysis for decision complexity
   - Miller's Rule evaluation for information chunks
   - Von Restorff Effect assessment for important elements
   - Gestalt principles evaluation (proximity, similarity, closure, continuity)

3. **ACCESSIBILITY EXCELLENCE (WCAG 2.1 AA+)**
   - Color contrast ratios with exact measurements
   - Keyboard navigation flow analysis
   - Screen reader compatibility assessment
   - Touch target sizing (minimum 44px rule)
   - Focus indicator visibility and clarity
   - Alt text quality for images
   - Semantic HTML structure implications

4. **EMOTIONAL DESIGN & BRAND PSYCHOLOGY**
   - Emotional journey mapping through the interface
   - Brand personality alignment assessment
   - Color psychology impact on user behavior
   - Typography emotional resonance
   - Visual hierarchy supporting brand goals
   - Trust signals and credibility indicators

5. **CONVERSION OPTIMIZATION SCIENCE**
   - CTA placement using F-pattern and Z-pattern analysis
   - Form design friction points
   - Social proof implementation effectiveness
   - Urgency and scarcity principle application
   - Cognitive bias utilization (anchoring, loss aversion, etc.)
   - Conversion funnel optimization opportunities

6. **DESIGN SYSTEM FORENSICS**
   - Component consistency audit
   - Spacing system adherence (8pt grid, golden ratio, etc.)
   - Typography scale mathematical relationships
   - Color palette systematic usage
   - Icon style and semantic consistency
   - Micro-interaction pattern alignment

7. **RESPONSIVE UX SIMULATION**
   - Mobile-first design principle adherence
   - Breakpoint behavior predictions
   - Touch interaction optimization
   - Content prioritization across devices
   - Performance implications of design choices

8. **UX WRITING & MICROCOPY EXCELLENCE**
   - Tone of voice consistency
   - Clarity and scannability assessment
   - Error message helpfulness
   - CTA text persuasiveness
   - Information hierarchy through content

${
  depthFocus
    ? `
🎓 EXPERT-LEVEL DEEP DIVE:
- Provide exact pixel measurements and mathematical ratios
- Reference specific design principles (Material Design 3.0, Apple HIG, Atomic Design)
- Include accessibility audit with WCAG 2.1 AAA compliance checks
- Analyze cognitive load using established UX research methodologies
- Evaluate micro-interactions and motion design opportunities
- Assess design system maturity and scalability
- Include competitive analysis context
- Provide data-driven insights with user research backing
`
    : `
🎯 FOCUSED EXPERT ANALYSIS:
- Highlight top 5 critical issues affecting user experience and business metrics
- Provide laser-focused, actionable recommendations with ROI potential
- Focus on high-impact improvements with implementation priorities
- Include quick wins that can be implemented within 24-48 hours
`
}

═══════════════════════════════════════════════════════════════════════════════

📊 ENHANCED SCORING METHODOLOGY:
- 95-100: Exceptional - Best-in-class, benchmark quality
- 85-94: Excellent - Industry best practices, minimal issues
- 70-84: Good - Solid foundation with optimization opportunities  
- 55-69: Fair - Noticeable issues impacting user experience
- 40-54: Poor - Significant problems requiring major improvements
- 25-39: Critical - Fundamental flaws preventing effective use
- 0-24: Broken - Complete redesign required

═══════════════════════════════════════════════════════════════════════════════

🏗️ RESPONSE STRUCTURE - STRICT JSON FORMAT:
{
  "executiveSummary": {
    "overallScore": 85,
    "immediateImpression": "First 3-second user impression analysis",
    "businessImpact": "Potential revenue/conversion impact assessment",
    "criticalIssuesCount": 3,
    "timeToImplementFixes": "2-4 weeks"
  },
  "designAnalysis": {
    "visualHierarchy": {
      "score": 82,
      "analysis": "Detailed hierarchy effectiveness with F/Z-pattern analysis",
      "uxLawsApplied": ["Fitts's Law", "Hick's Law"],
      "improvements": "Specific hierarchy enhancement recommendations"
    },
    "colorUsage": {
      "score": 78,
      "contrastRatios": {"primary": "4.5:1", "secondary": "3.2:1"},
      "psychologyImpact": "Color psychology effect on user behavior",
      "accessibilityScore": 85,
      "improvements": "Color optimization recommendations"
    },
    "typography": {
      "score": 80,
      "readabilityScore": 88,
      "hierarchyEffectiveness": 75,
      "emotionalResonance": "Professional but approachable",
      "improvements": "Typography enhancement suggestions"
    },
    "spacing": {
      "score": 85,
      "gridSystemCompliance": "8pt grid - 90% adherent",
      "whitespaceEffectiveness": 82,
      "mathematicalHarmony": "Golden ratio: 60% applied",
      "improvements": "Spacing optimization recommendations"
    },
    "brandAlignment": {
      "score": 88,
      "personalityMatch": "85% aligned with intended brand personality",
      "trustSignals": 4,
      "emotionalJourney": "Positive → Confident → Engaged",
      "improvements": "Brand strengthening opportunities"
    }
  },
  "accessibilityAudit": {
    "overallScore": 78,
    "wcagCompliance": "AA - 85% | AAA - 60%",
    "keyboardNavigation": {
      "score": 82,
      "tabOrder": "Logical flow maintained",
      "focusIndicators": "Visible but could be enhanced",
      "skipLinks": "Missing - critical accessibility gap"
    },
    "colorContrast": {
      "score": 75,
      "failures": [
        {"element": "Secondary buttons", "ratio": "3.2:1", "required": "4.5:1", "wcagLevel": "AA"}
      ],
      "improvements": ["Darken secondary button text by 15%", "Add border for low-contrast elements"]
    },
    "screenReader": {
      "score": 80,
      "altTextQuality": "Good coverage, some descriptions could be more descriptive",
      "semanticStructure": "H1-H6 hierarchy mostly correct",
      "ariaLabels": "85% implementation",
      "improvements": ["Add ARIA landmarks", "Enhance alt text descriptions"]
    },
    "codeSnippets": [
      {"issue": "Low contrast buttons", "fix": "color: #2d3748; /* Increases contrast to 4.52:1 */"},
      {"issue": "Missing skip link", "fix": "<a href='#main-content' class='sr-only'>Skip to main content</a>"}
    ]
  },
  "usabilityAnalysis": {
    "overallScore": 83,
    "userFlowEfficiency": {
      "score": 85,
      "clicksToGoal": 3,
      "cognitiveLoad": "Medium - could be reduced",
      "errorPrevention": "Good form validation visible"
    },
    "navigationClarity": {
      "score": 88,
      "menuStructure": "Clear hierarchy, logical grouping",
      "breadcrumbs": "Present and functional",
      "searchability": "Search prominent and accessible"
    },
    "formUsability": {
      "score": 75,
      "fieldLabeling": "Clear but could use more contextual help",
      "errorHandling": "Real-time validation present",
      "completionRate": "Estimated 78% based on design patterns"
    }
  },
  "conversionOptimization": {
    "overallScore": 76,
    "ctaEffectiveness": {
      "score": 82,
      "placement": "Above fold, good contrast",
      "copyPersuasiveness": "Action-oriented but could be more specific",
      "visualHierarchy": "Primary CTA stands out well"
    },
    "trustSignals": {
      "score": 70,
      "present": ["Customer reviews", "Security badges"],
      "missing": ["Company logos", "Testimonials with photos"],
      "improvements": "Add social proof and credibility indicators"
    },
    "urgencyScarcity": {
      "score": 65,
      "implementation": "Limited use of urgency",
      "opportunities": ["Limited time offers", "Stock indicators", "Social proof counters"]
    }
  },
  "responsiveDesign": {
    "overallScore": 80,
    "mobileFriendliness": {
      "score": 85,
      "touchTargets": "Most elements meet 44px minimum",
      "contentPrioritization": "Good mobile hierarchy",
      "gestureSupport": "Standard touch gestures supported"
    },
    "breakpointStrategy": {
      "score": 75,
      "implementation": "Good responsive behavior predicted",
      "contentAdaptation": "Text and images scale appropriately",
      "navigationCollapse": "Hamburger menu implementation needed"
    }
  },
  "uxWriting": {
    "overallScore": 82,
    "clarity": {
      "score": 85,
      "scanability": "Good use of headings and bullet points",
      "jargonLevel": "Appropriate for target audience",
      "actionOriented": "Clear next steps provided"
    },
    "toneOfVoice": {
      "score": 80,
      "consistency": "Professional and friendly tone maintained",
      "brandAlignment": "Matches intended brand personality",
      "emotionalResonance": "Builds confidence and trust"
    },
    "microcopy": {
      "score": 78,
      "errorMessages": "Helpful but could be more specific",
      "placeholderText": "Clear and instructive",
      "buttonLabels": "Action-oriented, could be more specific"
    }
  },
  "criticalIssues": [
    {
      "severity": "high",
      "category": "accessibility",
      "title": "Color Contrast Violations",
      "description": "Secondary buttons fail WCAG AA contrast requirements (3.2:1 vs required 4.5:1)",
      "businessImpact": "Potential legal compliance issues, 15% of users affected",
      "uxLawViolated": "Weber's Law - insufficient perceptual difference",
      "implementation": {
        "effort": "Low (2 hours)",
        "priority": "High",
        "codeSnippet": ".btn-secondary { color: #2d3748; border: 1px solid #4a5568; }"
      },
      "wcagGuideline": "1.4.3 Contrast (Minimum)"
    },
    {
      "severity": "medium",
      "category": "conversion",
      "title": "CTA Copy Lacks Specificity",
      "description": "Primary CTA 'Learn More' is vague and doesn't indicate clear value",
      "businessImpact": "Potential 12-18% conversion rate increase with specific copy",
      "uxLawViolated": "Von Restorff Effect - CTA doesn't stand out meaningfully",
      "implementation": {
        "effort": "Low (1 hour)",
        "priority": "Medium",
        "suggestions": ["'Get Free Audit Report'", "'Start 14-Day Trial'", "'See Pricing Options'"]
      }
    }
  ],
  "quickWins": [
    {
      "title": "Increase Secondary Button Contrast",
      "implementation": "Darken text color from #718096 to #2d3748",
      "timeToImplement": "30 minutes",
      "expectedImpact": "15% improvement in accessibility score",
      "roiPotential": "High - legal compliance + better UX"
    },
    {
      "title": "Add Skip Navigation Link",
      "implementation": "Insert visually hidden skip link before main navigation",
      "timeToImplement": "45 minutes",
      "expectedImpact": "Significant accessibility improvement for keyboard users",
      "roiPotential": "Medium - better accessibility compliance"
    },
    {
      "title": "Enhance CTA Copy Specificity",
      "implementation": "Change 'Learn More' to 'Get Free UX Audit Report'",
      "timeToImplement": "15 minutes",
      "expectedImpact": "12-18% potential conversion increase",
      "roiPotential": "Very High - direct revenue impact"
    }
  ],
  "implementationRoadmap": {
    "phase1": {
      "timeframe": "Week 1",
      "priority": "Critical fixes",
      "tasks": ["Fix color contrast", "Add skip links", "Improve CTA copy"],
      "effort": "8 hours",
      "expectedImpact": "25% overall UX score improvement"
    },
    "phase2": {
      "timeframe": "Week 2-3", 
      "priority": "Usability enhancements",
      "tasks": ["Optimize form flow", "Add trust signals", "Improve microcopy"],
      "effort": "20 hours",
      "expectedImpact": "15% conversion rate improvement"
    },
    "phase3": {
      "timeframe": "Week 4-6",
      "priority": "Advanced optimizations",
      "tasks": ["Responsive refinements", "Animation improvements", "A/B test setup"],
      "effort": "40 hours",
      "expectedImpact": "10% additional optimization"
    }
  },
  "competitiveBenchmark": {
    "industryPosition": "Above average - 78th percentile",
    "strengthsVsCompetitors": ["Clean visual design", "Good mobile responsiveness"],
    "gapsVsLeaders": ["Accessibility compliance", "Conversion optimization", "Trust signals"],
    "opportunityAreas": ["Micro-interactions", "Personalization", "Social proof integration"]
  },
  "designSystemRecommendations": {
    "componentLibrary": {
      "score": 75,
      "consistency": "Good foundation, some inconsistencies in spacing",
      "scalability": "Components appear reusable with minor modifications",
      "recommendations": ["Standardize spacing tokens", "Create button size variants", "Define color semantic tokens"]
    },
    "tokenSystem": {
      "colors": "Primary palette strong, secondary could be expanded",
      "typography": "Good scale, consider adding display sizes",
      "spacing": "Implement 8pt grid more consistently",
      "shadows": "Good depth system, consider adding more subtle variants"
    }
  },
  "categories": {
    "accessibility": {
      "score": 78,
      "issues": [
        {
          "type": "error",
          "title": "Color Contrast Violations",
          "description": "Secondary buttons fail WCAG AA requirements (3.2:1 vs required 4.5:1)",
          "severity": "high",
          "suggestion": "Darken button text color to #2d3748 for compliance",
          "priority": "high"
        },
        {
          "type": "warning", 
          "title": "Missing Skip Navigation",
          "description": "No skip links present for keyboard navigation users",
          "severity": "medium",
          "suggestion": "Add visually hidden skip link before main navigation",
          "priority": "medium"
        }
      ]
    },
    "usability": {
      "score": 83,
      "issues": [
        {
          "type": "warning",
          "title": "Form Field Context",
          "description": "Some form fields lack helpful context or examples",
          "severity": "medium", 
          "suggestion": "Add placeholder text and help icons with tooltips",
          "priority": "medium"
        }
      ]
    },
    "visualDesign": {
      "score": 85,
      "issues": [
        {
          "type": "info",
          "title": "Typography Hierarchy",
          "description": "H2 and H3 headings could have more distinct sizing",
          "severity": "low",
          "suggestion": "Increase size difference between heading levels by 4-6px",
          "priority": "low"
        }
      ]
    },
    "performance": {
      "score": 80,
      "issues": [
        {
          "type": "warning",
          "title": "Image Optimization",
          "description": "Hero images appear unoptimized for web delivery",
          "severity": "medium",
          "suggestion": "Implement WebP format and responsive image loading",
          "priority": "medium"
        }
      ]
    },
    "content": {
      "score": 82,
      "issues": [
        {
          "type": "info",
          "title": "CTA Copy Specificity",
          "description": "'Learn More' CTA is vague and non-actionable",
          "severity": "medium",
          "suggestion": "Use specific action words like 'Get Free Audit' or 'Start Trial'",
          "priority": "medium"
        }
      ]
    },
    "engagement": {
      "score": 78,
      "issues": [
        {
          "type": "info",
          "title": "Social Proof Elements",
          "description": "Limited trust signals and social proof visible",
          "severity": "low",
          "suggestion": "Add customer testimonials, logos, or review counts",
          "priority": "low"
        }
      ]
    }
  },
  "tags": ["${context}", "comprehensive-audit", "accessibility-focused", "conversion-optimized", "implementation-ready"]
}

═══════════════════════════════════════════════════════════════════════════════

🎯 CRITICAL SUCCESS FACTORS:
- Provide specific, measurable feedback with exact numbers (e.g., "Increase button size to 44px for WCAG compliance")
- Reference exact UI elements visible in the screenshot with precise descriptions
- Include both immediate tactical fixes AND strategic long-term improvements
- Ground all recommendations in established UX research and psychological principles
- Consider the complete user journey from awareness to conversion to retention
- Ensure every recommendation includes implementation difficulty and expected impact
- Provide ready-to-use code snippets for developers where applicable
- **IMPORTANT**: The "categories" section MUST contain specific issues for each category. Never leave issues arrays empty. Always find at least 1-2 actionable improvements per category, even if minor.

DELIVER A WORLD-CLASS UX AUDIT THAT EXCEEDS INDUSTRY STANDARDS.`;

  return aiPrompt;
};

const performUXAuditWithAI = async ({
  imageUrl,
  imageBuffer,
  description,
  context,
  focusAreas,
  model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
}) => {
  try {
    const aiPrompt = buildUXAuditPrompt({
      imageUrl,
      description,
      context,
      focusAreas,
      model,
    });

    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    let result;

    // If we have an image, use vision capabilities
    if (imageBuffer) {
      // Get the image MIME type from buffer
      const getMimeType = (buffer) => {
        const signature = buffer.toString("hex", 0, 4);
        if (signature === "89504e47") return "image/png";
        if (signature.startsWith("ffd8")) return "image/jpeg";
        if (signature.startsWith("47494638")) return "image/gif";
        if (signature.startsWith("52494646")) return "image/webp";
        return "image/jpeg"; // Default fallback
      };

      const mimeType = getMimeType(imageBuffer);

      const prompt = [
        {
          text: aiPrompt,
        },
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimeType,
          },
        },
      ];

      result = await geminiModel.generateContent(prompt);
    } else {
      // Text-only analysis

      result = await geminiModel.generateContent(aiPrompt);
    }

    if (!result || !result.response) {
      throw new Error("No response received from AI model");
    }

    let responseText = result.response.text();

    // Clean up the response
    responseText = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .replace(/^```json$/gm, "")
      .replace(/^```$/gm, "")
      .trim();

    try {
      const audit = JSON.parse(responseText);

      // Normalize and validate the audit data
      const normalizedAudit = normalizeUXAudit(audit, context, focusAreas);

      return normalizedAudit;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError.message);

      // Try to extract JSON from response if it's wrapped in other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const audit = JSON.parse(jsonMatch[0]);
          const normalizedAudit = normalizeUXAudit(audit, context, focusAreas);
          return normalizedAudit;
        } catch (secondParseError) {
          console.error(
            "❌ Second JSON parsing failed:",
            secondParseError.message
          );
        }
      }

      return generateDefaultUXAuditWithContext(
        context,
        focusAreas,
        description
      );
    }
  } catch (error) {
    console.error("UX Audit AI Error:", error);

    return generateDefaultUXAuditWithContext(context, focusAreas, description);
  }
};

// Helper function to normalize UX audit data
const normalizeUXAudit = (audit, context, focusAreas) => {
  const safeScore = (score, defaultScore = 75) => {
    const numScore =
      typeof score === "number" ? score : parseInt(score) || defaultScore;
    return Math.max(0, Math.min(100, numScore));
  };

  const safeIssues = (issues) => {
    if (!Array.isArray(issues)) return [];
    return issues.map((issue) => ({
      type: issue.type || "info",
      title: issue.title || "Issue",
      description: issue.description || "",
      severity: issue.severity || "low",
      suggestion: issue.suggestion || "",
      priority: issue.priority || "low",
    }));
  };

  const safeQuickWins = (quickWins) => {
    if (!Array.isArray(quickWins)) return ["Improve contrast ratios"];
    return quickWins.map((quickWin) => {
      // Handle both string and object formats for backward compatibility
      if (typeof quickWin === "string") {
        return quickWin;
      }
      // Handle enhanced object format
      return {
        title: quickWin.title || "Quick Win",
        implementation: quickWin.implementation || "",
        timeToImplement: quickWin.timeToImplement || "Unknown",
        expectedImpact: quickWin.expectedImpact || "Positive impact",
        roiPotential: quickWin.roiPotential || "Medium",
      };
    });
  };

  const safeCriticalIssues = (criticalIssues) => {
    if (!Array.isArray(criticalIssues)) return [];
    return criticalIssues.map((issue) => {
      // Handle both string and object formats for backward compatibility
      if (typeof issue === "string") {
        return issue;
      }
      // Handle enhanced object format
      return {
        severity: issue.severity || "medium",
        category: issue.category || "general",
        title: issue.title || "Critical Issue",
        description: issue.description || "",
        businessImpact: issue.businessImpact || "",
        uxLawViolated: issue.uxLawViolated || "",
        implementation: issue.implementation || {},
        wcagGuideline: issue.wcagGuideline || "",
      };
    });
  };

  const normalized = {
    // Use executiveSummary overallScore if available, otherwise fallback to direct overallScore
    overallScore: safeScore(
      audit?.executiveSummary?.overallScore || audit.overallScore,
      75
    ),
    summary:
      audit?.executiveSummary?.immediateImpression ||
      audit.summary ||
      "UX audit completed",

    // Include executive summary if present
    executiveSummary: audit.executiveSummary || null,

    // Include enhanced analysis sections
    designAnalysis: audit.designAnalysis || null,
    accessibilityAudit: audit.accessibilityAudit || null,
    usabilityAnalysis: audit.usabilityAnalysis || null,
    conversionOptimization: audit.conversionOptimization || null,
    responsiveDesign: audit.responsiveDesign || null,
    uxWriting: audit.uxWriting || null,

    categories: {
      accessibility: {
        score: safeScore(audit.categories?.accessibility?.score, 70),
        issues: safeIssues(audit.categories?.accessibility?.issues),
      },
      usability: {
        score: safeScore(audit.categories?.usability?.score, 75),
        issues: safeIssues(audit.categories?.usability?.issues),
      },
      visualDesign: {
        score: safeScore(audit.categories?.visualDesign?.score, 80),
        issues: safeIssues(audit.categories?.visualDesign?.issues),
      },
      performance: {
        score: safeScore(audit.categories?.performance?.score, 75),
        issues: safeIssues(audit.categories?.performance?.issues),
      },
      content: {
        score: safeScore(audit.categories?.content?.score, 80),
        issues: safeIssues(audit.categories?.content?.issues),
      },
      engagement: {
        score: safeScore(audit.categories?.engagement?.score, 75),
        issues: safeIssues(audit.categories?.engagement?.issues),
      },
    },
    recommendations: Array.isArray(audit.recommendations)
      ? audit.recommendations.map((rec) => ({
          priority: rec.priority || "medium",
          category: rec.category || "general",
          title: rec.title || "Recommendation",
          description: rec.description || "",
          impact: rec.impact || "Medium impact",
          effort: rec.effort || "Medium effort",
        }))
      : [],
    strengths: Array.isArray(audit.strengths)
      ? audit.strengths
      : ["Good overall design"],
    quickWins: safeQuickWins(audit.quickWins),
    criticalIssues: safeCriticalIssues(audit.criticalIssues),
    implementationRoadmap: audit.implementationRoadmap || null,
    competitiveBenchmark: audit.competitiveBenchmark || null,
    designSystemRecommendations: audit.designSystemRecommendations || null,
    nextSteps: [], // Removed next steps generation
    tags: Array.isArray(audit.tags)
      ? audit.tags
      : [context, "ux-audit", "recommendations"],
  };

  return normalized;
};

// Default fallback functions
const generateDefaultColorPalette = (mood, industry) => ({
  name: `${mood} ${industry} Palette`,
  description: `A ${mood} color palette for ${industry} applications`,
  colors: {
    primary: {
      hex: "#3B82F6",
      rgb: { r: 59, g: 130, b: 246 },
      hsl: { h: 217, s: 91, l: 60 },
    },
    secondary: {
      hex: "#64748B",
      rgb: { r: 100, g: 116, b: 139 },
      hsl: { h: 215, s: 16, l: 47 },
    },
    accent: {
      hex: "#F59E0B",
      rgb: { r: 245, g: 158, b: 11 },
      hsl: { h: 43, s: 92, l: 50 },
    },
    background: {
      hex: "#FFFFFF",
      rgb: { r: 255, g: 255, b: 255 },
      hsl: { h: 0, s: 0, l: 100 },
    },
    text: {
      hex: "#1F2937",
      rgb: { r: 31, g: 41, b: 55 },
      hsl: { h: 220, s: 26, l: 17 },
    },
  },
});

const generateDefaultFontSuggestions = (projectType, tone) => ({
  success: true,
  projectType: projectType || "Website",
  tone: tone || "professional",
  accessibilityLevel: "AA",
  summary: "Default font recommendations when AI is unavailable",
  suggestions: [
    {
      id: "default_1",
      name: "Professional Standard",
      description:
        "Clean, readable combination perfect for professional applications",
      score: 8.5,
      primaryFont: {
        name: "Inter",
        category: "Sans-serif",
        weight: "400, 500, 600, 700",
        url: "https://fonts.google.com/specimen/Inter",
      },
      secondaryFont: {
        name: "Source Sans Pro",
        category: "Sans-serif",
        weight: "400, 600",
        url: "https://fonts.google.com/specimen/Source+Sans+Pro",
      },
      usage: {
        headings: "Inter (600, 700) for H1-H3",
        body: "Inter (400, 500) for paragraphs",
        accents: "Source Sans Pro (400, 600) for captions",
      },
      reasoning:
        "Inter provides excellent readability with modern appeal, while Source Sans Pro offers complementary support",
      bestFor: ["Web applications", "Professional content", "UI design"],
      psychology:
        "Creates trust and professionalism while maintaining approachability",
      accessibility: {
        contrastRatio: "4.5:1 AA compliant",
        readability: "Excellent legibility at all sizes",
        screenReader: "Screen reader friendly",
      },
      performance: {
        loadTime: "Fast loading Google Fonts",
        fileSize: "Optimized",
        fallback: "System font fallbacks",
      },
      implementation: {
        cssImport:
          "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');",
        fontStack:
          "font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;",
      },
      tags: [tone, projectType, "accessible", "professional"],
    },
  ],
});

const generateDefaultUXAudit = () => ({
  overallScore: 75,
  summary: "AI analysis not available - showing baseline assessment",
  categories: {
    accessibility: {
      score: 70,
      issues: [
        {
          type: "warning",
          title: "Color Contrast Check Needed",
          description: "Verify color contrast ratios meet WCAG AA standards",
          severity: "medium",
          suggestion:
            "Use a contrast checker tool to validate all text/background combinations",
          priority: "medium",
        },
      ],
    },
    usability: {
      score: 75,
      issues: [
        {
          type: "info",
          title: "Navigation Assessment",
          description: "Review navigation structure and user flow",
          severity: "low",
          suggestion: "Conduct user testing to validate navigation patterns",
          priority: "low",
        },
      ],
    },
    visualDesign: {
      score: 80,
      issues: [],
    },
    performance: {
      score: 75,
      issues: [],
    },
  },
  recommendations: [
    {
      priority: "high",
      category: "accessibility",
      title: "Improve Color Contrast",
      description: "Ensure all text meets WCAG color contrast requirements",
      impact: "Better accessibility for users with visual impairments",
      effort: "Low - CSS color adjustments",
    },
  ],
  strengths: ["Clean visual design", "Consistent layout structure"],
  quickWins: ["Optimize color contrast", "Add focus indicators"],
  nextSteps: [], // Removed next steps generation
});

const generateDefaultUXAuditWithContext = (
  context,
  focusAreas,
  description
) => {
  const baseAudit = generateDefaultUXAudit();

  // Customize based on context
  const contextSpecificIssues = {
    "e-commerce": [
      {
        type: "warning",
        title: "Product Page Optimization",
        description:
          "Review product information architecture and checkout flow",
        severity: "high",
        suggestion: "Simplify checkout process and improve product discovery",
        priority: "high",
      },
    ],
    "landing page": [
      {
        type: "info",
        title: "Call-to-Action Optimization",
        description: "Evaluate CTA placement and messaging effectiveness",
        severity: "medium",
        suggestion: "A/B test different CTA designs and positions",
        priority: "high",
      },
    ],
    dashboard: [
      {
        type: "warning",
        title: "Information Density",
        description: "Assess data visualization and information hierarchy",
        severity: "medium",
        suggestion: "Group related information and use progressive disclosure",
        priority: "medium",
      },
    ],
  };

  if (contextSpecificIssues[context]) {
    baseAudit.categories.usability.issues.push(
      ...contextSpecificIssues[context]
    );
  }

  if (description) {
    baseAudit.summary = `Based on description: "${description.substring(
      0,
      100
    )}..." - AI analysis not available, showing baseline assessment`;
  }

  return baseAudit;
};

// Validation function for layout responses
const validateAndNormalizeLayoutResponse = (responseText, options = {}) => {
  const { layoutType, style, industry, componentsRequired = [] } = options;

  try {
    // Check if response is valid HTML
    const hasDoctype = responseText.includes("<!DOCTYPE html>");
    const hasHtml =
      responseText.includes("<html") && responseText.includes("</html>");
    const hasHead =
      responseText.includes("<head>") && responseText.includes("</head>");
    const hasBody =
      responseText.includes("<body>") && responseText.includes("</body>");

    const validationErrors = [];
    let isValid = true;

    console.log(
      "🔍 [Validation] Starting validation for response of length:",
      responseText.length
    );
    console.log("🔍 [Validation] HTML structure check:", {
      hasDoctype,
      hasHtml,
      hasHead,
      hasBody,
    });

    // Only mark as invalid for truly broken HTML - be more lenient
    if (!hasHtml) {
      validationErrors.push("Missing or incomplete HTML tags");
      isValid = false;
    }

    if (!hasBody) {
      validationErrors.push("Missing or incomplete BODY section");
      isValid = false;
    }

    // Check for severe malformed patterns that would break rendering
    if (
      responseText.includes("word-wrap: break-word") &&
      responseText.includes("<img")
    ) {
      validationErrors.push("Detected malformed img tags with text properties");
      // Don't mark as invalid - just warn
    }

    // Check content quality - be more lenient
    const bodyContent = responseText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyContent && bodyContent[1].trim().length < 50) {
      validationErrors.push("Body content appears very short");
      // Don't mark as invalid - just warn
    }

    // Auto-fix missing DOCTYPE and HEAD if HTML is otherwise valid
    let normalizedHtml = responseText;

    if (hasHtml && hasBody && !hasDoctype) {
      console.log("🔧 [Auto-fix] Adding missing DOCTYPE");
      normalizedHtml = "<!DOCTYPE html>\n" + normalizedHtml;
      validationErrors.push("Auto-fixed: Added missing DOCTYPE declaration");
    }

    if (hasHtml && hasBody && !hasHead) {
      console.log("🔧 [Auto-fix] Adding missing HEAD section");
      normalizedHtml = normalizedHtml.replace(
        /<html([^>]*)>/i,
        '<html$1>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Generated Layout</title>\n</head>'
      );
      validationErrors.push("Auto-fixed: Added missing HEAD section");
    }

    // Only use fallback for severely broken HTML
    if (!isValid) {
      console.log(
        "❌ [Fallback] Response is severely malformed, using fallback"
      );
      normalizedHtml = generateFallbackHTML(
        layoutType,
        style,
        industry,
        componentsRequired
      );
    } else {
      console.log("✅ [Validation] Response is valid or auto-fixable");
    }

    return {
      isValid,
      errors: validationErrors,
      htmlCode: normalizedHtml,
      hasWarnings: validationErrors.length > 0,
    };
  } catch (error) {
    console.error("❌ [Validation Error]:", error);
    return {
      isValid: false,
      errors: [`Validation failed: ${error.message}`],
      htmlCode: generateFallbackHTML(
        layoutType,
        style,
        industry,
        componentsRequired
      ),
      hasWarnings: true,
    };
  }
};

// Generate a fallback HTML when AI response is invalid
const generateFallbackHTML = (
  layoutType = "landing-page",
  style = "modern",
  industry = "technology",
  components = []
) => {
  const title = `${
    industry.charAt(0).toUpperCase() + industry.slice(1)
  } ${layoutType.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .hero { 
            padding: 80px 0; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
        }
        .hero h1 { 
            font-size: 3rem; 
            margin-bottom: 20px; 
            font-weight: 700;
        }
        .hero p { 
            font-size: 1.2rem; 
            margin-bottom: 30px; 
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .btn { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600;
            transition: background 0.3s ease;
        }
        .btn:hover { background: #0056b3; }
        .section { padding: 80px 0; }
        .features { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 40px; 
            margin-top: 40px;
        }
        .feature { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            text-align: center;
        }
        .feature h3 { 
            font-size: 1.5rem; 
            margin-bottom: 15px; 
            color: #333;
        }
        .feature p { 
            color: #666; 
            line-height: 1.6;
        }
        .footer { 
            background: #333; 
            color: white; 
            text-align: center; 
            padding: 40px 0; 
        }
        @media (max-width: 768px) { 
            .hero h1 { font-size: 2rem; } 
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header class="hero">
        <div class="container">
            <h1>${title}</h1>
            <p>A professional ${style} ${layoutType.replace(
    "-",
    " "
  )} designed for the ${industry} industry. Built with modern standards and best practices.</p>
            <a href="#features" class="btn">Explore Features</a>
        </div>
    </header>

    <section id="features" class="section">
        <div class="container">
            <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 20px;">Key Features</h2>
            <p style="text-align: center; color: #666; margin-bottom: 60px; font-size: 1.1rem;">Everything you need for a successful ${industry} presence</p>
            
            <div class="features">
                <div class="feature">
                    <h3>Professional Design</h3>
                    <p>Clean, modern interface that builds trust and credibility with your ${industry} audience.</p>
                </div>
                <div class="feature">
                    <h3>Responsive Layout</h3>
                    <p>Looks perfect on all devices - desktop, tablet, and mobile. Your users will have a great experience everywhere.</p>
                </div>
                <div class="feature">
                    <h3>Industry Optimized</h3>
                    <p>Specifically designed for the ${industry} sector with relevant content and user experience patterns.</p>
                </div>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 ${title}. Built with AI-powered design technology.</p>
            <p style="margin-top: 10px; opacity: 0.8;">This is a fallback layout generated when the AI response needed correction.</p>
        </div>
    </footer>
</body>
</html>`;
};

module.exports = {
  buildPrompt,
  generateLayoutWithAI,
  buildColorPalettePrompt,
  generateColorPaletteWithAI,
  buildFontSuggestionsPrompt,
  generateFontSuggestionsWithAI,
  buildUXAuditPrompt,
  performUXAuditWithAI,
};
