const mongoose = require('mongoose');

const BrandProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  domain: { type: String, index: true, required: true },
  rawExtract: { type: Object, default: {} },
  profileJSON: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('BrandProfile', BrandProfileSchema);


