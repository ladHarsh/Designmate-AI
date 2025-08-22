import React, { useState, useEffect } from 'react';
import api, { trendsAPI, apiUtils } from '../services/api';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const DesignTrends = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [isLoading, setIsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState(null);

  const tabs = [
    { id: 'current', name: 'Current Trends', icon: ArrowTrendingUpIcon },
    { id: 'platforms', name: 'Platform Trends', icon: GlobeAltIcon },
    { id: 'forecast', name: 'Forecast', icon: ChartBarIcon }
  ];

  const platforms = [
    { id: 'web_design', name: 'r/web_design', icon: ComputerDesktopIcon },
    { id: 'design', name: 'r/design', icon: DevicePhoneMobileIcon },
    { id: 'userexperience', name: 'r/userexperience', icon: GlobeAltIcon }
  ];

  useEffect(() => {
    loadTrendsData();
  }, [activeTab]);

  const loadTrendsData = async () => {
    setIsLoading(true);
    try {
      // Current trends from backend (Reddit aggregation)
      const currentRes = await api.get('/trends/current');
      const current = currentRes.data?.data;

      // Platform-specific trends
      const platformRes = await api.get('/trends/platforms');
      const platformData = platformRes.data?.data;

      const mapTopKeywordsToCards = (topKeywords) => (topKeywords || []).slice(0, 9).map((k, idx) => ({
        id: idx + 1,
        name: k.name,
        description: `Appears ${k.count} time(s) in top posts this week`,
        popularity: Math.min(100, 50 + k.count * 5),
        growth: '+',
        category: 'Keyword',
        examples: ['Reddit'],
        color: 'from-purple-500 to-blue-500'
      }));

      const mapPlatforms = (trends) => {
        const out = {};
        Object.keys(trends || {}).forEach((key) => {
          out[key] = (trends[key] || []).map((t) => ({
            name: t.name,
            trend: 'up',
            percentage: t.percentage || 60
          }));
        });
        return out;
      };

      const mapped = {
        current: {
          topTrends: mapTopKeywordsToCards(current?.topKeywords),
          emergingTrends: (current?.topKeywords || []).slice(9, 18).map((k) => k.name)
        },
        platforms: mapPlatforms(platformData?.trends),
        forecast: {
          nextQuarter: ['Accessibility focus', 'AI tooling', '3D/UI motion'],
          nextYear: ['Voice-first UX', 'AR/VR presence', 'Sustainability']
        }
      };

      setTrendsData(mapped);
    } catch (error) {
      console.error('Error loading trends:', error);
      alert(apiUtils.handleError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const TrendCard = ({ trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
    >
      <div className={`h-2 bg-gradient-to-r ${trend.color}`} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {trend.name}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              {trend.description}
            </p>
            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              {trend.category}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {trend.popularity}%
            </div>
            <div className="text-sm text-green-600 font-medium">
              {trend.growth}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Popular in:</p>
          <div className="flex flex-wrap gap-2">
            {trend.examples.map((example, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
              >
                {example}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
              <HeartIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <ShareIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <BookmarkIcon className="h-5 w-5" />
            </button>
          </div>
          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            Learn More
          </button>
        </div>
      </div>
    </motion.div>
  );

  const PlatformTrend = ({ trend }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <span className="font-medium text-gray-900">{trend.name}</span>
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {trend.percentage}%
          </div>
        </div>
        <div className={`flex items-center space-x-1 ${
          trend.trend === 'up' ? 'text-green-600' : 
          trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {trend.trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4" />}
          {trend.trend === 'down' && <ArrowTrendingUpIcon className="h-4 w-4 transform rotate-180" />}
          {trend.trend === 'stable' && <div className="h-4 w-4 border-2 border-gray-400 rounded-full" />}
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
            <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Design Trends</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay ahead of the curve with real-time design trend analysis. Discover what's trending 
            across different platforms and get insights into future design directions.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading trends data...</p>
          </div>
        ) : trendsData && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'current' && (
              <div className="space-y-8">
                {/* Top Trends */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Current Trends</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendsData.current.topTrends.map((trend) => (
                      <TrendCard key={trend.id} trend={trend} />
                    ))}
                  </div>
                </div>

                {/* Emerging Trends */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Emerging Trends</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendsData.current.emergingTrends.map((trend, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-purple-600 rounded-full" />
                        <span className="text-gray-900 font-medium">{trend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'platforms' && (
              <div className="space-y-8">
                {platforms.map((platform) => (
                  <div key={platform.id} className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <platform.icon className="h-6 w-6 text-purple-600" />
                      <h3 className="text-xl font-bold text-gray-900">{platform.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(trendsData.platforms[platform.id] || []).map((trend, index) => (
                        <PlatformTrend key={index} trend={trend} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'forecast' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Next Quarter */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Next Quarter Forecast</h3>
                  <div className="space-y-4">
                    {trendsData.forecast.nextQuarter.map((trend, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                        <p className="text-gray-700">{trend}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Year */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Next Year Forecast</h3>
                  <div className="space-y-4">
                    {trendsData.forecast.nextYear.map((trend, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                        <p className="text-gray-700">{trend}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={loadTrendsData}
            disabled={isLoading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh Trends</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignTrends; 