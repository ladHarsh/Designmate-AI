const express = require('express');
const { auth, checkUsageLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Layout = require('../models/Layout');
const User = require('../models/User');
const { generateLayoutWithAI } = require('../services/aiService');

const router = express.Router();

// @route   POST /api/layout/generate
// @desc    Generate layout using AI
// @access  Private
router.post('/generate', auth, checkUsageLimit('layoutsGenerated'), asyncHandler(async (req, res) => {
  const Joi = require('joi');
  const schema = Joi.object({
    prompt: Joi.string().allow('').optional(),
    layoutType: Joi.string().valid('landing-page','dashboard','e-commerce','blog','portfolio','mobile-app','web-app','other').required(),
    style: Joi.string().valid('minimalist','modern','vintage','bold','playful','professional','creative').default('modern'),
    description: Joi.string().allow('').max(500).optional(),
    components: Joi.array().items(Joi.string()).optional(),
    colorScheme: Joi.string().allow('').optional(),
    industry: Joi.string().allow('').optional(),
    targetAudience: Joi.string().allow('').optional()
  });

  const { value, error: validationError } = schema.validate(req.body, { stripUnknown: true });
  if (validationError) {
    console.error('❌ Backend: Validation error:', validationError.message);
    return res.status(400).json({ success: false, message: validationError.message });
  }

  const { prompt, layoutType, style, description, components, colorScheme, industry, targetAudience } = value;

  try {
    // Generate layout using AI
    const aiResponse = await generateLayoutWithAI({
      prompt,
      layoutType,
      style: style || 'modern',
      userPreferences: req.user.preferences,
      componentsRequired: components,
      colorScheme,
      industry,
      targetAudience
    });


    // Create layout in database
    // Defensive output validation of AI response
    const safeComponents = Array.isArray(aiResponse.components) ? aiResponse.components.filter(c =>
      c && typeof c.type === 'string' && typeof c.props === 'object'
    ) : [];

    const layout = await Layout.create({
      user: req.user.id,
      title: aiResponse.title || `Layout for ${layoutType}`,
      description: description || aiResponse.description,
      prompt,
      layoutType,
      style: style || 'modern',
      structure: aiResponse.structure || {},
      components: safeComponents,
      responsive: aiResponse.responsive || {},
      colors: aiResponse.colors || {},
      fonts: aiResponse.fonts || {},
      spacing: aiResponse.spacing || {},
      grid: aiResponse.grid || {},
      accessibility: aiResponse.accessibility || {},
      performance: aiResponse.performance || {},
      htmlCode: aiResponse.htmlCode || '',
      cssCode: aiResponse.cssCode || '',
      tags: Array.isArray(aiResponse.tags) ? aiResponse.tags : [],
      aiModel: aiResponse.aiModel || 'gemini-2.5-pro'
    });


    // Update user usage
    const user = await User.findById(req.user.id);
    user.usage.layoutsGenerated += 1;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Layout generated successfully',
      data: {
        layout
      }
    });
  } catch (error) {
    console.error('Layout generation error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate layout. Please try again.'
    });
  }
}));

// @route   GET /api/layout/my-layouts
// @desc    Get user's layouts
// @access  Private
router.get('/my-layouts', auth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, layoutType } = req.query;
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (status) filter.status = status;
  if (layoutType) filter.layoutType = layoutType;

  const layouts = await Layout.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name avatar');

  const total = await Layout.countDocuments(filter);

  res.json({
    success: true,
    data: {
      layouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/layout/:id
// @desc    Get layout by ID
// @access  Private
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const layout = await Layout.findById(req.params.id)
    .populate('user', 'name avatar profession');

  if (!layout) {
    return res.status(404).json({
      success: false,
      message: 'Layout not found'
    });
  }

  // Check if user can view this layout
  if (!layout.isPublic && layout.user._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Increment views if not the owner
  if (layout.user._id.toString() !== req.user.id) {
    await layout.incrementViews();
  }

  res.json({
    success: true,
    data: {
      layout
    }
  });
}));

// @route   PUT /api/layout/:id
// @desc    Update layout
// @access  Private
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const layout = await Layout.findById(req.params.id);

  if (!layout) {
    return res.status(404).json({
      success: false,
      message: 'Layout not found'
    });
  }

  // Check ownership
  if (layout.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const { title, description, structure, components, colors, fonts, isPublic, status } = req.body;

  // Update fields
  if (title) layout.title = title;
  if (description) layout.description = description;
  if (structure) layout.structure = structure;
  if (components) layout.components = components;
  if (colors) layout.colors = colors;
  if (fonts) layout.fonts = fonts;
  if (typeof isPublic === 'boolean') layout.isPublic = isPublic;
  if (status) layout.status = status;

  await layout.save();

  res.json({
    success: true,
    message: 'Layout updated successfully',
    data: {
      layout
    }
  });
}));

// @route   DELETE /api/layout/:id
// @desc    Delete layout
// @access  Private
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const layout = await Layout.findById(req.params.id);

  if (!layout) {
    return res.status(404).json({
      success: false,
      message: 'Layout not found'
    });
  }

  // Check ownership
  if (layout.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await layout.remove();

  res.json({
    success: true,
    message: 'Layout deleted successfully'
  });
}));

// @route   POST /api/layout/:id/like
// @desc    Like/unlike layout
// @access  Private
router.post('/:id/like', auth, asyncHandler(async (req, res) => {
  const layout = await Layout.findById(req.params.id);

  if (!layout) {
    return res.status(404).json({
      success: false,
      message: 'Layout not found'
    });
  }

  const isLiked = layout.likes.includes(req.user.id);

  if (isLiked) {
    await layout.removeLike(req.user.id);
  } else {
    await layout.addLike(req.user.id);
  }

  res.json({
    success: true,
    message: isLiked ? 'Layout unliked' : 'Layout liked',
    data: {
      isLiked: !isLiked,
      likeCount: layout.likes.length
    }
  });
}));

// @route   GET /api/layout/explore/popular
// @desc    Get popular layouts
// @access  Public
router.get('/explore/popular', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const layouts = await Layout.getPopular(parseInt(limit));

  res.json({
    success: true,
    data: {
      layouts
    }
  });
}));

// @route   GET /api/layout/explore/trending
// @desc    Get trending layouts
// @access  Public
router.get('/explore/trending', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const layouts = await Layout.getTrending(parseInt(limit));

  res.json({
    success: true,
    data: {
      layouts
    }
  });
}));

// @route   GET /api/layout/explore/search
// @desc    Search layouts
// @access  Public
router.get('/explore/search', asyncHandler(async (req, res) => {
  const { q, layoutType, style, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const filter = { isPublic: true, status: 'published' };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ];
  }

  if (layoutType) filter.layoutType = layoutType;
  if (style) filter.style = style;

  const layouts = await Layout.find(filter)
    .sort({ 'rating.average': -1, views: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name avatar profession');

  const total = await Layout.countDocuments(filter);

  res.json({
    success: true,
    data: {
      layouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   GET /api/layout/templates
// @desc    Get layout templates
// @access  Public
router.get('/templates', asyncHandler(async (req, res) => {
  const { layoutType, style } = req.query;

  const filter = { isPublic: true, status: 'published' };
  if (layoutType) filter.layoutType = layoutType;
  if (style) filter.style = style;

  const templates = await Layout.find(filter)
    .sort({ 'rating.average': -1, downloads: -1 })
    .limit(20)
    .populate('user', 'name avatar');

  res.json({
    success: true,
    data: {
      templates
    }
  });
}));

// @route   POST /api/layout/:id/download
// @desc    Download layout
// @access  Private
router.post('/:id/download', auth, asyncHandler(async (req, res) => {
  const layout = await Layout.findById(req.params.id);

  if (!layout) {
    return res.status(404).json({
      success: false,
      message: 'Layout not found'
    });
  }

  // Increment downloads
  await layout.incrementDownloads();

  // Generate download data (could include code snippets, assets, etc.)
  const downloadData = {
    layout: layout.toObject(),
    code: {
      html: generateHTML(layout),
      css: generateCSS(layout),
      js: generateJS(layout)
    },
    assets: layout.components.map(comp => comp.properties?.assets).filter(Boolean)
  };

  res.json({
    success: true,
    message: 'Layout downloaded successfully',
    data: {
      download: downloadData
    }
  });
}));

// Helper functions for code generation
const generateHTML = (layout) => {
  // Generate HTML structure based on layout
  return `<!-- Generated HTML for ${layout.title} -->`;
};

const generateCSS = (layout) => {
  // Generate CSS based on layout colors, fonts, spacing
  return `/* Generated CSS for ${layout.title} */`;
};

const generateJS = (layout) => {
  // Generate JavaScript for interactive components
  return `// Generated JS for ${layout.title}`;
};

module.exports = router; 