import React, { useState } from 'react';
import { colorAPI, apiUtils } from '../services/api';
import { motion } from 'framer-motion';
import { 
  SwatchIcon, 
  EyeDropperIcon, 
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  InformationCircleIcon,
  EyeIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

const ColorPalette = () => {
  const [formData, setFormData] = useState({
    keywords: '',
    industry: '',
    mood: '',
    colorCount: 5,
    baseColor: '#3B82F6'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPalettes, setGeneratedPalettes] = useState([]);
  const [selectedPalette, setSelectedPalette] = useState(null);

  const moods = [
    'Professional', 'Playful', 'Calm', 'Energetic', 'Elegant',
    'Bold', 'Minimal', 'Warm', 'Cool'
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Entertainment', 'Travel', 'Food & Beverage', 'Fashion', 'Other'
  ];

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Helper function to convert RGB to HSL
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Contrast utilities
  const getLuminance = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const toLinear = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const r = toLinear(rgb.r);
    const g = toLinear(rgb.g);
    const b = toLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const getContrastRatio = (hex1, hex2) => {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const bright = Math.max(l1, l2);
    const dark = Math.min(l1, l2);
    return (bright + 0.05) / (dark + 0.05);
  };

  // Enhanced color processing function that handles multiple response formats
  const processApiResponse = (apiResponse) => {
    // Try to find colors in various possible locations
    const findColors = (data) => {
      // Check common paths where colors might be stored
      const possiblePaths = [
        data?.data?.aiPalette?.colors,
        data?.data?.colorPalette?.colors,
        data?.aiPalette?.colors,
        data?.colorPalette?.colors,
        data?.colors,
        data?.palette?.colors,
        data?.result?.colors,
        data // If data itself is an array of colors
      ];

      for (let i = 0; i < possiblePaths.length; i++) {
        const path = possiblePaths[i];
        if (path && (Array.isArray(path) || typeof path === 'object')) {
          return path;
        }
      }
      return null;
    };

    // Try to find the main palette object
    const findPaletteObject = (data) => {
      const possiblePaths = [
        data?.data?.aiPalette,
        data?.data?.colorPalette,
        data?.aiPalette,
        data?.colorPalette,
        data?.palette,
        data?.result,
        data
      ];

      for (let path of possiblePaths) {
        if (path && typeof path === 'object' && path !== null) {
          return path;
        }
      }
      return {};
    };

    const rawColors = findColors(apiResponse);
    const paletteObject = findPaletteObject(apiResponse);

    if (!rawColors) {
      return null;
    }

    // Process colors based on their format
    const processColors = (colorsData) => {
      let processedColors = [];

      if (Array.isArray(colorsData)) {
        // Handle array format
        processedColors = colorsData.map((color, index) => {
          if (typeof color === 'string') {
            // Simple hex string
            const rgb = hexToRgb(color);
            const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
            return {
              hex: color,
              name: `Color ${index + 1}`,
              usage: 'General use',
              rgb: rgb,
              hsl: hsl,
              index: index
            };
          } else if (color && typeof color === 'object') {
            // Object with color properties
            const hex = color.hex || color.color || color.value || '#000000';
            const rgb = color.rgb || hexToRgb(hex);
            const hsl = color.hsl || (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null);
            
            return {
              hex: hex,
              name: color.name || color.title || `Color ${index + 1}`,
              usage: color.usage || color.description || color.purpose || 'General use',
              rgb: rgb,
              hsl: hsl,
              index: index,
              ...(color.additional && { additional: color.additional })
            };
          }
          return null;
        }).filter(Boolean);
      } else if (colorsData && typeof colorsData === 'object') {
        // Handle object format (key-value pairs) - sort by importance
        const colorEntries = Object.entries(colorsData);
        
        // Sort colors by importance/role
        const rolePriority = {
          'primary': 1,
          'secondary': 2, 
          'accent': 3,
          'success': 4,
          'warning': 5,
          'error': 6,
          'info': 7,
          'neutral': 8,
          'text': 9,
          'background': 10,
          'border': 11,
          'disabled': 12
        };
        
        const sortedEntries = colorEntries.sort(([a], [b]) => {
          const aPriority = rolePriority[a] || 999;
          const bPriority = rolePriority[b] || 999;
          return aPriority - bPriority;
        });
        
        processedColors = sortedEntries
          .map(([key, color], index) => {
            if (!color) return null;
            
            let hex, name, usage;
            
            if (typeof color === 'string') {
              hex = color;
              name = key;
              usage = 'General use';
            } else if (typeof color === 'object') {
              hex = color.hex || color.color || color.value || '#000000';
              name = color.name || color.title || key;
              usage = color.usage || color.description || color.purpose || 'General use';
            } else {
              return null;
            }

            // Handle different RGB/HSL formats
            let rgb, hsl;
            if (color.rgb) {
              if (typeof color.rgb === 'string') {
                // Parse "rgb(255, 0, 0)" format
                const match = color.rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (match) {
                  rgb = { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
                } else {
                  rgb = hexToRgb(hex);
                }
              } else {
                rgb = color.rgb;
              }
            } else {
              rgb = hexToRgb(hex);
            }
            
            if (color.hsl) {
              if (typeof color.hsl === 'string') {
                // Parse "hsl(0, 100%, 50%)" format
                const match = color.hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                if (match) {
                  hsl = { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) };
                } else {
                  hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
                }
              } else {
                hsl = color.hsl;
              }
            } else {
              hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
            }

            return {
              hex: hex,
              name: name,
              usage: usage,
              rgb: rgb,
              hsl: hsl,
              key: key,
              index: index,
              role: key,
              ...(color.additional && { additional: color.additional })
            };
          })
          .filter(Boolean);
      }

      return processedColors;
    };

    let processedColors = processColors(rawColors);
    
    // Remove background and text colors from user-visible list
    processedColors = processedColors.filter(c => {
      const n = (c.name || '').toLowerCase();
      const k = (c.key || '').toLowerCase();
      return n !== 'background' && n !== 'text' && k !== 'background' && k !== 'text';
    });
    
    // Respect user requested count if provided
    const requestedCount = parseInt(formData.colorCount, 10) || null;
    if (requestedCount && processedColors.length > requestedCount) {
      processedColors = processedColors.slice(0, requestedCount);
    }
    
    // Compute per-color accessibility guidance
    processedColors = processedColors.map((c) => {
      const hex = c.hex;
      const contrastOnWhite = getContrastRatio(hex, '#FFFFFF');
      const contrastOnDark = getContrastRatio(hex, '#111827');
      const recommendedText = contrastOnWhite >= 4.5 ? 'dark' : (contrastOnDark >= 4.5 ? 'light' : (contrastOnWhite >= 3 ? 'dark-large' : 'light-large'));
      return {
        ...c,
        a11y: {
          contrastOnWhite: Number(contrastOnWhite.toFixed(2)),
          contrastOnDark: Number(contrastOnDark.toFixed(2)),
          recommendedText,
          lowContrastOnWhite: contrastOnWhite < 4.5,
          lowContrastOnDark: contrastOnDark < 4.5
        }
      };
    });
    
    // Fallback if no colors processed successfully
    if (processedColors.length === 0) {
      throw new Error('No colors could be processed from API response');
    }

    const hexArray = processedColors.map(c => c.hex);

    // Extract accessibility information with multiple fallback paths
    const getAccessibilityInfo = (data) => {
      const acc = data?.accessibility || data?.wcag || {};
      
      const level = acc.level || acc.wcagLevel || 
                   (acc.contrastRatio >= 7 ? 'AAA' : (acc.contrastRatio >= 4.5 ? 'AA' : 'A'));
      
      return {
        level: level,
        details: acc,
        contrastRatio: acc.contrastRatio || acc.contrast || 4.5,
        wcagCompliant: acc.wcagCompliant ?? acc.compliant ?? true,
        colorBlindSafe: acc.colorBlindSafe ?? acc.colorblindSafe ?? true,
        notes: acc.notes || acc.description || 'Accessibility compliance verified'
      };
    };

    // Extract gradients with enhanced fallback generation
    const getGradients = (data, colors) => {
      const gradients = data?.gradients || {};

      const createGradient = (from, to, deg = 135) => {
        const fromColor = typeof from === 'string' ? from : (from?.hex || colors[0]);
        const toColor = typeof to === 'string' ? to : (to?.hex || colors[1] || colors[0]);
        return `linear-gradient(${deg}deg, ${fromColor} 0%, ${toColor} 100%)`;
      };

      const lighten = (hex, amt = 20) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const clamp = (n) => Math.min(255, Math.max(0, n));
        const r = clamp(rgb.r + amt);
        const g = clamp(rgb.g + amt);
        const b = clamp(rgb.b + amt);
        return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
      };
      const darken = (hex, amt = 20) => lighten(hex, -amt);

      const mixHex = (hexA, hexB, t = 0.5) => {
        const a = hexToRgb(hexA); const b = hexToRgb(hexB);
        if (!a || !b) return hexA;
        const lerp = (x, y, p) => Math.round(x + (y - x) * p);
        const r = lerp(a.r, b.r, t);
        const g = lerp(a.g, b.g, t);
        const bch = lerp(a.b, b.b, t);
        return `#${[r, g, bch].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
      };
      const tint = (hex, p = 0.2) => mixHex(hex, '#FFFFFF', p);
      const shade = (hex, p = 0.2) => mixHex(hex, '#000000', p);

      const isMuddyCombo = (hexA, hexB) => {
        const a = hexToRgb(hexA); const b = hexToRgb(hexB);
        if (!a || !b) return false;
        const ahsl = rgbToHsl(a.r, a.g, a.b);
        const bhsl = rgbToHsl(b.r, b.g, b.b);
        const hueDiff = Math.min(Math.abs(ahsl.h - bhsl.h), 360 - Math.abs(ahsl.h - bhsl.h));
        return hueDiff > 140 && ahsl.s > 60 && bhsl.s > 60 && ahsl.l > 25 && ahsl.l < 70 && bhsl.l > 25 && bhsl.l < 70;
      };

      const safeLinear = (primary, secondary, deg = 135) => {
        const a = typeof primary === 'string' ? primary : (primary?.hex || colors[0]);
        const b = typeof secondary === 'string' ? secondary : (secondary?.hex || colors[1] || colors[0]);
        // If muddy between hues, use monochrome of A with mid stop
        if (isMuddyCombo(a, b)) {
          const aLight = tint(a, 0.35);
          const aDark = shade(a, 0.25);
          return `linear-gradient(${deg}deg, ${aLight} 0%, ${a} 50%, ${aDark} 100%)`;
        }
        // If very high contrast between hues, soften with white midpoint and tints
        const aRgb = hexToRgb(a); const bRgb = hexToRgb(b);
        if (aRgb && bRgb) {
          const ah = rgbToHsl(aRgb.r, aRgb.g, aRgb.b).h;
          const bh = rgbToHsl(bRgb.r, bRgb.g, bRgb.b).h;
          const d = Math.min(Math.abs(ah - bh), 360 - Math.abs(ah - bh));
          if (d > 120) {
            const aSoft = tint(a, 0.2);
            const bSoft = tint(b, 0.2);
            return `linear-gradient(${deg}deg, ${aSoft} 0%, ${'#FFFFFF'} 50%, ${bSoft} 100%)`;
          }
        }
        // Default: slightly soften endpoints to avoid dull middle
        return `linear-gradient(${deg}deg, ${tint(a, 0.1)} 0%, ${shade(b, 0.1)} 100%)`;
      };

      // Build each gradient with tailored heuristics
      const primaryA = colors[0];
      const primaryB = colors[1] || colors[0];
      const accentA = colors[2] || colors[1] || colors[0];
      const neutralEnd = colors[colors.length - 1] || '#F3F4F6';

      // Neutral: soften to light gray rather than deep brown/black
      const neutralLinear = `linear-gradient(180deg, #FFFFFF 0%, ${tint(neutralEnd, 0.8)} 100%)`;

      // Complementary: de-intensify by tinting both ends and change angle
      const compLinear = safeLinear(tint(primaryB, 0.15), tint(accentA, 0.15), 120);

      return {
        primary: gradients.primary || { linear: safeLinear(primaryA, primaryB) },
        accent: gradients.accent || { linear: safeLinear(accentA, primaryA) },
        neutral: gradients.neutral || { linear: neutralLinear },
        complementary: gradients.complementary || { linear: compLinear }
      };
    };

    // Build the final palette object
    const palette = {
      id: paletteObject?._id || paletteObject?.id || Date.now(),
      name: paletteObject?.name || paletteObject?.title || 'AI Generated Palette',
      description: paletteObject?.description || paletteObject?.summary || 'Auto-generated by AI based on your inputs',
      colors: processedColors,
      hexArray: hexArray,
      gradients: getGradients(paletteObject, hexArray),
      interactiveStates: paletteObject?.interactiveStates || paletteObject?.states || {},
      shadows: paletteObject?.shadows || {},
      mood: paletteObject?.mood || formData.mood || 'Professional',
      industry: paletteObject?.industry || formData.industry || 'General',
      paletteType: paletteObject?.paletteType || paletteObject?.type || 'custom',
      colorHarmony: paletteObject?.colorHarmony || paletteObject?.harmony || 'balanced',
      accessibility: getAccessibilityInfo(paletteObject),
      tags: paletteObject?.tags || [formData.industry || 'General', formData.mood || 'Professional'],
      metadata: {
        generated: new Date().toISOString(),
        source: 'AI',
        version: '1.0'
      },
      _raw: apiResponse // Keep original response for debugging
    };

    return palette;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generatePalette = async () => {
    setIsGenerating(true);
    try {
      const numColors = parseInt(formData.colorCount, 10) || 5;

      const baseLines = [
        `Generate a professional color palette for ${formData.industry || 'general'} industry.`,
        `Mood: ${formData.mood || 'professional'}.`,
        `Include exactly ${numColors} unique colors with distinct hex values.`,
        `Keywords: ${formData.keywords || 'modern, clean, accessible'}.`
      ];
      if (formData.baseColor) {
        baseLines.push(`Use ${formData.baseColor} as the primary color and create complementary colors.`);
      }
      baseLines.push('Ensure all colors are unique and include primary, secondary, accent, and neutral colors.');
      const prompt = baseLines.join('\n');

      const normalizeMood = (m) => {
        const map = {
          Professional: 'professional',
          Playful: 'playful',
          Calm: 'calm',
          Energetic: 'energetic',
          Elegant: 'elegant',
          Bold: 'bold',
          Minimal: 'minimal',
          Warm: 'warm',
          Cool: 'cool'
        };
        return map[m] || 'professional';
      };

      const normalizeIndustry = (i) => {
        const map = {
          Technology: 'technology',
          Healthcare: 'healthcare',
          Finance: 'finance',
          Education: 'education',
          Retail: 'retail',
          Entertainment: 'entertainment',
          Travel: 'travel',
          'Food & Beverage': 'food',
          Fashion: 'fashion',
          Other: 'other'
        };
        return map[i] || 'other';
      };

      // Try primary model from env, fallback to 2.5-flash if needed
      let data;
      const primaryModel = process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.5-pro';
      
      try {
        const response = await colorAPI.generate({
        prompt,
        mood: normalizeMood(formData.mood),
        industry: normalizeIndustry(formData.industry),
          paletteType: 'custom',
          baseColor: formData.baseColor,
          keywords: formData.keywords,
          colorCount: numColors,
          model: primaryModel
        });
        data = response.data; // Extract data from Axios response
      } catch (error) {
        console.warn(`Primary model ${primaryModel} failed, trying fallback:`, error.message);
        try {
          const fallbackResponse = await colorAPI.generate({
            prompt,
            mood: normalizeMood(formData.mood),
            industry: normalizeIndustry(formData.industry),
            paletteType: 'custom',
            baseColor: formData.baseColor,
            keywords: formData.keywords,
            colorCount: numColors,
            model: 'gemini-2.5-flash'
          });
          data = fallbackResponse.data; // Extract data from Axios response
        } catch (fallbackError) {
          console.error('Fallback model also failed:', fallbackError.message);
          throw fallbackError;
        }
      }

      
      // Check if we have the expected response structure
      if (!data || !data.data || !data.data.aiPalette) {
        throw new Error('Invalid API response structure - missing aiPalette');
      }

      const processedPalette = processApiResponse(data);
      
      if (processedPalette) {
        setGeneratedPalettes((prev) => [processedPalette, ...prev]);
      } else {
        throw new Error('Failed to process palette data from API response');
      }

    } catch (error) {
      const message = apiUtils.handleError(error);
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const likePalette = (paletteId) => {
    setGeneratedPalettes(prev => 
      prev.map(palette => 
        palette.id === paletteId 
          ? { ...palette, liked: !palette.liked }
          : palette
      )
    );
  };

  const copyColor = (colorData) => {
    const text = typeof colorData === 'string' ? colorData : colorData.hex;
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  const copyColorFormat = (colorData, format) => {
    let text = '';
    switch (format) {
      case 'hex':
        text = colorData.hex;
        break;
      case 'rgb':
        if (colorData.rgb) {
          text = `rgb(${colorData.rgb.r}, ${colorData.rgb.g}, ${colorData.rgb.b})`;
        }
        break;
      case 'hsl':
        if (colorData.hsl) {
          text = `hsl(${colorData.hsl.h}, ${colorData.hsl.s}%, ${colorData.hsl.l}%)`;
        }
        break;
      default:
        text = colorData.hex;
    }
    navigator.clipboard.writeText(text);
  };

  const ColorSwatch = ({ colorData, onClick, showDetails = false }) => {
    const color = typeof colorData === 'string' ? colorData : colorData.hex;
    const name = typeof colorData === 'string' ? null : colorData.name;
    const usage = typeof colorData === 'string' ? null : colorData.usage;
    
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group cursor-pointer"
        onClick={onClick}
      >
        <div 
          className="w-20 h-20 rounded-lg shadow-md border-2 border-white"
          style={{ backgroundColor: color }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
          <CheckIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
        {showDetails && name && (
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500 font-mono">{color}</p>
            {usage && (
              <p className="text-xs text-gray-600 mt-1">{usage}</p>
            )}
          </div>
        )}
        {!showDetails && name && (
          <p className="text-xs text-gray-600 mt-1 text-center">{name}</p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <SwatchIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Color Palette Generator</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create stunning color palettes with AI assistance. Generate harmonious color schemes 
            that perfectly match your brand and design goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Palette Settings</h2>
              
              <form className="space-y-6">
                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="e.g., ocean, sunset, forest, modern"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood
                  </label>
                  <select
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select mood</option>
                    {moods.map(mood => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                </div>

                {/* Color Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Colors
                  </label>
                  <select
                    name="colorCount"
                    value={formData.colorCount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={3}>3 Colors</option>
                    <option value={4}>4 Colors</option>
                    <option value={5}>5 Colors</option>
                    <option value={6}>6 Colors</option>
                    <option value={8}>8 Colors</option>
                  </select>
                </div>

                {/* Base Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Color (Optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      name="baseColor"
                      value={formData.baseColor}
                      onChange={handleInputChange}
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.baseColor}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={generatePalette}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SwatchIcon className="h-5 w-5 mr-2" />
                      Generate Palettes
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {generatedPalettes.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <SwatchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Palettes Generated Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Fill out the form and click "Generate Palettes" to get AI-powered color suggestions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <EyeDropperIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Smart Matching</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <CheckIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Accessibility</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <ArrowDownTrayIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Export Ready</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Generated Palettes ({generatedPalettes.length})
                  </h2>
                  <button
                    onClick={generatePalette}
                    disabled={isGenerating}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Generate More
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {generatedPalettes.map((palette) => (
                    <motion.div
                      key={palette.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {palette.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {palette.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                              {palette.accessibility.level}
                            </div>
                            <button
                              onClick={() => likePalette(palette.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                palette.liked 
                                  ? 'text-red-500 bg-red-50' 
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <HeartIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Enhanced Color Swatches */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-gray-700">Colors ({palette.colors.length}):</p>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => navigator.clipboard.writeText(palette.hexArray.join(', '))}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
                              >
                                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                                Copy All
                              </button>
                              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                                Export
                              </button>
                            </div>
                          </div>
                          
                          {/* One color per row: left swatch, right details */}
                          <div className="space-y-4 mb-4">
                            {palette.colors.map((colorData, index) => (
                              <div key={index} className="flex items-center gap-4 p-4 bg-white border rounded-lg">
                                <div className="w-20 h-20 rounded-lg shadow-sm border" style={{ backgroundColor: colorData.hex }} />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-base font-semibold text-gray-900">{colorData.name}</p>
                                      <p className="text-xs text-gray-500 max-w-2xl">{colorData.usage}</p>
                              </div>
                                    {/* contrast badges hidden as requested */}
                          </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <button onClick={() => copyColorFormat(colorData, 'hex')} className="text-[11px] px-2 py-1 bg-gray-100 rounded font-mono hover:bg-gray-200" title="Copy HEX">{colorData.hex}</button>
                                          {colorData.rgb && (
                                      <button onClick={() => copyColorFormat(colorData, 'rgb')} className="text-[11px] px-2 py-1 bg-gray-100 rounded font-mono hover:bg-gray-200" title="Copy RGB">{`rgb(${colorData.rgb.r}, ${colorData.rgb.g}, ${colorData.rgb.b})`}</button>
                                          )}
                                          {colorData.hsl && (
                                      <button onClick={() => copyColorFormat(colorData, 'hsl')} className="text-[11px] px-2 py-1 bg-gray-100 rounded font-mono hover:bg-gray-200" title="Copy HSL">{`hsl(${colorData.hsl.h}, ${colorData.hsl.s}%, ${colorData.hsl.l}%)`}</button>
                                          )}
                                        </div>
                            </div>
                          </div>
                            ))}
                          </div>

                          {/* Secondary details section removed as requested */}
                        </div>

                        {/* Enhanced Gradients */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-700">Gradients:</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(palette.gradients).map(([type, gradientData]) => (
                              <div key={type} className="border rounded-lg p-3">
                                <p className="text-xs text-gray-600 mb-2 capitalize">{type}</p>
                                <div 
                                  className="w-full h-16 rounded-md" 
                                  style={{ background: gradientData.linear }} 
                                />
                                <p className="text-[10px] text-gray-500 mt-2 font-mono break-all">
                                  {gradientData.linear}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Accessibility Preview (no hardcoded metrics, no green background) */}
                        <div className="mb-6">
                          <div className="rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              UI Preview
                            </h4>

                            {/* Dynamic accessibility preview */}
                          {(() => {
                              const colors = palette.colors;
                              if (!colors || colors.length === 0) return null;

                              // Helper to find a dark background candidate
                              const withL = colors.map(c => ({...c, _l: getLuminance(c.hex)})).sort((a,b) => a._l - b._l);
                              const bg = withL[0] || { hex: '#2B2B2B', name: 'Background' };

                              // Choose text based on contrast against bg
                              const darkHex = '#111827';
                              const lightHex = '#FFFFFF';
                              const textOnDark = getContrastRatio(lightHex, bg.hex) >= 4.5 ? lightHex : (getContrastRatio(darkHex, bg.hex) >= 4.5 ? darkHex : (getContrastRatio(lightHex, bg.hex) > getContrastRatio(darkHex, bg.hex) ? lightHex : darkHex));

                              const chipColors = colors.slice(0, Math.min(3, colors.length));

                              const chipText = (hex) => {
                                return getContrastRatio('#FFFFFF', hex) >= 4.5 ? '#FFFFFF' : '#111827';
                              };

                              const titleText = `${palette.name || 'Accessible Preview'}`;
                              const bodyText = `Legible text preview on ${bg.name || 'background'}.`;
                            
                            return (
                                <div className="mt-4 mx-auto w-full max-w-2xl rounded-xl p-4 shadow-sm overflow-hidden" style={{ backgroundColor: bg.hex, color: textOnDark }}>
                                  <p className="text-base font-semibold leading-6" style={{ color: textOnDark }}>{titleText}</p>
                                  <p className="text-sm opacity-90 mt-1" style={{ color: textOnDark }}>{bodyText}</p>
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {chipColors.map((c, i) => (
                                      <span key={`chip-${i}`} className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: c.hex, color: chipText(c.hex) }}>
                                        {c.name}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            );
                          })()}
                          </div>
                        </div>

                        {/* Palette Metadata removed per requirements */}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {palette.tags.map(tag => (
                            <span
                              key={tag}
                              className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Raw API Response hidden per requirements */}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                              <ShareIcon className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                            Use Palette
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ColorPalette; 