const express = require('express');
const { auth, checkUsageLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const ColorPalette = require('../models/ColorPalette');
const User = require('../models/User');
const { generateColorPaletteWithAI } = require('../services/aiService');

const router = express.Router();

// @route   POST /api/colors/generate
// @desc    Generate color palette using AI
// @access  Private
router.post('/generate', auth, checkUsageLimit('colorPalettesGenerated'), asyncHandler(async (req, res) => {
  const { prompt, mood, industry, paletteType } = req.body;

  if (!prompt || !mood) {
    return res.status(400).json({
      success: false,
      message: 'Prompt and mood are required'
    });
  }

  try {
    // Generate color palette using AI
    const aiResponse = await generateColorPaletteWithAI({
      prompt,
      mood,
      industry: industry || 'other',
      paletteType: paletteType || 'custom'
    });

    // Fallbacks and normalization in case AI response is missing fields
    const capitalize = (s) => (typeof s === 'string' && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : 'Palette');
    const safeName = aiResponse?.name || `Palette - ${capitalize(mood)}`;
    const safeDescription = aiResponse?.description || 'AI generated color palette';

    // If AI returns an array of HEX values, map to schema-compatible structure
    const normalizedColors = Array.isArray(aiResponse?.colors)
      ? {
          neutral: aiResponse.colors
            .filter(Boolean)
            .map((hex) => ({ hex }))
        }
      : aiResponse?.colors || {};

    // Create color palette in database
    const colorPalette = await ColorPalette.create({
      user: req.user.id,
      name: safeName,
      description: safeDescription,
      prompt,
      colors: normalizedColors,
      paletteType: aiResponse.paletteType,
      mood,
      industry: industry || 'other',
      accessibility: aiResponse.accessibility,
      usage: aiResponse.usage,
      tags: aiResponse.tags || []
    });

    // Check accessibility
    await colorPalette.checkAccessibility();

    // Update user usage
    const user = await User.findById(req.user.id);
    user.usage.colorPalettesGenerated += 1;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Color palette generated successfully',
      data: {
        colorPalette
      }
    });
  } catch (error) {
    console.error('Color palette generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate color palette. Please try again.'
    });
  }
}));

// @route   GET /api/colors/my-palettes
// @desc    Get user's color palettes
// @access  Private
router.get('/my-palettes', auth, asyncHandler(async (req, res) => {
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
    .populate('user', 'name avatar');

  const total = await ColorPalette.countDocuments(filter);

  res.json({
    success: true,
    data: {
      colorPalettes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/colors/:id
// @desc    Get color palette by ID
// @access  Private
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const colorPalette = await ColorPalette.findById(req.params.id)
    .populate('user', 'name avatar profession');

  if (!colorPalette) {
    return res.status(404).json({
      success: false,
      message: 'Color palette not found'
    });
  }

  // Check if user can view this palette
  if (!colorPalette.isPublic && colorPalette.user._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Increment views if not the owner
  if (colorPalette.user._id.toString() !== req.user.id) {
    await colorPalette.incrementViews();
  }

  res.json({
    success: true,
    data: {
      colorPalette
    }
  });
}));

// @route   PUT /api/colors/:id
// @desc    Update color palette
// @access  Private
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const colorPalette = await ColorPalette.findById(req.params.id);

  if (!colorPalette) {
    return res.status(404).json({
      success: false,
      message: 'Color palette not found'
    });
  }

  // Check ownership
  if (colorPalette.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const { name, description, colors, isPublic, status } = req.body;

  // Update fields
  if (name) colorPalette.name = name;
  if (description) colorPalette.description = description;
  if (colors) colorPalette.colors = colors;
  if (typeof isPublic === 'boolean') colorPalette.isPublic = isPublic;
  if (status) colorPalette.status = status;

  // Recheck accessibility if colors changed
  if (colors) {
    await colorPalette.checkAccessibility();
  }

  await colorPalette.save();

  res.json({
    success: true,
    message: 'Color palette updated successfully',
    data: {
      colorPalette
    }
  });
}));

// @route   DELETE /api/colors/:id
// @desc    Delete color palette
// @access  Private
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const colorPalette = await ColorPalette.findById(req.params.id);

  if (!colorPalette) {
    return res.status(404).json({
      success: false,
      message: 'Color palette not found'
    });
  }

  // Check ownership
  if (colorPalette.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await colorPalette.remove();

  res.json({
    success: true,
    message: 'Color palette deleted successfully'
  });
}));

// @route   POST /api/colors/:id/like
// @desc    Like/unlike color palette
// @access  Private
router.post('/:id/like', auth, asyncHandler(async (req, res) => {
  const colorPalette = await ColorPalette.findById(req.params.id);

  if (!colorPalette) {
    return res.status(404).json({
      success: false,
      message: 'Color palette not found'
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
    message: isLiked ? 'Color palette unliked' : 'Color palette liked',
    data: {
      isLiked: !isLiked,
      likeCount: colorPalette.likes.length
    }
  });
}));

// @route   GET /api/colors/explore/popular
// @desc    Get popular color palettes
// @access  Public
router.get('/explore/popular', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const colorPalettes = await ColorPalette.getPopular(parseInt(limit));

  res.json({
    success: true,
    data: {
      colorPalettes
    }
  });
}));

// @route   GET /api/colors/explore/trending
// @desc    Get trending color palettes
// @access  Public
router.get('/explore/trending', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const colorPalettes = await ColorPalette.getTrending(parseInt(limit));

  res.json({
    success: true,
    data: {
      colorPalettes
    }
  });
}));

// @route   GET /api/colors/explore/mood/:mood
// @desc    Get color palettes by mood
// @access  Public
router.get('/explore/mood/:mood', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const { mood } = req.params;

  const colorPalettes = await ColorPalette.getByMood(mood, parseInt(limit));

  res.json({
    success: true,
    data: {
      colorPalettes
    }
  });
}));

// @route   GET /api/colors/explore/search
// @desc    Search color palettes
// @access  Public
router.get('/explore/search', asyncHandler(async (req, res) => {
  const { q, mood, industry, paletteType, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const filter = { isPublic: true, status: 'published' };

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ];
  }

  if (mood) filter.mood = mood;
  if (industry) filter.industry = industry;
  if (paletteType) filter.paletteType = paletteType;

  const colorPalettes = await ColorPalette.find(filter)
    .sort({ 'rating.average': -1, views: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name avatar profession');

  const total = await ColorPalette.countDocuments(filter);

  res.json({
    success: true,
    data: {
      colorPalettes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/colors/trends
// @desc    Get color trends
// @access  Public
router.get('/trends', asyncHandler(async (req, res) => {
  // Get trending colors from popular palettes
  const popularPalettes = await ColorPalette.find({ isPublic: true, status: 'published' })
    .sort({ views: -1, 'rating.average': -1 })
    .limit(20);

  // Analyze color frequency
  const colorFrequency = {};
  popularPalettes.forEach(palette => {
    const colors = palette.getAllColors();
    colors.forEach(color => {
      const hex = color.hex;
      colorFrequency[hex] = (colorFrequency[hex] || 0) + 1;
    });
  });

  // Get top colors
  const trendingColors = Object.entries(colorFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([hex, count]) => ({ hex, count }));

  // Get trending moods
  const moodFrequency = {};
  popularPalettes.forEach(palette => {
    moodFrequency[palette.mood] = (moodFrequency[palette.mood] || 0) + 1;
  });

  const trendingMoods = Object.entries(moodFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([mood, count]) => ({ mood, count }));

  res.json({
    success: true,
    data: {
      trendingColors,
      trendingMoods,
      totalPalettes: popularPalettes.length
    }
  });
}));

// @route   POST /api/colors/:id/download
// @desc    Download color palette
// @access  Private
router.post('/:id/download', auth, asyncHandler(async (req, res) => {
  const colorPalette = await ColorPalette.findById(req.params.id);

  if (!colorPalette) {
    return res.status(404).json({
      success: false,
      message: 'Color palette not found'
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
      figma: generateFigmaColors(colorPalette)
    }
  };

  res.json({
    success: true,
    message: 'Color palette downloaded successfully',
    data: {
      download: downloadData
    }
  });
}));

// Helper functions for code generation
const generateCSSVariables = (colorPalette) => {
  const colors = colorPalette.colors;
  let css = ':root {\n';
  
  Object.entries(colors).forEach(([key, value]) => {
    if (value && value.hex) {
      css += `  --color-${key}: ${value.hex};\n`;
    }
  });
  
  css += '}';
  return css;
};

const generateSCSSVariables = (colorPalette) => {
  const colors = colorPalette.colors;
  let scss = '';
  
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
        type: 'SOLID'
      };
    }
  });
  
  return figmaColors;
};

module.exports = router; 