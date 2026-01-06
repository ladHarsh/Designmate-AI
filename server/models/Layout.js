const mongoose = require("mongoose");

const layoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Layout title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    prompt: {
      type: String,
      required: [true, "Layout prompt is required"],
      trim: true,
    },
    layoutType: {
      type: String,
      enum: [
        "landing-page",
        "dashboard",
        "e-commerce",
        "blog",
        "portfolio",
        "mobile-app",
        "web-app",
        "other",
      ],
      required: true,
    },
    style: {
      type: String,
      enum: [
        "minimalist",
        "modern",
        "vintage",
        "bold",
        "playful",
        "professional",
        "creative",
      ],
      default: "modern",
    },
    structure: {
      header: {
        type: Object,
        default: {},
      },
      navigation: {
        type: Object,
        default: {},
      },
      main: {
        type: Object,
        default: {},
      },
      sidebar: {
        type: Object,
        default: {},
      },
      footer: {
        type: Object,
        default: {},
      },
    },
    components: [mongoose.Schema.Types.Mixed],
    responsive: {
      mobile: Object,
      tablet: Object,
      desktop: Object,
    },
    colors: {
      primary: String,
      secondary: String,
      accent: String,
      background: String,
      text: String,
    },
    fonts: {
      heading: String,
      body: String,
      accent: String,
    },
    spacing: {
      type: Object,
      default: {},
    },
    grid: {
      columns: Number,
      gap: String,
      breakpoints: Object,
    },
    accessibility: {
      contrastRatio: Number,
      colorBlindFriendly: Boolean,
      keyboardNavigation: Boolean,
      screenReaderFriendly: Boolean,
    },
    performance: {
      loadTime: Number,
      optimization: [String],
    },
    htmlCode: {
      type: String,
      default: "",
    },
    cssCode: {
      type: String,
      default: "",
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    },
    aiModel: {
      type: String,
      default: "gemini-2.5-flash",
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Layout",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
layoutSchema.index({ user: 1, createdAt: -1 });
layoutSchema.index({ layoutType: 1 });
layoutSchema.index({ style: 1 });
layoutSchema.index({ tags: 1 });
layoutSchema.index({ isPublic: 1, status: 1 });
layoutSchema.index({ "rating.average": -1 });
layoutSchema.index({ views: -1 });

// Virtual for like count
layoutSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for isLiked (to be populated)
layoutSchema.virtual("isLiked").get(function () {
  return false; // Will be set by controller
});

// Method to add like
layoutSchema.methods.addLike = function (userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
layoutSchema.methods.removeLike = function (userId) {
  this.likes = this.likes.filter((id) => id.toString() !== userId.toString());
  return this.save();
};

// Method to increment views
layoutSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Method to increment downloads
layoutSchema.methods.incrementDownloads = function () {
  this.downloads += 1;
  return this.save();
};

// Static method to get popular layouts
layoutSchema.statics.getPopular = function (limit = 10) {
  return this.find({ isPublic: true, status: "published" })
    .sort({ views: -1, "rating.average": -1 })
    .limit(limit)
    .populate("user", "name avatar");
};

// Static method to get trending layouts
layoutSchema.statics.getTrending = function (limit = 10) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return this.find({
    isPublic: true,
    status: "published",
    createdAt: { $gte: sevenDaysAgo },
  })
    .sort({ views: -1, likes: -1 })
    .limit(limit)
    .populate("user", "name avatar");
};

// Ensure virtual fields are serialized
layoutSchema.set("toJSON", { virtuals: true });
layoutSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Layout", layoutSchema);
