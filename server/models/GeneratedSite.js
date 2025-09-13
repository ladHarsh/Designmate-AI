const mongoose = require('mongoose');

const GeneratedSiteSchema = new mongoose.Schema({
  brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile', required: true },
  html: { type: String, default: '' },
  css: { type: String, default: '' },
  sections: { type: Array, default: [] },
  assets: { type: Object, default: {} },
  exportMeta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('GeneratedSite', GeneratedSiteSchema);


