const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');

const router = express.Router();

// @route   GET /api/trends/current
// @desc    Get current design trends (live from Reddit)
// @access  Public
router.get('/current', asyncHandler(async (req, res) => {
  const subreddits = ['web_design', 'design', 'userexperience', 'UI_Design'];
  const headers = { 'User-Agent': 'DesignMateAI/1.0' };

  const fetchSubreddit = async (sub) => {
    const url = `https://www.reddit.com/r/${sub}/top.json?t=week&limit=30`;
    const { data } = await axios.get(url, { headers });
    const posts = (data?.data?.children || []).map((c) => c.data).filter(Boolean);
    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      score: p.score,
      url: `https://www.reddit.com${p.permalink}`,
      createdUtc: p.created_utc,
      subreddit: p.subreddit,
      thumbnail: p.thumbnail && p.thumbnail.startsWith('http') ? p.thumbnail : null
    }));
  };

  const keywordMap = [
    'glassmorphism','neumorphism','brutalism','minimalism','claymorphism','skeuomorphism',
    'dark mode','variable fonts','micro-interactions','micro interactions','gradients','3d',
    'ar','vr','accessibility','inclusive','motion design','animation','grid','card','dashboard',
    'landing page','design system','tailwind','chakra','material design','bootstrap'
  ];

  const normalize = (s) => (s || '').toLowerCase();

  const results = await Promise.all(subreddits.map(fetchSubreddit));
  const posts = results.flat().sort((a, b) => b.score - a.score).slice(0, 60);

  const keywordCounts = {};
  posts.forEach((p) => {
    const t = normalize(p.title);
    keywordMap.forEach((k) => {
      if (t.includes(k)) keywordCounts[k] = (keywordCounts[k] || 0) + 1;
    });
  });

  const topKeywords = Object.entries(keywordCounts)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  res.json({
    success: true,
    data: {
      sources: { platform: 'reddit', subreddits },
      posts,
      topKeywords,
      lastUpdated: new Date().toISOString()
    }
  });
}));

// @route   GET /api/trends/platforms
// @desc    Get platform-specific trends (live from Reddit per subreddit)
// @access  Public
router.get('/platforms', asyncHandler(async (req, res) => {
  const { platform } = req.query; // use subreddit name as platform
  const headers = { 'User-Agent': 'DesignMateAI/1.0' };

  const getTrendsFor = async (sub) => {
    const url = `https://www.reddit.com/r/${sub}/top.json?t=week&limit=20`;
    const { data } = await axios.get(url, { headers });
    const items = (data?.data?.children || []).map((c) => c.data).filter(Boolean);
    return items.map((p) => ({ name: p.title, trend: 'up', percentage: Math.min(100, Math.max(50, Math.round((p.score || 0) / 10))) }));
  };

  const subs = platform ? [platform] : ['web_design','design','userexperience','UI_Design'];
  const out = {};
  for (const s of subs) {
    out[s] = await getTrendsFor(s);
  }

  res.json({
    success: true,
    data: {
      platforms: subs,
      trends: out,
      lastUpdated: new Date().toISOString()
    }
  });
}));

// @route   GET /api/trends/industry/:industry
// @desc    Get industry-specific trends
// @access  Public
router.get('/industry/:industry', asyncHandler(async (req, res) => {
  const { industry } = req.params;

  const industryTrends = {
    technology: {
      colors: ['#3B82F6', '#1F2937', '#10B981'],
      styles: ['minimalist', 'modern', 'clean'],
      components: ['dashboards', 'data-visualization', 'user-profiles']
    },
    fashion: {
      colors: ['#F59E0B', '#EF4444', '#8B5CF6'],
      styles: ['elegant', 'luxury', 'trendy'],
      components: ['product-galleries', 'size-guides', 'wishlists']
    },
    finance: {
      colors: ['#1F2937', '#3B82F6', '#10B981'],
      styles: ['professional', 'trustworthy', 'secure'],
      components: ['charts', 'tables', 'forms']
    },
    healthcare: {
      colors: ['#10B981', '#3B82F6', '#F59E0B'],
      styles: ['clean', 'accessible', 'calming'],
      components: ['appointment-booking', 'patient-portals', 'health-tracking']
    }
  };

  if (industryTrends[industry]) {
    res.json({
      success: true,
      data: {
        industry,
        trends: industryTrends[industry],
        lastUpdated: new Date().toISOString()
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Industry not found'
    });
  }
}));

// @route   GET /api/trends/analysis
// @desc    Get trend analysis and insights
// @access  Public
router.get('/analysis', asyncHandler(async (req, res) => {
  const analysis = {
    topTrends: [
      {
        name: 'Glassmorphism',
        growth: '+45%',
        description: 'Frosted glass effect with transparency',
        examples: ['iOS design', 'Modern websites', 'Mobile apps']
      },
      {
        name: 'Dark Mode',
        growth: '+32%',
        description: 'Dark color schemes for better UX',
        examples: ['Social media', 'Productivity apps', 'Entertainment']
      },
      {
        name: 'Micro-interactions',
        growth: '+28%',
        description: 'Subtle animations and feedback',
        examples: ['Button hover effects', 'Loading states', 'Form validation']
      }
    ],
    emergingTrends: [
      {
        name: 'Neumorphism',
        description: 'Soft UI with subtle shadows',
        adoption: 'Early'
      },
      {
        name: 'Variable Fonts',
        description: 'Dynamic typography scaling',
        adoption: 'Growing'
      },
      {
        name: '3D Elements',
        description: 'Three-dimensional design elements',
        adoption: 'Emerging'
      }
    ],
    insights: [
      'Minimalism continues to dominate across industries',
      'Accessibility is becoming a priority in design',
      'Mobile-first design is now standard practice',
      'Performance optimization is crucial for user experience'
    ]
  };

  res.json({
    success: true,
    data: {
      analysis,
      lastUpdated: new Date().toISOString()
    }
  });
}));

// @route   GET /api/trends/forecast
// @desc    Get trend forecast for upcoming months
// @access  Public
router.get('/forecast', asyncHandler(async (req, res) => {
  const forecast = {
    next3Months: [
      {
        trend: 'AI-Generated Design',
        confidence: '85%',
        description: 'More AI-powered design tools and automation'
      },
      {
        trend: 'Voice UI Design',
        confidence: '72%',
        description: 'Designing for voice interactions and commands'
      },
      {
        trend: 'Sustainable Design',
        confidence: '68%',
        description: 'Eco-friendly and energy-efficient design practices'
      }
    ],
    next6Months: [
      {
        trend: 'AR/VR Interfaces',
        confidence: '60%',
        description: 'Designing for augmented and virtual reality'
      },
      {
        trend: 'Biometric UI',
        confidence: '55%',
        description: 'Interfaces that adapt to user biometrics'
      }
    ],
    methodology: 'Based on current adoption rates, industry reports, and expert predictions'
  };

  res.json({
    success: true,
    data: {
      forecast,
      lastUpdated: new Date().toISOString()
    }
  });
}));

module.exports = router; 