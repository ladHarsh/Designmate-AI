const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Optional auth middleware for routes that can work with or without authentication
const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Subscription-based access control
const requireSubscription = (requiredPlan = "pro") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
      });
    }

    const planHierarchy = {
      free: 0,
      pro: 1,
      enterprise: 2,
    };

    const userPlanLevel = planHierarchy[req.user.subscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        success: false,
        message: `This feature requires a ${requiredPlan} subscription or higher.`,
      });
    }

    if (!req.user.subscription.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your subscription is not active. Please renew to continue.",
      });
    }

    next();
  };
};

// Usage limit middleware
const checkUsageLimit = (feature) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
      });
    }

    const limits = {
      free: {
        layoutsGenerated: 20,
        colorPalettesGenerated: 10,
        fontSuggestions: 15,
        auditsPerformed: 23,
      },
      pro: {
        layoutsGenerated: 100,
        colorPalettesGenerated: 200,
        fontSuggestions: 300,
        auditsPerformed: 50,
      },
      enterprise: {
        layoutsGenerated: -1, // Unlimited
        colorPalettesGenerated: -1,
        fontSuggestions: -1,
        auditsPerformed: -1,
      },
    };

    const userPlan = req.user.subscription.plan;
    const userLimits = limits[userPlan] || limits.free;
    const currentUsage = req.user.usage[feature] || 0;
    const limit = userLimits[feature];

    if (limit !== -1 && currentUsage >= limit) {
      return res.status(429).json({
        success: false,
        message: `You've reached your ${feature} limit for the ${userPlan} plan. Please upgrade to continue.`,
      });
    }

    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  requireSubscription,
  checkUsageLimit,
};
