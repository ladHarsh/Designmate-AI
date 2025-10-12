import React, { useState } from "react";
import { fontAPI, apiUtils } from "../services/api";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const FontSuggestions = () => {
  const [formData, setFormData] = useState({
    projectType: "",
    industry: "",
    tone: "",
    targetAudience: "",
    description: "",
    includePairings: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuggestions, setGeneratedSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

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

  const tones = [
    "Professional",
    "Friendly",
    "Luxury",
    "Playful",
    "Serious",
    "Modern",
    "Classic",
    "Bold",
    "Elegant",
    "Casual",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const normalizeIndustry = (i) => {
        const map = {
          Technology: "technology",
          Healthcare: "healthcare",
          Finance: "finance",
          Education: "education",
          Retail: "retail",
          "Food & Beverage": "food",
          Travel: "travel",
          Fashion: "fashion",
          Entertainment: "entertainment",
          "Real Estate": "other",
        };
        return map[i] || "other";
      };

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

      const promptLines = [
        `Suggest 3-5 font recommendations${
          formData.includePairings ? " with pairings" : ""
        } for a ${formData.projectType || "design"} project.`,
        `Industry: ${formData.industry || "general"}.`,
        `Tone: ${formData.tone || "Professional"}.`,
        `Target audience: ${formData.targetAudience || "general"}.`,
        `Description: ${formData.description || "N/A"}.`,
        "Return a JSON array of suggestions with fields: name, description, primaryFont{name,category,weight,url}, secondaryFont{name,category,weight,url}, usage{headings,body,accents}, score(0-10), tags[array of strings].",
      ];
      const prompt = promptLines.join("\n");

      const { data } = await fontAPI.suggest({
        prompt,
        industry: normalizeIndustry(formData.industry),
        tone: normalizeTone(formData.tone),
        usage: usageFromProjectType(formData.projectType),
      });

      const raw = data?.data?.suggestions;

      const coerceToArray = (val) =>
        Array.isArray(val) ? val : val ? [val] : [];
      const safeStr = (s, d = "") =>
        typeof s === "string" && s.length ? s : d;

      const normalized = coerceToArray(raw).map((s, idx) => ({
        id: s.id || `${Date.now()}-${idx}`,
        name: safeStr(s.name, "Font Recommendation"),
        description: safeStr(
          s.description,
          "AI suggested typography based on your inputs"
        ),
        primaryFont: s.primaryFont || {
          name: "Inter",
          category: "Sans-serif",
          weight: "400, 500, 600, 700",
          url: "https://fonts.google.com/specimen/Inter",
        },
        secondaryFont: s.secondaryFont || {
          name: "Source Serif Pro",
          category: "Serif",
          weight: "400, 600",
          url: "https://fonts.google.com/specimen/Source+Serif+Pro",
        },
        usage: s.usage || {
          headings: "Inter (600, 700)",
          body: "Inter (400, 500)",
          accents: "Source Serif Pro (400, 600)",
        },
        score: typeof s.score === "number" ? s.score : 8.5,
        tags:
          Array.isArray(s.tags) && s.tags.length
            ? s.tags
            : [formData.tone || "Professional", formData.industry || "General"],
      }));

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
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
      <div className="space-y-2">
        <div
          className="text-2xl font-bold"
          style={{ fontFamily: font.name, fontWeight: 700 }}
        >
          {font.name}
        </div>
        <div
          className="text-lg"
          style={{ fontFamily: font.name, fontWeight: 500 }}
        >
          The quick brown fox jumps over the lazy dog
        </div>
        <div
          className="text-sm text-gray-600"
          style={{ fontFamily: font.name, fontWeight: 400 }}
        >
          {font.category} • Weights: {font.weight}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <DocumentTextIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Font Suggestions
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get intelligent font recommendations and perfect typography
            pairings. Our AI analyzes your project requirements to suggest fonts
            that enhance readability and brand appeal.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Project Details
              </h2>

              <form className="space-y-6">
                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select project type</option>
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Tone
                  </label>
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select tone</option>
                    {tones.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., Young professionals, 25-35"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe your project, brand personality, or specific requirements..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Include Pairings */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="includePairings"
                    checked={formData.includePairings}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Include font pairings
                  </label>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={generateSuggestions}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Generate Suggestions
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
            {generatedSuggestions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Suggestions Generated Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Fill out the form and click "Generate Suggestions" to get
                  AI-powered font recommendations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Smart Matching</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <EyeIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Live Preview</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <ArrowDownTrayIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Easy Integration</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
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

                <div className="space-y-6">
                  {generatedSuggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {suggestion.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {suggestion.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                              {suggestion.score}/10
                            </div>
                            <button
                              onClick={() => likeSuggestion(suggestion.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                suggestion.liked
                                  ? "text-red-500 bg-red-50"
                                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              }`}
                            >
                              <HeartIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Font Previews */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <FontPreview
                            font={suggestion.primaryFont}
                            label="Primary Font"
                          />
                          <FontPreview
                            font={suggestion.secondaryFont}
                            label="Secondary Font"
                          />
                        </div>

                        {/* Usage Guidelines */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Usage Guidelines:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <span className="font-medium text-blue-800">
                                Headings:
                              </span>
                              <p className="text-blue-700">
                                {suggestion.usage.headings}
                              </p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <span className="font-medium text-green-800">
                                Body Text:
                              </span>
                              <p className="text-green-700">
                                {suggestion.usage.body}
                              </p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <span className="font-medium text-purple-800">
                                Accents:
                              </span>
                              <p className="text-purple-700">
                                {suggestion.usage.accents}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {suggestion.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                              View on Google Fonts
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                              <ShareIcon className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                            Use Fonts
                          </button>
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

export default FontSuggestions;
