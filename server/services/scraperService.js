const axios = require('axios');
const cheerio = require('cheerio');

// Minimal extractor: fetch HTML, parse title/meta, guess colors/fonts
async function extractBrand({ domainUrl, socials = {} }) {
  const raw = {
    domain: domainUrl,
    site: { title: '', metaDescription: '', cssVariables: {}, fonts: { google: [], declared: [], fallbacks: [] }, textSamples: { headings: [], cta: [], taglines: [] }, images: [] },
    social: { twitter: {}, instagram: {}, linkedin: {} },
    uploads: {}
  };

  try {
    const { data: html } = await axios.get(domainUrl, { timeout: 15000, headers: { 'User-Agent': 'DesignMateBot/1.0 (+https://designmate.ai)' } });
    const $ = cheerio.load(html);

    raw.site.title = $('title').first().text() || '';
    raw.site.metaDescription = $('meta[name="description"]').attr('content') || '';

    // CSS variables from inline styles and :root blocks
    const styles = [];
    $('style').each((_, el) => styles.push($(el).html() || ''));
    const cssText = styles.join('\n');
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = varRegex.exec(cssText))) {
      raw.site.cssVariables[`--${match[1]}`] = String(match[2]).trim();
    }

    // Google Fonts links and declared font-families
    $('link[href*="fonts.googleapis"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) raw.site.fonts.google.push(href);
    });
    const fontFamilyRegex = /font-family\s*:\s*([^;]+);/gi;
    let ff;
    while ((ff = fontFamilyRegex.exec(cssText))) {
      raw.site.fonts.declared.push(ff[1].trim());
    }

    // Headings/CTA samples
    $('h1,h2,h3').slice(0, 6).each((_, el) => raw.site.textSamples.headings.push($(el).text().trim()));
    $('a,button').filter((_, el) => /get started|sign up|try|book|contact|learn/i.test($(el).text())).each((_, el) => raw.site.textSamples.cta.push($(el).text().trim()));

    // First hero-like image
    const img = $('img').first();
    if (img && img.attr('src')) {
      raw.site.images.push({ url: new URL(img.attr('src'), domainUrl).toString() });
    }
  } catch (e) {
    // Best-effort; continue with whatever we found
  }

  raw.social = { ...raw.social, twitter: { handle: socials.twitterHandle }, instagram: { handle: socials.instagramHandle }, linkedin: { handle: socials.linkedinHandle } };
  return raw;
}

module.exports = { extractBrand };


