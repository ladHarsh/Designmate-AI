const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, asyncHandler(async (req, res) => {
  const { name, profession, experience, preferences } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update fields
  if (name) user.name = name;
  if (profession) user.profession = profession;
  if (experience) user.experience = experience;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   GET /api/users/usage
// @desc    Get user usage statistics
// @access  Private
router.get('/usage', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      usage: user.usage,
      subscription: user.subscription
    }
  });
}));

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get user's recent activity (this would typically come from activity logs)
  const recentActivity = [
    {
      type: 'layout_generated',
      title: 'Modern Dashboard Layout',
      timestamp: new Date().toISOString(),
      description: 'Generated a new layout for dashboard design'
    },
    {
      type: 'color_palette_created',
      title: 'Professional Color Scheme',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      description: 'Created a new color palette for tech industry'
    }
  ];

  // Get usage statistics
  const usageStats = {
    layoutsGenerated: user.usage.layoutsGenerated,
    colorPalettesGenerated: user.usage.colorPalettesGenerated,
    fontSuggestions: user.usage.fontSuggestions,
    auditsPerformed: user.usage.auditsPerformed,
    lastActive: user.usage.lastActive
  };

  // Get subscription info
  const subscription = {
    plan: user.subscription.plan,
    isActive: user.subscription.isActive,
    startDate: user.subscription.startDate,
    endDate: user.subscription.endDate
  };

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile(),
      recentActivity,
      usageStats,
      subscription
    }
  });
}));

// @route   GET /api/users/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const settings = {
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showUsageStats: true,
      allowAnalytics: true
    },
    preferences: user.preferences
  };

  res.json({
    success: true,
    data: {
      settings
    }
  });
}));

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, asyncHandler(async (req, res) => {
  const { notifications, privacy, preferences } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update preferences if provided
  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();
  }

  // In a real application, you would save notifications and privacy settings
  // to a separate settings collection or user document

  res.json({
    success: true,
    message: 'Settings updated successfully'
  });
}));

// Admin routes
// @route   GET /api/users/admin/all
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/admin/all', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.isActive = status === 'active';

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// @route   PUT /api/users/admin/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put('/admin/:id/role', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!['user', 'designer', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role'
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   PUT /api/users/admin/:id/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.put('/admin/:id/status', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: user.getPublicProfile()
    }
  });
}));

module.exports = router; 