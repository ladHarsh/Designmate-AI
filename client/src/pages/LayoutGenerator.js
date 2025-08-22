import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { layoutAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import html2canvas from 'html2canvas';
import LayoutRenderer from '../components/LayoutRenderer'; // Added import for LayoutRenderer

const LayoutGenerator = () => {
  const [formData, setFormData] = useState({
    purpose: '',
    industry: '',
    targetAudience: '',
    style: '',
    components: [],
    colorScheme: '',
    description: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLayouts, setGeneratedLayouts] = useState([]);
  const [error, setError] = useState('');

  const previewRef = useRef();

  // Map of user-friendly labels to backend enum values for layoutType
  const purposes = [
    { label: 'Landing Page', value: 'landing-page' },
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'E-commerce', value: 'e-commerce' },
    { label: 'Blog', value: 'blog' },
    { label: 'Portfolio', value: 'portfolio' },
    { label: 'Mobile App', value: 'mobile-app' },
    { label: 'Web App', value: 'web-app' },
    { label: 'Other', value: 'other' }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Entertainment', 'Travel', 'Food & Beverage', 'Fashion', 'Real Estate'
  ];

  // Map of user-friendly labels to backend enum values for style
  const styles = [
    { label: 'Minimalist', value: 'minimalist' },
    { label: 'Modern', value: 'modern' },
    { label: 'Vintage', value: 'vintage' },
    { label: 'Bold', value: 'bold' },
    { label: 'Playful', value: 'playful' },
    { label: 'Professional', value: 'professional' },
    { label: 'Creative', value: 'creative' }
  ];

  const componentOptions = [
    'Header', 'Navigation', 'Hero Section', 'Features', 'Testimonials',
    'Pricing', 'Contact Form', 'Footer', 'Sidebar', 'Gallery',
    'Blog Posts', 'Product Grid', 'Search Bar', 'Social Media', 'Newsletter'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleComponentToggle = (component) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.includes(component)
        ? prev.components.filter(c => c !== component)
        : [...prev.components, component]
    }));
  };

  const generateLayout = async () => {
    setIsGenerating(true);
    setError('');
    try {
      // Prepare the payload for the API
      const payload = {
        prompt: formData.description || `${purposes.find(p => p.value === formData.purpose)?.label || ''} for ${formData.industry} targeting ${formData.targetAudience}`,
        layoutType: formData.purpose, // already the correct enum value
        style: formData.style, // already the correct enum value
        description: formData.description,
        components: formData.components,
        colorScheme: formData.colorScheme,
        industry: formData.industry,
        targetAudience: formData.targetAudience
      };
      const response = await layoutAPI.generate(payload);
      console.log('Layout components:', response.data.data.layout.components);
      // The API returns a single layout in response.data.data.layout
      const layout = response.data.data.layout;
      // Map the API response to the frontend format
      setGeneratedLayouts([
        {
          id: layout._id || layout.id,
          name: layout.title || layout.layoutType || 'Generated Layout',
          description: layout.description,
          preview: '', // You can add a preview if available
          components: layout.components || [],
          score: layout.rating?.average || 9.0,
          tags: layout.tags || [],
          ...layout
        }
      ]);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        error.message ||
        'Failed to generate layout. Please try again.'
      );
      setGeneratedLayouts([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const likeLayout = (layoutId) => {
    setGeneratedLayouts(prev => 
      prev.map(layout => 
        layout.id === layoutId 
          ? { ...layout, liked: !layout.liked }
          : layout
      )
    );
  };

  const handleDownloadImage = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current);
      const link = document.createElement('a');
      link.download = 'layout-preview.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

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
            <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Layout Generator</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate intelligent layout suggestions powered by AI. Describe your project and get 
            optimized layout structures tailored to your needs.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Details</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <form className="space-y-6">
                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Purpose
                  </label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select purpose</option>
                    {purposes.map(purpose => (
                      <option key={purpose.value} value={purpose.value}>{purpose.label}</option>
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
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
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

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Style
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select style</option>
                    {styles.map(style => (
                      <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                  </select>
                </div>

                {/* Components */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Components
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {componentOptions.map(component => (
                      <label key={component} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.components.includes(component)}
                          onChange={() => handleComponentToggle(component)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{component}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Scheme Preference
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
                    Additional Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe any specific requirements or preferences..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={generateLayout}
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
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Generate Layouts
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
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Layouts Generated Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Fill out the form and click "Generate Layouts" to get AI-powered layout suggestions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <SparklesIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>AI-Powered</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <EyeIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Visual Preview</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <ArrowDownTrayIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Export Ready</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Generated Layouts ({generatedLayouts.length})
                  </h2>
                  <button
                    onClick={generateLayout}
                    disabled={isGenerating}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Generate More
                  </button>
                </div>
                <button
                  onClick={handleDownloadImage}
                  className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Download Layout as Image
                </button>
                <div ref={previewRef} className="grid grid-cols-1 gap-6">
                  {generatedLayouts.map((layout) => (
                    <motion.div
                      key={layout.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
                    >
                      {/* Layout Preview */}
                      <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        {/* Image preview removed (Vertex AI disabled) */}
                      </div>

                      {/* Layout Info */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {layout.name}
                          </h3>
                          <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                            {layout.score}/10
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">
                          {layout.description}
                        </p>

                        {/* Components */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Live Layout Preview:</p>
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <LayoutRenderer layoutSections={layout.components || []} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => likeLayout(layout.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                layout.liked 
                                  ? 'text-red-500 bg-red-50' 
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <HeartIcon className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                              <ShareIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                            Use Layout
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

export default LayoutGenerator; 