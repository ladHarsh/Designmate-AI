const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { auth, checkUsageLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { performUXAuditWithAI, buildUXAuditPrompt } = require('../services/aiService');
const User = require('../models/User');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/audit/analyze
// @desc    Analyze uploaded design for UX issues
// @access  Private
router.post('/analyze', auth, checkUsageLimit('auditsPerformed'), upload.single('image'), asyncHandler(async (req, res) => {
  const { context, focusAreas, description, model = 'gemini-2.5-pro' } = req.body;

  if (!req.file && !description) {
    return res.status(400).json({
      success: false,
      message: 'Provide an image or a structured description for analysis'
    });
  }

  try {
    // Get image URL (in production, this would be uploaded to cloud storage)
    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : undefined;

    // Perform UX audit using AI
    const auditResult = await performUXAuditWithAI({
      imageUrl,
      description,
      context: context || 'general web application',
      focusAreas: focusAreas || ['all'],
      model
    });

    // Normalize audit result to ensure required fields exist
    const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const safeScore = (n, d = 0) => (typeof n === 'number' ? n : d);
    const safeIssues = (arr) => asArray(arr).filter(Boolean).map((i) => ({
      type: i?.type || 'info',
      title: i?.title || 'Issue',
      description: i?.description || '',
      severity: i?.severity || 'low',
      suggestion: i?.suggestion || ''
    }));

    const baseCategories = {
      overallScore: safeScore(auditResult?.overallScore, 75),
      summary: auditResult?.summary || 'AI-generated UX analysis',
      categories: {
        accessibility: {
          score: safeScore(auditResult?.categories?.accessibility?.score, auditResult?.accessibility?.score || 70),
          issues: safeIssues(auditResult?.categories?.accessibility?.issues || auditResult?.accessibility?.issues)
        },
        usability: {
          score: safeScore(auditResult?.categories?.usability?.score, auditResult?.usability?.score || 75),
          issues: safeIssues(auditResult?.categories?.usability?.issues || auditResult?.usability?.issues)
        },
        visualDesign: {
          score: safeScore(auditResult?.categories?.visualDesign?.score, auditResult?.visual?.score || 80),
          issues: safeIssues(auditResult?.categories?.visualDesign?.issues || auditResult?.visual?.issues)
        },
        performance: {
          score: safeScore(auditResult?.categories?.performance?.score, auditResult?.performance?.score || 75),
          issues: safeIssues(auditResult?.categories?.performance?.issues || auditResult?.performance?.issues)
        }
      },
      recommendations: asArray(auditResult?.recommendations)
    };

    // Optionally include additional categories if provided by AI
    if (auditResult?.categories?.contentClarity) {
      baseCategories.categories.contentClarity = {
        score: safeScore(auditResult.categories.contentClarity.score, 75),
        issues: safeIssues(auditResult.categories.contentClarity.issues)
      };
    }
    if (auditResult?.categories?.engagementFeedback) {
      baseCategories.categories.engagementFeedback = {
        score: safeScore(auditResult.categories.engagementFeedback.score, 75),
        issues: safeIssues(auditResult.categories.engagementFeedback.issues)
      };
    }
    const normalized = baseCategories;

    // Update user usage
    const user = await User.findById(req.user.id);
    user.usage.auditsPerformed += 1;
    await user.save();

    res.json({
      success: true,
      message: 'UX audit completed successfully',
      data: {
        audit: normalized,
        imageUrl
      }
    });
  } catch (error) {
    console.error('UX audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform UX audit. Please try again.'
    });
  }
}));

// @route   GET /api/audit/reports
// @desc    Get user's audit reports
// @access  Private
router.get('/reports', auth, asyncHandler(async (req, res) => {
  // This would typically fetch from an Audit model
  // For now, return mock data
  const reports = [
    {
      id: '1',
      title: 'Landing Page Analysis',
      imageUrl: '/uploads/sample-1.jpg',
      overallScore: 85,
      issues: 3,
      strengths: 5,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: {
      reports
    }
  });
}));

module.exports = router; 