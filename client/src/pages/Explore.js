import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  ShareIcon, 
  BookmarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  SwatchIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Explore = () => {
  const [designs, setDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockDesigns = [
        {
          id: 1,
          title: 'Modern E-commerce Dashboard',
          designer: 'Sarah Chen',
          type: 'layout',
          image: '/api/designs/preview/1',
          likes: 234,
          tags: ['Dashboard', 'E-commerce', 'Modern'],
          description: 'Clean and intuitive dashboard design for online stores'
        },
        {
          id: 2,
          title: 'Ocean Breeze Color Palette',
          designer: 'Mike Johnson',
          type: 'palette',
          image: '/api/designs/preview/2',
          likes: 189,
          tags: ['Color', 'Ocean', 'Calm'],
          description: 'Inspiring color scheme inspired by the ocean'
        },
        {
          id: 3,
          title: 'Tech Startup Landing Page',
          designer: 'Alex Rodriguez',
          type: 'layout',
          image: '/api/designs/preview/3',
          likes: 456,
          tags: ['Landing Page', 'Tech', 'Startup'],
          description: 'Bold and modern landing page for tech companies'
        },
        {
          id: 4,
          title: 'Typography System Guide',
          designer: 'Emma Wilson',
          type: 'font',
          image: '/api/designs/preview/4',
          likes: 123,
          tags: ['Typography', 'System', 'Guide'],
          description: 'Comprehensive typography system for web applications'
        },
        {
          id: 5,
          title: 'Minimalist Portfolio',
          designer: 'David Kim',
          type: 'layout',
          image: '/api/designs/preview/5',
          likes: 298,
          tags: ['Portfolio', 'Minimalist', 'Clean'],
          description: 'Elegant portfolio design with focus on content'
        },
        {
          id: 6,
          title: 'Sunset Gradient Collection',
          designer: 'Lisa Park',
          type: 'palette',
          image: '/api/designs/preview/6',
          likes: 167,
          tags: ['Gradient', 'Sunset', 'Warm'],
          description: 'Beautiful gradient collection inspired by sunsets'
        }
      ];
      
      setDesigns(mockDesigns);
    } catch (error) {
      console.error('Error loading designs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesFilter = filter === 'all' || design.type === filter;
    const matchesSearch = design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         design.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         design.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'layout': return SparklesIcon;
      case 'palette': return SwatchIcon;
      case 'font': return DocumentTextIcon;
      default: return SparklesIcon;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'layout': return 'text-purple-600 bg-purple-100';
      case 'palette': return 'text-blue-600 bg-blue-100';
      case 'font': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const DesignCard = ({ design }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
    >
      {/* Design Preview */}
      <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center relative group">
                 <div className="text-center">
           {design.type === 'palette' ? (
             <SwatchIcon className="h-12 w-12 text-purple-600 mx-auto mb-2" />
           ) : (
             <SparklesIcon className="h-12 w-12 text-purple-600 mx-auto mb-2" />
           )}
           <p className="text-sm text-gray-600">Design Preview</p>
         </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
            <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50">
              <HeartIcon className="h-5 w-5 text-red-500" />
            </button>
            <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50">
              <ShareIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50">
              <BookmarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Design Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {design.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              by {design.designer}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(design.type)}`}>
            {design.type}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          {design.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {design.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
              <HeartIcon className="h-4 w-4" />
              <span className="text-sm">{design.likes}</span>
            </button>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <ShareIcon className="h-4 w-4" />
            </button>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <BookmarkIcon className="h-4 w-4" />
            </button>
          </div>
          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore Designs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover amazing designs from our community. Get inspired by layouts, 
            color palettes, and typography systems created by fellow designers.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search designs, designers, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="layout">Layouts</option>
                <option value="palette">Color Palettes</option>
                <option value="font">Typography</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading designs...</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredDesigns.length} Designs Found
              </h2>
              <div className="text-sm text-gray-600">
                Showing {filteredDesigns.length} of {designs.length} designs
              </div>
            </div>

            {filteredDesigns.length === 0 ? (
              <div className="text-center py-12">
                <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No designs found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesigns.map((design) => (
                  <DesignCard key={design.id} design={design} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Load More */}
        {filteredDesigns.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Load More Designs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore; 