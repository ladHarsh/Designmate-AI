import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SparklesIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon,
  PhotoIcon,
  StarIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { layoutAPI } from "../services/api";
import LivePreview from "../components/LivePreview";

// Open source images for different layout types
const LAYOUT_IMAGES = {
  "landing-page":
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=center",
  dashboard:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=center",
  "e-commerce":
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=center",
  blog: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop&crop=center",
  portfolio:
    "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=center",
  "web-app":
    "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=center",
  other:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=center",
};

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&crop=center",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&crop=center",
];

const LayoutGenerator = () => {
  const [formData, setFormData] = useState({
    purpose: "",
    industry: "",
    style: "",
    components: [],
    colorScheme: "",
    description: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLayouts, setGeneratedLayouts] = useState([]);
  const [error, setError] = useState("");
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [rawGeminiResponse, setRawGeminiResponse] = useState("");

  // Rotate hero images
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Map of user-friendly labels to backend enum values for layoutType
  const purposes = [
    { label: "Landing Page", value: "landing-page" },
    { label: "Dashboard", value: "dashboard" },
    { label: "E-commerce", value: "e-commerce" },
    { label: "Blog", value: "blog" },
    { label: "Portfolio", value: "portfolio" },
    { label: "Web App", value: "web-app" },
    { label: "Other", value: "other" },
  ];

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Entertainment",
    "Travel",
    "Food & Beverage",
    "Fashion",
    "Real Estate",
  ];

  // Map of user-friendly labels to backend enum values for style
  const styles = [
    { label: "Minimalist", value: "minimalist" },
    { label: "Modern", value: "modern" },
    { label: "Vintage", value: "vintage" },
    { label: "Bold", value: "bold" },
    { label: "Playful", value: "playful" },
    { label: "Professional", value: "professional" },
    { label: "Creative", value: "creative" },
  ];

  const componentOptions = [
    "Header",
    "Navigation",
    "Hero Section",
    "Features",
    "Testimonials",
    "Pricing",
    "Contact Form",
    "Footer",
    "Sidebar",
    "Gallery",
    "Blog Posts",
    "Product Grid",
    "Search Bar",
    "Social Media",
    "Newsletter",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleComponentToggle = (component) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.includes(component)
        ? prev.components.filter((c) => c !== component)
        : [...prev.components, component],
    }));
  };

  const handleSelectAllComponents = () => {
    setFormData((prev) => ({
      ...prev,
      components:
        prev.components.length === componentOptions.length
          ? []
          : [...componentOptions],
    }));
  };

  const generateLayout = async () => {
    setIsGenerating(true);
    setError("");
    try {
      // Prepare the payload for the API
      const payload = {
        prompt:
          formData.description ||
          `${
            purposes.find((p) => p.value === formData.purpose)?.label || ""
          } for ${formData.industry}`,
        layoutType: formData.purpose,
        style: formData.style,
        description: formData.description,
        components: formData.components,
        colorScheme: formData.colorScheme,
        industry: formData.industry,
      };

      const response = await layoutAPI.generate(payload);
      // The API returns a single layout in response.data.data.layout
      const layout = response.data.data.layout;
      // Save the raw Gemini response for display/copy
      setRawGeminiResponse(response.data.data.rawGeminiResponse || "");

      // Check for validation warnings
      if (layout.validationWarnings && layout.validationWarnings.length > 0) {
        console.warn(
          "⚠️ Layout validation warnings:",
          layout.validationWarnings
        );
      }

      if (layout.isFallback) {
        // Fallback layout is being used
      }

      // Map the API response to the frontend format
      // Defensive normalization: components may be strings or objects from AI
      const normalizeComponents = (comps) => {
        if (!Array.isArray(comps)) return [];
        return comps
          .map((c, idx) => {
            if (typeof c === "string") {
              return { type: c.toLowerCase().replace(/\s+/g, "-"), props: {} };
            }
            if (c && typeof c === "object") {
              return {
                type: c.type || c.name || c.component || `component-${idx}`,
                props: c.props || c.properties || c.attributes || {},
              };
            }
            return null;
          })
          .filter(Boolean);
      };

      const processedLayout = {
        id: layout._id || layout.id,
        name: layout.title || layout.layoutType || "Generated Layout",
        description: layout.description,
        preview: "", // You can add a preview if available
        components: normalizeComponents(layout.components || []),
        score: layout.rating?.average || 9.0,
        tags: layout.tags || [],
        ...layout,
      };

      setGeneratedLayouts([processedLayout]);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate layout. Please try again."
      );
      setGeneratedLayouts([]);
      setRawGeminiResponse("");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section with Dynamic Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            key={currentHeroImage}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1 }}
            src={HERO_IMAGES[currentHeroImage]}
            alt="Design inspiration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-blue-900/80 to-indigo-900/80"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl mr-4">
                <SparklesIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                AI Layout Generator
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Transform your ideas into stunning, professional layouts with the
              power of artificial intelligence. Create extraordinary designs in
              seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-white/80">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>AI-Powered Design</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>Professional Quality</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>Export Ready</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 sticky top-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mr-4 shadow-lg shadow-purple-200">
                  <PhotoIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Create Your Layout
                  </h2>
                  <p className="text-sm text-gray-500">
                    Fill in the details below
                  </p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start"
                >
                  <svg
                    className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}

              <form className="space-y-6">
                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Purpose <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select purpose</option>
                    {purposes.map((purpose) => (
                      <option key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Style
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select style</option>
                    {styles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Components */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Required Components
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllComponents}
                      className="flex items-center text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      <Squares2X2Icon className="h-3.5 w-3.5 mr-1" />
                      {formData.components.length === componentOptions.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {componentOptions.map((component) => (
                      <label
                        key={component}
                        className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.components.includes(component)}
                          onChange={() => handleComponentToggle(component)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {component}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.components.length} components selected
                  </p>
                </div>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Scheme
                  </label>
                  <input
                    type="text"
                    name="colorScheme"
                    value={formData.colorScheme}
                    onChange={handleInputChange}
                    placeholder="e.g., Blue and white, Warm colors"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe any specific requirements..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={generateLayout}
                  disabled={
                    isGenerating || !formData.purpose || !formData.industry
                  }
                  className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-6 w-6 mr-3 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-6 w-6 mr-3" />
                      Generate Amazing Layouts
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {generatedLayouts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-3xl opacity-20"></div>
                  <DocumentTextIcon className="relative h-20 w-20 text-purple-600 mx-auto" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Ready to Create Something Amazing?
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Fill out the form and watch as AI transforms your ideas into
                  professional, stunning layouts that will captivate your
                  audience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
                    <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
                      <SparklesIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      AI-Powered
                    </h4>
                    <p className="text-sm text-gray-600">
                      Advanced algorithms create perfect layouts
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
                      <EyeIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Live Preview
                    </h4>
                    <p className="text-sm text-gray-600">
                      See your design come to life instantly
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="p-3 bg-indigo-100 rounded-xl w-fit mx-auto mb-4">
                      <CheckCircleIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Production Ready
                    </h4>
                    <p className="text-sm text-gray-600">
                      Use in your projects immediately
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Your Amazing Layouts
                    </h2>
                    <p className="text-gray-600">
                      Generated with AI precision ({generatedLayouts.length}{" "}
                      layout{generatedLayouts.length !== 1 ? "s" : ""})
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {/* Raw Gemini Response Panel */}
                  {rawGeminiResponse && (
                    <div className="mt-8">
                      <details className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                        <summary className="font-semibold cursor-pointer select-none text-blue-700">
                          View Code
                        </summary>
                        <div className="mt-4">
                          <pre
                            className="overflow-x-auto whitespace-pre-wrap text-xs max-h-96"
                            style={{ wordBreak: "break-all" }}
                          >
                            {rawGeminiResponse.length > 5000
                              ? rawGeminiResponse.slice(0, 5000) +
                                "\n... (truncated, copy to see full)"
                              : rawGeminiResponse}
                          </pre>
                          <button
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(rawGeminiResponse);
                            }}
                          >
                            Copy Full Response
                          </button>
                        </div>
                      </details>
                    </div>
                  )}
                  {generatedLayouts.map((layout) => (
                    <motion.div
                      key={layout.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
                    >
                      {/* Layout Preview with Real Image */}
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={
                            LAYOUT_IMAGES[layout.layoutType] ||
                            LAYOUT_IMAGES["other"]
                          }
                          alt={`${layout.layoutType} layout preview`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                            <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-semibold text-gray-900">
                              {layout.score}/10
                            </span>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                              {layout.layoutType?.replace("-", " ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Layout Info */}
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {layout.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                AI Generated
                              </div>
                              <div className="flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                <StarIcon className="h-4 w-4 mr-1" />
                                {layout.score}/10
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-6 leading-relaxed">
                          {layout.description}
                        </p>

                        {/* Layout Details */}
                        <div className="mb-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm text-gray-500">Type</div>
                              <div className="font-semibold text-gray-900 capitalize">
                                {layout.layoutType?.replace("-", " ")}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm text-gray-500">Style</div>
                              <div className="font-semibold text-gray-900 capitalize">
                                {layout.style}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm text-gray-500">
                                Industry
                              </div>
                              <div className="font-semibold text-gray-900">
                                {layout.industry}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm text-gray-500">
                                Components
                              </div>
                              <div className="font-semibold text-gray-900">
                                {layout.components?.length || 0}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Validation Warnings Display */}
                        {((layout.validationWarnings &&
                          layout.validationWarnings.length > 0) ||
                          layout.isFallback) && (
                          <div className="mb-6">
                            <div
                              className={`border rounded-lg p-4 ${
                                layout.isFallback
                                  ? "bg-orange-50 border-orange-200"
                                  : "bg-yellow-50 border-yellow-200"
                              }`}
                            >
                              <div className="flex items-center mb-2">
                                <div className="flex-shrink-0">
                                  <svg
                                    className={`h-5 w-5 ${
                                      layout.isFallback
                                        ? "text-orange-400"
                                        : "text-yellow-400"
                                    }`}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3
                                    className={`text-sm font-medium ${
                                      layout.isFallback
                                        ? "text-orange-800"
                                        : "text-yellow-800"
                                    }`}
                                  >
                                    {layout.isFallback
                                      ? "Using Fallback Layout"
                                      : "Validation Warnings"}
                                  </h3>
                                </div>
                              </div>
                              <div
                                className={`mt-2 text-sm ${
                                  layout.isFallback
                                    ? "text-orange-700"
                                    : "text-yellow-700"
                                }`}
                              >
                                {layout.isFallback && (
                                  <p className="mb-2">
                                    <strong>Status:</strong> AI response had
                                    validation issues, using safe fallback
                                    layout.
                                  </p>
                                )}
                                {layout.validationWarnings &&
                                  layout.validationWarnings.length > 0 && (
                                    <>
                                      <p>
                                        <strong>Issues detected:</strong>
                                      </p>
                                      <ul className="list-disc list-inside ml-4">
                                        {layout.validationWarnings.map(
                                          (warning, idx) => (
                                            <li key={idx}>{warning}</li>
                                          )
                                        )}
                                      </ul>
                                    </>
                                  )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions Section */}
                        <div className="pt-4 border-t border-gray-100">
                          <LivePreview layout={layout} />
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
    </div>
  );
};

export default LayoutGenerator;
