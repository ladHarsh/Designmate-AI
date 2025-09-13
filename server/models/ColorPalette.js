const mongoose = require('mongoose');

const colorPaletteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Palette name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  prompt: {
    type: String,
    required: [true, 'Color prompt is required'],
    trim: true
  },
  colors: {
    primary: {
      hex: String,
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      hsl: {
        h: Number,
        s: Number,
        l: Number
      }
    },
    secondary: {
      hex: String,
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      hsl: {
        h: Number,
        s: Number,
        l: Number
      }
    },
    accent: {
      hex: String,
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      hsl: {
        h: Number,
        s: Number,
        l: Number
      }
    },
    neutral: [{
      hex: String,
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      hsl: {
        h: Number,
        s: Number,
        l: Number
      },
      name: String
    }],
    background: {
      hex: String,
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      hsl: {
        h: Number,
        s: Number,
        l: Number
      }
    },
    text: {
      hex: String,
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      hsl: {
        h: Number,
        s: Number,
        l: Number
      }
    }
  },
  gradients: {
    primary: {
      linear: String,
      radial: String,
      usage: String
    },
    accent: {
      linear: String,
      radial: String,
      usage: String
    },
    neutral: {
      linear: String,
      usage: String
    },
    glass: {
      backdrop: String,
      border: String,
      usage: String
    },
    mix: {
      basePrimary: {
        linear: String,
        usage: String
      },
      baseAccent: {
        linear: String,
        usage: String
      }
    },
    complementary: {
      linear: String,
      radial: String,
      usage: String
    }
  },
  combinations: {
    baseAndAI: [String]
  },
  paletteType: {
    type: String,
    enum: ['monochromatic', 'analogous', 'complementary', 'triadic', 'tetradic', 'split-complementary', 'custom'],
    default: 'custom'
  },
  mood: {
    type: String,
    enum: ['calm', 'energetic', 'professional', 'playful', 'elegant', 'bold', 'minimal', 'warm', 'cool'],
    required: true
  },
  industry: {
    type: String,
    enum: ['technology', 'healthcare', 'finance', 'education', 'retail', 'food', 'travel', 'fashion', 'entertainment', 'other'],
    default: 'other'
  },
  accessibility: {
    contrastRatio: {
      type: Number,
      min: 0,
      max: 21
    },
    wcagAA: {
      type: Boolean,
      default: false
    },
    wcagAAA: {
      type: Boolean,
      default: false
    },
    colorBlindFriendly: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    web: Boolean,
    mobile: Boolean,
    print: Boolean,
    branding: Boolean
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  aiModel: {
    type: String,
    default: 'gpt-4'
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ColorPalette'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
colorPaletteSchema.index({ user: 1, createdAt: -1 });
colorPaletteSchema.index({ paletteType: 1 });
colorPaletteSchema.index({ mood: 1 });
colorPaletteSchema.index({ industry: 1 });
colorPaletteSchema.index({ tags: 1 });
colorPaletteSchema.index({ isPublic: 1, status: 1 });
colorPaletteSchema.index({ 'rating.average': -1 });
colorPaletteSchema.index({ views: -1 });

// Virtual for like count
colorPaletteSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for isLiked (to be populated)
colorPaletteSchema.virtual('isLiked').get(function() {
  return false; // Will be set by controller
});

// Method to get all colors as array
colorPaletteSchema.methods.getAllColors = function() {
  const colors = [];
  if (this.colors.primary) colors.push({ ...this.colors.primary, role: 'primary' });
  if (this.colors.secondary) colors.push({ ...this.colors.secondary, role: 'secondary' });
  if (this.colors.accent) colors.push({ ...this.colors.accent, role: 'accent' });
  if (this.colors.background) colors.push({ ...this.colors.background, role: 'background' });
  if (this.colors.text) colors.push({ ...this.colors.text, role: 'text' });
  if (this.colors.neutral) colors.push(...this.colors.neutral.map(c => ({ ...c, role: 'neutral' })));
  return colors;
};

// Method to check accessibility
colorPaletteSchema.methods.checkAccessibility = function() {
  // This would implement actual accessibility checking logic
  const primary = this.colors.primary;
  const background = this.colors.background;
  
  if (primary && background) {
    // Calculate contrast ratio (simplified)
    const contrastRatio = this.calculateContrastRatio(primary.hex, background.hex);
    this.accessibility.contrastRatio = contrastRatio;
    this.accessibility.wcagAA = contrastRatio >= 4.5;
    this.accessibility.wcagAAA = contrastRatio >= 7;
  }
  
  return this.save();
};

// Method to calculate contrast ratio
colorPaletteSchema.methods.calculateContrastRatio = function(color1, color2) {
  // Simplified contrast ratio calculation
  // In a real implementation, this would use proper color science
  return 4.5; // Placeholder
};

// Method to add like
colorPaletteSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
colorPaletteSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to increment views
colorPaletteSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment downloads
colorPaletteSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

// Static method to get popular palettes
colorPaletteSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isPublic: true, status: 'published' })
    .sort({ views: -1, 'rating.average': -1 })
    .limit(limit)
    .populate('user', 'name avatar');
};

// Static method to get trending palettes
colorPaletteSchema.statics.getTrending = function(limit = 10) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return this.find({
    isPublic: true,
    status: 'published',
    createdAt: { $gte: sevenDaysAgo }
  })
    .sort({ views: -1, likes: -1 })
    .limit(limit)
    .populate('user', 'name avatar');
};

// Static method to get palettes by mood
colorPaletteSchema.statics.getByMood = function(mood, limit = 10) {
  return this.find({ 
    mood: mood, 
    isPublic: true, 
    status: 'published' 
  })
    .sort({ 'rating.average': -1, views: -1 })
    .limit(limit)
    .populate('user', 'name avatar');
};

// Ensure virtual fields are serialized
colorPaletteSchema.set('toJSON', { virtuals: true });
colorPaletteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ColorPalette', colorPaletteSchema); 