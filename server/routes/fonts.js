const express = require('express');
const { auth, checkUsageLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateFontSuggestionsWithAI, buildFontSuggestionsPrompt } = require('../services/aiService');

const router = express.Router();

// @route   POST /api/fonts/suggest
// @desc    Generate font suggestions using AI
// @access  Private
router.post('/suggest', auth, checkUsageLimit('fontSuggestions'), asyncHandler(async (req, res) => {
  const { prompt, industry, tone, usage, model = 'gemini-2.5-pro' } = req.body;

  if (!prompt || !industry || !tone) {
    return res.status(400).json({
      success: false,
      message: 'Prompt, industry, and tone are required'
    });
  }

  try {
    // Generate font suggestions using AI
    const aiResponse = await generateFontSuggestionsWithAI({
      prompt,
      industry,
      tone,
      usage: usage || 'web',
      model
    });

    // Update user usage
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    user.usage.fontSuggestions += 1;
    await user.save();

    res.json({
      success: true,
      message: 'Font suggestions generated successfully',
      data: {
        suggestions: aiResponse
      }
    });
  } catch (error) {
    console.error('Font suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate font suggestions. Please try again.'
    });
  }
}));

// @route   GET /api/fonts/pairings
// @desc    Get font pairings
// @access  Public
router.get('/pairings', asyncHandler(async (req, res) => {
  const { industry, tone } = req.query;

  const pairings = [
    {
      name: 'Modern Professional',
      heading: 'Inter',
      body: 'Inter',
      description: 'Clean and modern for professional applications',
      industry: 'technology',
      tone: 'professional'
    },
    {
      name: 'Creative & Playful',
      heading: 'Poppins',
      body: 'Open Sans',
      description: 'Friendly and approachable for creative projects',
      industry: 'entertainment',
      tone: 'playful'
    },
    {
      name: 'Elegant & Sophisticated',
      heading: 'Playfair Display',
      body: 'Source Sans Pro',
      description: 'Classic and refined for luxury brands',
      industry: 'fashion',
      tone: 'elegant'
    }
  ];

  let filteredPairings = pairings;
  if (industry) {
    filteredPairings = filteredPairings.filter(p => p.industry === industry);
  }
  if (tone) {
    filteredPairings = filteredPairings.filter(p => p.tone === tone);
  }

  res.json({
    success: true,
    data: {
      pairings: filteredPairings
    }
  });
}));

// @route   GET /api/fonts/trends
// @desc    Get font trends
// @access  Public
router.get('/trends', asyncHandler(async (req, res) => {
  const trends = {
    popularFonts: [
      { name: 'Inter', category: 'Sans-serif', usage: 'high' },
      { name: 'Poppins', category: 'Sans-serif', usage: 'high' },
      { name: 'Open Sans', category: 'Sans-serif', usage: 'medium' },
      { name: 'Playfair Display', category: 'Serif', usage: 'medium' },
      { name: 'Roboto', category: 'Sans-serif', usage: 'medium' }
    ],
    trendingCategories: [
      { category: 'Sans-serif', percentage: 65 },
      { category: 'Serif', percentage: 20 },
      { category: 'Display', percentage: 10 },
      { category: 'Monospace', percentage: 5 }
    ],
    industryPreferences: {
      technology: ['Inter', 'Roboto', 'Open Sans'],
      fashion: ['Playfair Display', 'Lora', 'Merriweather'],
      finance: ['Inter', 'Source Sans Pro', 'Roboto'],
      education: ['Open Sans', 'Inter', 'Source Sans Pro']
    }
  };

  res.json({
    success: true,
    data: trends
  });
}));

module.exports = router; 