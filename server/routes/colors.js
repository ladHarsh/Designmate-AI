const express = require("express");
const { auth, checkUsageLimit } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const ColorPalette = require("../models/ColorPalette");
const User = require("../models/User");
const {
  generateColorPaletteWithAI,
  buildColorPalettePrompt,
} = require("../services/aiService");

const router = express.Router();

// @route   POST /api/colors/generate
// @desc    Generate color palette using AI
// @access  Private
router.post(
  "/generate",
  auth,
  checkUsageLimit("colorPalettesGenerated"),
  asyncHandler(async (req, res) => {
    const {
      prompt,
      mood,
      industry,
      paletteType,
      model = "gemini-2.5-flash",
      baseColor,
    } = req.body;

    if (!prompt || !mood) {
      return res.status(400).json({
        success: false,
        message: "Prompt and mood are required",
      });
    }

    try {
      // Helper function to map AI palette types to valid enum values
      const mapPaletteType = (aiPaletteType) => {
        const typeMapping = {
          digital: "complementary",
          modern: "complementary",
          retro: "analogous",
          vintage: "analogous",
          minimalist: "monochromatic",
          bold: "triadic",
          pastel: "analogous",
          neon: "split-complementary",
          earth: "analogous",
          ocean: "analogous",
          sunset: "analogous",
          corporate: "complementary",
          creative: "triadic",
          elegant: "complementary",
        };

        // Check if it's already a valid enum value
        const validTypes = [
          "monochromatic",
          "analogous",
          "complementary",
          "triadic",
          "tetradic",
          "split-complementary",
          "custom",
        ];
        if (validTypes.includes(aiPaletteType)) {
          return aiPaletteType;
        }

        // Map to valid type or default to 'custom'
        return typeMapping[aiPaletteType] || "custom";
      };

      // Generate color palette using AI
      const aiResponse = await generateColorPaletteWithAI({
        prompt,
        mood,
        industry: industry || "technology",
        paletteType: paletteType || "custom",
        model,
      });

      // If a baseColor is provided, synthesize gradients based on it (independent of AI)
      const toHex = (hex) => {
        if (!hex || typeof hex !== "string") return null;
        const v = hex.trim();
        return v.startsWith("#") ? v : `#${v}`;
      };
      const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
      const hexToRgb = (hex) => {
        const h = hex.replace("#", "");
        const bigint = parseInt(
          h.length === 3
            ? h
                .split("")
                .map((c) => c + c)
                .join("")
            : h,
          16
        );
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255,
        };
      };
      const rgbToHex = ({ r, g, b }) =>
        "#" +
        [r, g, b]
          .map((x) =>
            clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0")
          )
          .join("");
      const mix = (c1, c2, t) => ({
        r: c1.r + (c2.r - c1.r) * t,
        g: c1.g + (c2.g - c1.g) * t,
        b: c1.b + (c2.b - c1.b) * t,
      });
      const lighten = (hex, amt = 0.2) =>
        rgbToHex(mix(hexToRgb(hex), { r: 255, g: 255, b: 255 }, amt));
      const darken = (hex, amt = 0.2) =>
        rgbToHex(mix(hexToRgb(hex), { r: 0, g: 0, b: 0 }, amt));

      let gradientsFromBase = null;
      const base = toHex(baseColor);
      if (base) {
        const light = lighten(base, 0.25);
        const dark = darken(base, 0.25);
        gradientsFromBase = {
          primary: {
            linear: `linear-gradient(135deg, ${light} 0%, ${dark} 100%)`,
            radial: `radial-gradient(circle, ${light} 0%, ${dark} 100%)`,
            usage: "Hero, buttons",
          },
          accent: {
            linear: `linear-gradient(45deg, ${base} 0%, ${light} 100%)`,
            radial: `radial-gradient(ellipse, ${base} 0%, ${light} 100%)`,
            usage: "CTAs, highlights",
          },
          neutral: {
            linear: `linear-gradient(180deg, ${light} 0%, #FFFFFF 100%)`,
            usage: "Background overlays",
          },
          complementary: {
            linear: `linear-gradient(90deg, ${dark} 0%, ${
              aiResponse?.colors?.secondary?.hex || light
            } 100%)`,
            radial: `radial-gradient(circle, ${dark} 0%, ${
              aiResponse?.colors?.secondary?.hex || light
            } 100%)`,
            usage: "Headers, section dividers",
          },
          // Mixed gradients that combine user base color with AI primary/accent
          mix: {
            basePrimary: aiResponse?.colors?.primary?.hex
              ? {
                  linear: `linear-gradient(135deg, ${base} 0%, ${aiResponse.colors.primary.hex} 100%)`,
                  usage: "Base → AI primary",
                }
              : undefined,
            baseAccent: aiResponse?.colors?.accent?.hex
              ? {
                  linear: `linear-gradient(135deg, ${base} 0%, ${aiResponse.colors.accent.hex} 100%)`,
                  usage: "Base → AI accent",
                }
              : undefined,
          },
        };
      }

      // Create color palette in database using normalized AI response
      const colorPalette = await ColorPalette.create({
        user: req.user.id,
        name: aiResponse.name,
        description: aiResponse.description,
        prompt,
        colors: aiResponse.colors,
        gradients: gradientsFromBase
          ? { ...aiResponse.gradients, ...gradientsFromBase }
          : aiResponse.gradients,
        combinations: {
          baseAndAI: [
            base || null,
            aiResponse?.colors?.primary?.hex || null,
            aiResponse?.colors?.secondary?.hex || null,
            aiResponse?.colors?.accent?.hex || null,
          ].filter(Boolean),
        },
        paletteType:
          mapPaletteType(aiResponse.paletteType) ||
          mapPaletteType(paletteType) ||
          "custom",
        mood: aiResponse.mood || mood || "professional",
        industry: aiResponse.industry || industry || "other",
        accessibility: aiResponse.accessibility,
        usage: aiResponse.usage,
        tags: aiResponse.tags,
      });

      // Check accessibility
      await colorPalette.checkAccessibility();

      // Update user usage
      const user = await User.findById(req.user.id);
      user.usage.colorPalettesGenerated += 1;
      await user.save();

      res.status(201).json({
        success: true,
        message: "Color palette generated successfully",
        data: {
          // Return both: saved palette (constrained by schema) and the full normalized AI palette
          colorPalette,
          aiPalette: aiResponse,
        },
      });
    } catch (error) {
      console.error("Color palette generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate color palette. Please try again.",
      });
    }
  })
);

// @route   GET /api/colors/my-palettes
// @desc    Get user's color palettes
// @access  Private
router.get(
  "/my-palettes",
  auth,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, mood, industry } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (mood) filter.mood = mood;
    if (industry) filter.industry = industry;

    const colorPalettes = await ColorPalette.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name avatar");

    const total = await ColorPalette.countDocuments(filter);

    res.json({
      success: true,
      data: {
        colorPalettes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// @route   GET /api/colors/:id
// @desc    Get color palette by ID
// @access  Private
router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const colorPalette = await ColorPalette.findById(req.params.id).populate(
      "user",
      "name avatar profession"
    );

    if (!colorPalette) {
      return res.status(404).json({
        success: false,
        message: "Color palette not found",
      });
    }

    // Check if user can view this palette
    if (
      !colorPalette.isPublic &&
      colorPalette.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Increment views if not the owner
    if (colorPalette.user._id.toString() !== req.user.id) {
      await colorPalette.incrementViews();
    }

    res.json({
      success: true,
      data: {
        colorPalette,
      },
    });
  })
);

// @route   PUT /api/colors/:id
// @desc    Update color palette
// @access  Private
router.put(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const colorPalette = await ColorPalette.findById(req.params.id);

    if (!colorPalette) {
      return res.status(404).json({
        success: false,
        message: "Color palette not found",
      });
    }

    // Check ownership
    if (colorPalette.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { name, description, colors, isPublic, status } = req.body;

    // Update fields
    if (name) colorPalette.name = name;
    if (description) colorPalette.description = description;
    if (colors) colorPalette.colors = colors;
    if (typeof isPublic === "boolean") colorPalette.isPublic = isPublic;
    if (status) colorPalette.status = status;

    // Recheck accessibility if colors changed
    if (colors) {
      await colorPalette.checkAccessibility();
    }

    await colorPalette.save();

    res.json({
      success: true,
      message: "Color palette updated successfully",
      data: {
        colorPalette,
      },
    });
  })
);

// @route   DELETE /api/colors/:id
// @desc    Delete color palette
// @access  Private
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const colorPalette = await ColorPalette.findById(req.params.id);

    if (!colorPalette) {
      return res.status(404).json({
        success: false,
        message: "Color palette not found",
      });
    }

    // Check ownership
    if (colorPalette.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await colorPalette.remove();

    res.json({
      success: true,
      message: "Color palette deleted successfully",
    });
  })
);

// @route   POST /api/colors/:id/like
// @desc    Like/unlike color palette
// @access  Private
router.post(
  "/:id/like",
  auth,
  asyncHandler(async (req, res) => {
    const colorPalette = await ColorPalette.findById(req.params.id);

    if (!colorPalette) {
      return res.status(404).json({
        success: false,
        message: "Color palette not found",
      });
    }

    const isLiked = colorPalette.likes.includes(req.user.id);

    if (isLiked) {
      await colorPalette.removeLike(req.user.id);
    } else {
      await colorPalette.addLike(req.user.id);
    }

    res.json({
      success: true,
      message: isLiked ? "Color palette unliked" : "Color palette liked",
      data: {
        isLiked: !isLiked,
        likeCount: colorPalette.likes.length,
      },
    });
  })
);

// @route   GET /api/colors/explore/popular
// @desc    Get popular color palettes
// @access  Public
router.get(
  "/explore/popular",
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const colorPalettes = await ColorPalette.getPopular(parseInt(limit));

    res.json({
      success: true,
      data: {
        colorPalettes,
      },
    });
  })
);

// @route   GET /api/colors/explore/trending
// @desc    Get trending color palettes
// @access  Public
router.get(
  "/explore/trending",
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const colorPalettes = await ColorPalette.getTrending(parseInt(limit));

    res.json({
      success: true,
      data: {
        colorPalettes,
      },
    });
  })
);

// @route   GET /api/colors/explore/mood/:mood
// @desc    Get color palettes by mood
// @access  Public
router.get(
  "/explore/mood/:mood",
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const { mood } = req.params;

    const colorPalettes = await ColorPalette.getByMood(mood, parseInt(limit));

    res.json({
      success: true,
      data: {
        colorPalettes,
      },
    });
  })
);

// @route   GET /api/colors/explore/search
// @desc    Search color palettes
// @access  Public
router.get(
  "/explore/search",
  asyncHandler(async (req, res) => {
    const { q, mood, industry, paletteType, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isPublic: true, status: "published" };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    if (mood) filter.mood = mood;
    if (industry) filter.industry = industry;
    if (paletteType) filter.paletteType = paletteType;

    const colorPalettes = await ColorPalette.find(filter)
      .sort({ "rating.average": -1, views: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name avatar profession");

    const total = await ColorPalette.countDocuments(filter);

    res.json({
      success: true,
      data: {
        colorPalettes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// @route   GET /api/colors/trends
// @desc    Get color trends
// @access  Public
router.get(
  "/trends",
  asyncHandler(async (req, res) => {
    // Get trending colors from popular palettes
    const popularPalettes = await ColorPalette.find({
      isPublic: true,
      status: "published",
    })
      .sort({ views: -1, "rating.average": -1 })
      .limit(20);

    // Analyze color frequency
    const colorFrequency = {};
    popularPalettes.forEach((palette) => {
      const colors = palette.getAllColors();
      colors.forEach((color) => {
        const hex = color.hex;
        colorFrequency[hex] = (colorFrequency[hex] || 0) + 1;
      });
    });

    // Get top colors
    const trendingColors = Object.entries(colorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hex, count]) => ({ hex, count }));

    // Get trending moods
    const moodFrequency = {};
    popularPalettes.forEach((palette) => {
      moodFrequency[palette.mood] = (moodFrequency[palette.mood] || 0) + 1;
    });

    const trendingMoods = Object.entries(moodFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([mood, count]) => ({ mood, count }));

    res.json({
      success: true,
      data: {
        trendingColors,
        trendingMoods,
        totalPalettes: popularPalettes.length,
      },
    });
  })
);

// @route   POST /api/colors/:id/download
// @desc    Download color palette
// @access  Private
router.post(
  "/:id/download",
  auth,
  asyncHandler(async (req, res) => {
    const colorPalette = await ColorPalette.findById(req.params.id);

    if (!colorPalette) {
      return res.status(404).json({
        success: false,
        message: "Color palette not found",
      });
    }

    // Increment downloads
    await colorPalette.incrementDownloads();

    // Generate download data
    const downloadData = {
      palette: colorPalette.toObject(),
      formats: {
        css: generateCSSVariables(colorPalette),
        scss: generateSCSSVariables(colorPalette),
        json: colorPalette.colors,
        figma: generateFigmaColors(colorPalette),
      },
    };

    res.json({
      success: true,
      message: "Color palette downloaded successfully",
      data: {
        download: downloadData,
      },
    });
  })
);

// Helper functions for code generation
const generateCSSVariables = (colorPalette) => {
  const colors = colorPalette.colors;
  let css = ":root {\n";

  Object.entries(colors).forEach(([key, value]) => {
    if (value && value.hex) {
      css += `  --color-${key}: ${value.hex};\n`;
    }
  });

  css += "}";
  return css;
};

const generateSCSSVariables = (colorPalette) => {
  const colors = colorPalette.colors;
  let scss = "";

  Object.entries(colors).forEach(([key, value]) => {
    if (value && value.hex) {
      scss += `$${key}: ${value.hex};\n`;
    }
  });

  return scss;
};

const generateFigmaColors = (colorPalette) => {
  const colors = colorPalette.colors;
  const figmaColors = {};

  Object.entries(colors).forEach(([key, value]) => {
    if (value && value.hex) {
      figmaColors[key] = {
        name: key,
        color: value.hex,
        type: "SOLID",
      };
    }
  });

  return figmaColors;
};

module.exports = router;
