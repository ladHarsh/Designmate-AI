import React, { useState, useEffect } from "react";
import { fontAPI, apiUtils } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ArrowPathIcon,
  EyeIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const FontSuggestions = () => {
  const [formData, setFormData] = useState({
    // Essential fields (always visible)
    projectType: "",
    tone: "",
    // Advanced options
    includePairings: true,
    accessibilityLevel: "AA",
    brandPersonality: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuggestions, setGeneratedSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog"
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  const projectTypes = [
    "Website",
    "Mobile App",
    "Logo",
    "Print Design",
    "Brand Identity",
    "Marketing Materials",
    "UI/UX Design",
    "Typography",
    "Editorial",
  ];

  const tones = [
    {
      value: "Professional",
      description: "",
    },
    { value: "Modern", description: "" },
    { value: "Elegant", description: "" },
    { value: "Friendly", description: "" },
    { value: "Bold", description: "" },
    { value: "Creative", description: "" },
    { value: "Minimal", description: "" },
    { value: "Playful", description: "" },
    { value: "Luxury", description: "" },
    { value: "Classic", description: "" },
    { value: "Casual", description: "" },
    { value: "Serious", description: "" },
  ];

  const brandPersonalities = [
    "Innovative",
    "Trustworthy",
    "Dynamic",
    "Sophisticated",
    "Approachable",
    "Premium",
    "Reliable",
    "Creative",
    "Expert",
    "Caring",
    "Bold",
    "Sustainable",
  ];

  const accessibilityLevels = [
    { value: "A", description: "Basic accessibility compliance" },
    { value: "AA", description: "Standard accessibility (recommended)" },
    { value: "AAA", description: "Enhanced accessibility compliance" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBrandPersonalityToggle = (personality) => {
    setFormData((prev) => ({
      ...prev,
      brandPersonality: prev.brandPersonality.includes(personality)
        ? prev.brandPersonality.filter((p) => p !== personality)
        : [...prev.brandPersonality, personality],
    }));
  };

  const addToFavorites = (suggestionId) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(suggestionId)) {
        newFavorites.delete(suggestionId);
      } else {
        newFavorites.add(suggestionId);
      }
      return newFavorites;
    });
  };

  // Load fonts dynamically when selectedSuggestion changes
  useEffect(() => {
    if (selectedSuggestion) {
      const primaryFontName = selectedSuggestion.primaryFont.name.replace(
        / /g,
        "+"
      );
      const secondaryFontName = selectedSuggestion.secondaryFont.name.replace(
        / /g,
        "+"
      );

      // Create link element for Google Fonts
      const linkId = "dynamic-font-preview";
      let link = document.getElementById(linkId);

      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }

      // Load both fonts with multiple weights
      link.href = `https://fonts.googleapis.com/css2?family=${primaryFontName}:wght@300;400;500;600;700;800&family=${secondaryFontName}:wght@300;400;500;600;700;800&display=swap`;
    }

    // Cleanup function
    return () => {
      const link = document.getElementById("dynamic-font-preview");
      if (link && !selectedSuggestion) {
        link.remove();
      }
    };
  }, [selectedSuggestion]);

  const exportFontCSS = (suggestion) => {
    const cssContent =
      suggestion.implementation?.cssImport +
        "\n\n" +
        suggestion.implementation?.fontStack ||
      `/* Font CSS for ${
        suggestion.name
      } */\n@import url('https://fonts.googleapis.com/css2?family=${suggestion.primaryFont.name.replace(
        " ",
        "+"
      )}:wght@400;500;600;700&display=swap');`;

    const blob = new Blob([cssContent], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${suggestion.name
      .toLowerCase()
      .replace(/\s+/g, "-")}-fonts.css`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      // Simplified logic using only the fields we have in the clean form
      const normalizeTone = (t) => (t ? t.toLowerCase() : "professional");

      const usageFromProjectType = (p) => {
        const map = {
          Website: "web",
          "Mobile App": "mobile",
          "Print Design": "print",
          "Brand Identity": "branding",
          Logo: "branding",
          "Marketing Materials": "print",
          "UI/UX Design": "web",
          Typography: "web",
          Editorial: "print",
        };
        return map[p] || "web";
      };

      // Build prompt with available form data
      const promptLines = [
        `Create font recommendations for a ${
          formData.projectType || "design"
        } project with a ${formData.tone || "professional"} style.`,
        previewText
          ? `Use this sample text for testing: "${previewText}"`
          : "Use standard sample text for demonstration.",
        formData.brandPersonality.length > 0
          ? `Brand personality should reflect: ${formData.brandPersonality.join(
              ", "
            )}.`
          : "",
        formData.accessibilityLevel
          ? `Follow ${formData.accessibilityLevel} accessibility guidelines.`
          : "Ensure good readability and accessibility.",
        formData.includePairings
          ? "Include detailed font pairing suggestions with specific usage examples."
          : "Provide primary font recommendations.",
        "Focus on excellent readability, web performance, and modern design principles.",
      ].filter((line) => line.trim() !== "");

      const prompt = promptLines.join(" ");

      const { data } = await fontAPI.suggest({
        prompt,
        industry: "general", // Default industry since we removed the field from frontend
        tone: normalizeTone(formData.tone),
        usage: usageFromProjectType(formData.projectType),
        projectType: formData.projectType,
        accessibilityLevel: formData.accessibilityLevel,
        brandPersonality: formData.brandPersonality,
        includePairings: formData.includePairings,
        previewText:
          previewText || "The quick brown fox jumps over the lazy dog",
      });

      const raw = data?.data?.suggestions || data?.suggestions || data;

      const coerceToArray = (val) =>
        Array.isArray(val) ? val : val ? [val] : [];
      const safeStr = (s, d = "") =>
        typeof s === "string" && s.length ? s : d;

      // Process the actual API response data
      const normalized = coerceToArray(raw).map((s, idx) => {
        return {
          id: s.id || `${Date.now()}-${idx}`,
          name: safeStr(s.name || s.title, `Font Recommendation ${idx + 1}`),
          description: safeStr(
            s.description || s.summary,
            "AI generated font suggestion based on your requirements"
          ),
          primaryFont: s.primaryFont ||
            s.heading ||
            s.primary || {
              name: s.primaryFontName || "Inter",
              category: s.primaryFontCategory || "Sans-serif",
              weight: s.primaryFontWeight || "400, 500, 600, 700",
              url:
                s.primaryFontUrl || "https://fonts.google.com/specimen/Inter",
            },
          secondaryFont: s.secondaryFont ||
            s.body ||
            s.secondary || {
              name: s.secondaryFontName || "Source Sans Pro",
              category: s.secondaryFontCategory || "Sans-serif",
              weight: s.secondaryFontWeight || "400, 600",
              url:
                s.secondaryFontUrl ||
                "https://fonts.google.com/specimen/Source+Sans+Pro",
            },
          usage: s.usage || {
            headings:
              s.headingUsage ||
              `${
                s.primaryFont?.name || s.primaryFontName || "Inter"
              } (600, 700)`,
            body:
              s.bodyUsage ||
              `${
                s.primaryFont?.name || s.primaryFontName || "Inter"
              } (400, 500)`,
            accents:
              s.accentUsage ||
              `${
                s.secondaryFont?.name ||
                s.secondaryFontName ||
                "Source Sans Pro"
              } (400, 600)`,
          },
          score:
            typeof s.score === "number"
              ? s.score
              : typeof s.rating === "number"
              ? s.rating
              : 8.5,
          reasoning: safeStr(
            s.reasoning || s.rationale || s.explanation,
            "This font combination provides excellent readability and visual appeal for your project."
          ),
          bestFor: Array.isArray(s.bestFor)
            ? s.bestFor
            : Array.isArray(s.suitableFor)
            ? s.suitableFor
            : [
                formData.projectType || "Web design",
                "Professional applications",
              ],
          psychology: safeStr(
            s.psychology || s.psychologyImpact || s.brandImpact,
            "Creates a professional and trustworthy impression while maintaining readability."
          ),
          accessibility: s.accessibility || {
            contrastRatio: s.contrastRatio || "4.5:1 minimum",
            readability: s.readability || "Excellent readability",
            screenReader: s.screenReaderFriendly || "Screen reader friendly",
          },
          performance: s.performance || {
            loadTime: s.loadTime || "Fast loading",
            fileSize: s.fileSize || "Optimized",
            fallback: s.fallback || "System font fallbacks",
          },
          implementation: s.implementation || {
            cssImport:
              s.cssImport ||
              `@import url('https://fonts.googleapis.com/css2?family=${(
                s.primaryFont?.name ||
                s.primaryFontName ||
                "Inter"
              ).replace(/\s+/g, "+")}:wght@400;500;600;700&display=swap');`,
            fontStack:
              s.fontStack ||
              `font-family: '${
                s.primaryFont?.name || s.primaryFontName || "Inter"
              }', -apple-system, BlinkMacSystemFont, sans-serif;`,
          },
          tags:
            Array.isArray(s.tags) && s.tags.length
              ? s.tags
              : [
                  formData.tone || "Professional",
                  formData.projectType || "Web Design",
                  "accessible",
                  "optimized",
                ],
        };
      });

      setGeneratedSuggestions(normalized);
    } catch (error) {
      const message = apiUtils.handleError(error);
      console.error("Error generating suggestions:", message);
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const likeSuggestion = (suggestionId) => {
    setGeneratedSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.id === suggestionId
          ? { ...suggestion, liked: !suggestion.liked }
          : suggestion
      )
    );
  };

  const FontPreview = ({ font, label }) => (
    <div className="bg-white rounded-lg p-2 xs:p-4 border border-gray-200 flex flex-col h-full">
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-700">{label}</h4>
      </div>

      <div className="flex-1 space-y-3">
        <div
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: font.name, fontWeight: 700 }}
        >
          {font.name}
        </div>

        <div
          className="text-base text-gray-700"
          style={{ fontFamily: font.name, fontWeight: 400 }}
        >
          {previewText}
        </div>

        <div
          className="text-sm text-gray-500"
          style={{ fontFamily: font.name, fontWeight: 400 }}
        >
          {font.category} • {font.weight}
        </div>
      </div>

      <div className="mt-3 text-center">
        <a
          href={
            font.url ||
            `https://fonts.google.com/specimen/${font.name.replace(" ", "+")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-600 hover:text-purple-800"
        >
          View →
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 lg:px-8 py-2 xs:py-4 text-[12px] xs:text-sm">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden xs:block text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <DocumentTextIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl xs:text-4xl font-bold text-gray-900">
              Font Suggestions
            </h1>
          </div>
          <p className="hidden xs:block text-lg xs:text-xl text-gray-600 max-w-3xl mx-auto">
            Get AI-powered font recommendations for your projects. Choose your
            project type and style to get clean, modern font pairings with
            simple usage guidelines.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:col-span-1 ${
              generatedSuggestions.length > 0 ? "hidden lg:block" : ""
            }`}
          >
            <div className="bg-white rounded-2xl shadow-xl p-2 xs:p-4 sticky top-8">
              <h2 className="text-lg xs:text-xl font-bold text-gray-900 mb-3 xs:mb-4">
                Font Generator
              </h2>

              <form className="space-y-3 xs:space-y-4">
                {/* Project Type - Required Primary Field */}
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-2 xs:mb-3">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="w-full px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 text-xs xs:text-sm"
                  >
                    <option value="">What are you designing?</option>
                    {projectTypes.slice(0, 6).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tone - Style Buttons */}
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-2 xs:mb-3">
                    Desired Style <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-1 xs:gap-1.5 justify-items-start xs:justify-items-stretch">
                    {tones.slice(0, 6).map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            tone: tone.value,
                          }))
                        }
                        className={`w-full xs:w-auto px-1 xs:px-2 py-1 xs:py-2 rounded-md xs:rounded-lg text-[11px] xs:text-sm font-medium leading-tight flex items-center justify-center transition-colors whitespace-nowrap max-w-[120px] xs:max-w-full text-center ${
                          formData.tone === tone.value
                            ? "bg-purple-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {tone.value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Text - Optional Secondary Field */}
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-2 xs:mb-3">
                    Preview Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter custom preview text..."
                    className="w-full px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-xs xs:text-sm"
                  />
                </div>

                {/* Advanced Options */}
                <motion.button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center text-purple-600 hover:text-purple-700 font-medium text-xs xs:text-sm transition-colors mt-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronDownIcon
                    className={`h-4 w-4 mr-1 transition-transform ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                  />
                  Advanced Options
                </motion.button>

                {/* Advanced Options - Collapsible */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 xs:space-y-4 overflow-hidden bg-gray-50 p-2 xs:p-4 rounded-lg border border-gray-200"
                    >
                      {/* Accessibility Level */}
                      <div>
                        <label className="block text-xs xs:text-sm font-medium text-black mb-1">
                          Accessibility Standard
                        </label>
                        <select
                          name="accessibilityLevel"
                          value={formData.accessibilityLevel}
                          onChange={handleInputChange}
                          className="w-full px-2 xs:px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-xs xs:text-sm bg-white"
                        >
                          {accessibilityLevels.map((level) => (
                            <option
                              key={level.value}
                              value={level.value}
                              title={level.description}
                            >
                              WCAG {level.value} - {level.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="includePairings"
                            checked={formData.includePairings}
                            onChange={handleInputChange}
                            className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                          />
                          <label className="ml-2 text-xs xs:text-sm text-black">
                            Include detailed font pairings
                          </label>
                        </div>
                      </div>

                      {/* Brand Personality - Compact */}
                      <div>
                        <label className="block text-xs xs:text-sm text-black mb-2">
                          Brand Personality (Optional)
                        </label>
                        <div className="grid grid-cols-2 xs:flex xs:flex-wrap gap-1">
                          {brandPersonalities.slice(0, 8).map((personality) => (
                            <button
                              key={personality}
                              type="button"
                              onClick={() =>
                                handleBrandPersonalityToggle(personality)
                              }
                              className={`w-full xs:w-auto px-1.5 xs:px-2 py-1 xs:py-2 rounded-lg xs:rounded-xl text-[10px] xs:text-[11px] leading-tight flex items-center justify-center text-center ${
                                formData.brandPersonality.includes(personality)
                                  ? "bg-purple-600 text-white border border-purple-600"
                                  : "bg-white text-black border border-gray-300"
                              }`}
                            >
                              {personality}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generate Button */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={generateSuggestions}
                    disabled={
                      isGenerating || !formData.projectType || !formData.tone
                    }
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 xs:py-3 px-3 xs:px-5 rounded-xl font-bold text-sm xs:text-base hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isGenerating ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Creating Perfect Fonts...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Generate Font Suggestions
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      AI will analyze your needs and suggest the perfect
                      typography
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {generatedSuggestions.length === 0 ? (
              <div className="hidden xs:block bg-white rounded-2xl shadow-xl p-12 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Suggestions Generated Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Fill out the form and click "Generate Suggestions" to get
                  AI-powered font recommendations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Smart Matching</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <EyeIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Live Preview</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Font Suggestions ({generatedSuggestions.length})
                  </h2>
                  <button
                    onClick={generateSuggestions}
                    disabled={isGenerating}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Generate More
                  </button>
                </div>

                <div className="space-y-4">
                  {generatedSuggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
                    >
                      <div className="p-4">
                        <div className="mb-4">
                          <div className="grid grid-cols-[2fr_1fr] xs:grid-cols-2 items-start gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {suggestion.name}
                              </h3>
                            </div>
                            <div className="flex items-start justify-end space-x-3">
                              <div className="flex items-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {suggestion.score}/10
                              </div>

                              <div className="flex items-center space-x-1">
                                {suggestion.accessibility?.contrastRatio && (
                                  <div className="hidden xs:inline-flex bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                    {suggestion.accessibility.contrastRatio}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {suggestion.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center whitespace-nowrap bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Font Previews */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <FontPreview
                            font={suggestion.primaryFont}
                            label="Primary Font"
                            suggestion={suggestion}
                          />
                          <FontPreview
                            font={suggestion.secondaryFont}
                            label="Secondary Font"
                            suggestion={suggestion}
                          />
                        </div>

                        {/* Usage Guidelines */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            How to Use:
                          </h4>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">Headings:</span>{" "}
                                {suggestion.usage.headings}
                              </div>
                              <div>
                                <span className="font-medium">Body:</span>{" "}
                                {suggestion.usage.body}
                              </div>
                              <div>
                                <span className="font-medium">Accents:</span>{" "}
                                {suggestion.usage.accents}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CSS Code */}
                        {suggestion.implementation && (
                          <div className="mb-4 bg-gray-900 text-gray-100 rounded-lg p-3">
                            <h4 className="text-sm font-medium mb-2 text-green-400">
                              CSS Code
                            </h4>
                            <pre className="text-xs overflow-x-auto">
                              <code>
                                {suggestion.implementation.cssImport ||
                                  `@import url('https://fonts.googleapis.com/css2?family=${suggestion.primaryFont.name.replace(
                                    " ",
                                    "+"
                                  )}:wght@400;500;600;700&display=swap');`}
                              </code>
                            </pre>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`https://fonts.google.com/specimen/${suggestion.primaryFont.name.replace(
                                " ",
                                "+"
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center bg-white border border-purple-200 text-purple-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-50 transition-colors"
                            >
                              <EyeIcon className="hidden xs:inline h-4 w-4 xs:mr-1" />
                              <span className="xs:hidden">View Font</span>
                              <span className="hidden xs:inline">
                                View on Google Fonts
                              </span>
                            </a>
                            <button
                              onClick={() => setSelectedSuggestion(suggestion)}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors shadow-lg"
                            >
                              <span className="xs:hidden">Preview</span>
                              <span className="hidden xs:inline">
                                Preview Full
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {selectedSuggestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSuggestion(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-3 xs:px-6 py-2 xs:py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-sm xs:text-xl font-bold text-gray-900">
                {selectedSuggestion.name} - Full Preview
              </h3>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="p-1 xs:p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg
                  className="w-5 h-5 xs:w-6 xs:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-3 xs:p-6">
              {/* Large Typography Sample */}
              <div className="mb-4 xs:mb-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 xs:p-8">
                <h1
                  className="text-base xs:text-6xl font-bold mb-2 xs:mb-4 text-gray-900"
                  style={{
                    fontFamily: `'${selectedSuggestion.primaryFont.name}', sans-serif`,
                  }}
                >
                  {selectedSuggestion.name}
                </h1>
                <h2
                  className="text-xs xs:text-3xl font-semibold mb-2 xs:mb-4 text-gray-700"
                  style={{
                    fontFamily: `'${selectedSuggestion.secondaryFont.name}', serif`,
                  }}
                >
                  {selectedSuggestion.description ||
                    "Beautiful font pairings for modern design"}
                </h2>
                <p
                  className="text-[8px] xs:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
                  style={{
                    fontFamily: `'${selectedSuggestion.primaryFont.name}', sans-serif`,
                  }}
                >
                  {previewText ||
                    "The quick brown fox jumps over the lazy dog. This typography combination creates perfect harmony between readability and visual appeal, making your content both accessible and engaging for all users."}
                </p>
              </div>

              {/* Typography Scale */}
              <div className="grid grid-cols-2 gap-3 xs:gap-6 mb-4 xs:mb-8">
                <div className="space-y-2 xs:space-y-4">
                  <h4 className="text-xs xs:text-base font-semibold text-gray-900">
                    {selectedSuggestion.primaryFont.name} Scale
                  </h4>
                  {[48, 36, 24, 18, 16, 14].map((size) => (
                    <div
                      key={size}
                      className="flex items-center space-x-2 xs:space-x-4"
                    >
                      <span className="text-[10px] xs:text-sm text-gray-500 w-8 xs:w-12 flex-shrink-0">
                        {size}px
                      </span>
                      <div
                        style={{
                          fontFamily: `'${selectedSuggestion.primaryFont.name}', sans-serif`,
                          fontSize: `${size}px`,
                          lineHeight: 1.4,
                        }}
                        className="text-gray-900 truncate"
                      >
                        {previewText.split(" ").slice(0, 3).join(" ") ||
                          "Sample Text"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 xs:space-y-4">
                  <h4 className="text-xs xs:text-base font-semibold text-gray-900">
                    {selectedSuggestion.secondaryFont.name} Scale
                  </h4>
                  {[48, 36, 24, 18, 16, 14].map((size) => (
                    <div
                      key={size}
                      className="flex items-center space-x-2 xs:space-x-4"
                    >
                      <span className="text-[10px] xs:text-sm text-gray-500 w-8 xs:w-12 flex-shrink-0">
                        {size}px
                      </span>
                      <div
                        style={{
                          fontFamily: `'${selectedSuggestion.secondaryFont.name}', serif`,
                          fontSize: `${size}px`,
                          lineHeight: 1.4,
                        }}
                        className="text-gray-900 truncate"
                      >
                        {previewText.split(" ").slice(0, 3).join(" ") ||
                          "Sample Text"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementation Code */}
              <div className="bg-gray-900 text-gray-100 rounded-lg p-2 xs:p-4 mb-3 xs:mb-6">
                <h4 className="text-[10px] xs:text-sm font-semibold mb-2 xs:mb-3 text-green-400">
                  Complete CSS Implementation
                </h4>
                <pre className="text-[9px] xs:text-sm overflow-x-auto">
                  <code>{`/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=${selectedSuggestion.primaryFont.name.replace(
                    " ",
                    "+"
                  )}:wght@400;500;600;700&family=${selectedSuggestion.secondaryFont.name.replace(
                    " ",
                    "+"
                  )}:wght@400;500;600;700&display=swap');

/* CSS Variables */
:root {
  --font-primary: '${
    selectedSuggestion.primaryFont.name
  }', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-secondary: '${selectedSuggestion.secondaryFont.name}', Georgia, serif;
}

/* Typography Classes */
.heading-primary { font-family: var(--font-primary); font-weight: 700; }
.heading-secondary { font-family: var(--font-secondary); font-weight: 600; }
.body-text { font-family: var(--font-primary); font-weight: 400; line-height: 1.6; }
.accent-text { font-family: var(--font-secondary); font-weight: 500; }`}</code>
                </pre>
              </div>

              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
                <div className="text-[10px] xs:text-sm text-gray-600">
                  <strong>Best for:</strong>{" "}
                  {selectedSuggestion.bestFor?.join(", ") ||
                    "Various applications"}
                </div>
                <button
                  onClick={() => exportFontCSS(selectedSuggestion)}
                  className="bg-purple-600 text-white px-3 xs:px-6 py-1.5 xs:py-2 rounded-lg text-xs xs:text-sm font-semibold hover:bg-purple-700 transition-colors w-full xs:w-auto"
                >
                  Export CSS
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default FontSuggestions;
