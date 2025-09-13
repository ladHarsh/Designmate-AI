const express = require('express');
const router = express.Router();

const BrandProfile = require('../models/BrandProfile');
const GeneratedSite = require('../models/GeneratedSite');
const scraperService = require('../services/scraperService');
const aiService = require('../services/aiService');

// Start analysis: scrape → analyze (Gemini) → generate (Gemini)
router.post('/analyze', async (req, res, next) => {
  try {
    const { domainUrl, instagramHandle, twitterHandle, linkedinHandle, overrides = {} } = req.body || {};
    if (!domainUrl) {
      return res.status(400).json({ success: false, message: 'domainUrl is required' });
    }

    // 1) Scrape/collect raw brand signals (minimal MVP extractor)
    const rawExtract = await scraperService.extractBrand({
      domainUrl,
      socials: { instagramHandle, twitterHandle, linkedinHandle }
    });

    // Apply client overrides if any
    if (overrides && typeof overrides === 'object') {
      rawExtract.overrides = overrides;
    }

    // 2) Analyze with Gemini → brandProfile
    const brandProfile = await aiService.analyzeBrand(rawExtract);

    // Persist brand profile
    const profileDoc = await BrandProfile.create({
      domain: domainUrl,
      rawExtract,
      profileJSON: brandProfile
    });

    // 3) Generate site with Gemini (HTML/CSS)
    const generatedSite = await aiService.generateSite(brandProfile);

    // Persist generated site, link to profile
    const siteDoc = await GeneratedSite.create({
      brandProfileId: profileDoc._id,
      html: generatedSite.html || generatedSite.htmlCode || '',
      css: generatedSite.css || generatedSite.cssCode || '',
      sections: generatedSite.sections || [],
      assets: generatedSite.assets || {}
    });

    return res.status(200).json({
      success: true,
      brandProfileId: profileDoc._id,
      generatedSiteId: siteDoc._id
    });
  } catch (err) {
    return next(err);
  }
});

// Preview generated HTML/CSS by id
router.get('/:id/preview', async (req, res, next) => {
  try {
    const site = await GeneratedSite.findById(req.params.id);
    if (!site) return res.status(404).json({ success: false, message: 'Generated site not found' });
    return res.status(200).json({ success: true, html: site.html, css: site.css, assets: site.assets || {} });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;


