import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PhotoIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { layoutAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// html2canvas will be dynamically imported when needed
import LivePreview from '../components/LivePreview';

// Open source images for different layout types
const LAYOUT_IMAGES = {
  'landing-page': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=center',
  'dashboard': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=center',
  'e-commerce': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=center',
  'blog': 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop&crop=center',
  'portfolio': 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=center',
  'mobile-app': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop&crop=center',
  'web-app': 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=center',
  'other': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=center'
};

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&crop=center'
];

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
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const previewRef = useRef();

  // Rotate hero images
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      
      // Console log the payload being sent to the API
      console.log('🚀 Frontend: Starting layout generation...');
      console.log('📋 Frontend: Form data:', JSON.stringify(formData, null, 2));
      console.log('📦 Frontend: Payload being sent to API:', JSON.stringify(payload, null, 2));
      console.log('📝 Frontend: Generated prompt:', payload.prompt);
      console.log('🌐 Frontend: API URL:', process.env.REACT_APP_API_URL || '/api');
      console.log('📡 Frontend: Making POST request to /api/layout/generate');
      
      const response = await layoutAPI.generate(payload);
      console.log('✅ Frontend: API response received');
      console.log('📊 Frontend: Response status:', response.status);
      console.log('📄 Frontend: Response data structure:', Object.keys(response.data));
      console.log('🎨 Frontend: Layout components:', response.data.data.layout.components);
      console.log('🔍 Frontend: Full response data:', JSON.stringify(response.data, null, 2));
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
      console.error('❌ Frontend: Error occurred during layout generation');
      console.error('🔍 Frontend: Error details:', error);
      console.error('📊 Frontend: Error response:', error.response?.data);
      console.error('🌐 Frontend: Error status:', error.response?.status);
      console.error('📡 Frontend: Error config:', error.config);
      
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
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(previewRef.current);
      const link = document.createElement('a');
      link.download = 'layout-preview.png';
      link.href = canvas.toDataURL();
      link.click();
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
              Transform your ideas into stunning, professional layouts with the power of artificial intelligence. 
              Create extraordinary designs in seconds.
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
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mr-3">
                  <PhotoIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
              </div>
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
                  Fill out the form and watch as AI transforms your ideas into professional, 
                  stunning layouts that will captivate your audience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
                    <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
                      <SparklesIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI-Powered</h4>
                    <p className="text-sm text-gray-600">Advanced algorithms create perfect layouts</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
                      <EyeIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Live Preview</h4>
                    <p className="text-sm text-gray-600">See your design come to life instantly</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="p-3 bg-indigo-100 rounded-xl w-fit mx-auto mb-4">
                      <ArrowDownTrayIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Export Ready</h4>
                    <p className="text-sm text-gray-600">Download and use immediately</p>
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
                    <p className="text-gray-600">Generated with AI precision ({generatedLayouts.length} layout{generatedLayouts.length !== 1 ? 's' : ''})</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={generateLayout}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Generate More
                    </button>
                    <button
                      onClick={handleDownloadImage}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Export
                    </button>
                  </div>
                </div>
                <div ref={previewRef} className="grid grid-cols-1 gap-6">
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
                          src={LAYOUT_IMAGES[layout.layoutType] || LAYOUT_IMAGES['other']}
                          alt={`${layout.layoutType} layout preview`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                            <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-semibold text-gray-900">{layout.score}/10</span>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                              {layout.layoutType?.replace('-', ' ')}
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


                        {/* Live Preview Button */}
                        <div className="mb-6">
                          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h3>
                                <p className="text-gray-600 text-sm">
                                  Open the complete layout in a new page with all API response data
                                </p>
                              </div>
                              <LivePreview layout={layout} />
                            </div>
                          </div>
                        </div>


                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => likeLayout(layout.id)}
                              className={`p-3 rounded-xl transition-all duration-200 ${
                                layout.liked 
                                  ? 'text-red-500 bg-red-50 shadow-lg' 
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <HeartIcon className="h-6 w-6" />
                            </button>
                            <button className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200">
                              <ShareIcon className="h-6 w-6" />
                            </button>
                          </div>
                          <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Use This Layout
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