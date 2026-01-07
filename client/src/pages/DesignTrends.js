import React, { useState, useEffect } from "react";
import api, { trendsAPI, apiUtils } from "../services/api";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const DesignTrends = () => {
  const [activeTab, setActiveTab] = useState("current");
  const [isLoading, setIsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState(null);

  const tabs = [
    { id: "current", name: "Current Trends", icon: ArrowTrendingUpIcon },
    { id: "platforms", name: "Platform Trends", icon: GlobeAltIcon },
    { id: "forecast", name: "Forecast", icon: ChartBarIcon },
  ];

  const platforms = [
    { id: "web_design", name: "r/web_design", icon: ComputerDesktopIcon },
    { id: "design", name: "r/design", icon: DevicePhoneMobileIcon },
    { id: "userexperience", name: "r/userexperience", icon: GlobeAltIcon },
  ];

  useEffect(() => {
    loadTrendsData();
  }, [activeTab]);

  const loadTrendsData = async () => {
    setIsLoading(true);
    try {
      // Current trends from backend (Reddit aggregation)
      const currentRes = await api.get("/trends/current");
      const current = currentRes.data?.data;

      // Platform-specific trends
      const platformRes = await api.get("/trends/platforms");
      const platformData = platformRes.data?.data;

      const mapTopKeywordsToCards = (topKeywords) =>
        (topKeywords || []).slice(0, 9).map((k, idx) => ({
          id: idx + 1,
          name: k.name,
          description: `Appears ${k.count} time(s) in top posts this week`,
          popularity: Math.min(100, 50 + k.count * 5),
          growth: "+",
          category: "Keyword",
          examples: ["Reddit"],
          color: "from-purple-500 to-blue-500",
        }));

      const mapPlatforms = (trends) => {
        const out = {};
        Object.keys(trends || {}).forEach((key) => {
          out[key] = (trends[key] || []).map((t) => ({
            name: t.name,
            trend: "up",
            percentage: t.percentage || 60,
          }));
        });
        return out;
      };

      const mapped = {
        current: {
          topTrends: mapTopKeywordsToCards(current?.topKeywords),
          emergingTrends: (current?.topKeywords || [])
            .slice(9, 18)
            .map((k) => k.name),
        },
        platforms: mapPlatforms(platformData?.trends),
        forecast: {
          nextQuarter: ["Accessibility focus", "AI tooling", "3D/UI motion"],
          nextYear: ["Voice-first UX", "AR/VR presence", "Sustainability"],
        },
      };

      setTrendsData(mapped);
    } catch (error) {
      console.error("Error loading trends:", error);
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
      <div className="p-3 xs:p-5">
        <div className="flex items-start justify-between mb-3 xs:mb-4">
          <div>
            <h3 className="text-lg xs:text-xl font-semibold text-gray-900 mb-1">
              {trend.name}
            </h3>
            <p className="text-gray-600 text-xs xs:text-sm mb-1 xs:mb-2">
              {trend.description}
            </p>
            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[11px] xs:text-xs font-medium">
              {trend.category}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xl xs:text-2xl font-bold text-purple-600">
              {trend.popularity}%
            </div>
            <div className="text-xs xs:text-sm text-green-600 font-medium">
              {trend.growth}
            </div>
          </div>
        </div>

        <div className="mb-3 xs:mb-4">
          <p className="text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
            Popular in:
          </p>
          <div className="flex flex-wrap gap-1.5 xs:gap-2">
            {trend.examples.map((example, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] xs:text-xs"
              >
                {example}
              </span>
            ))}
          </div>
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
        <div
          className={`flex items-center space-x-1 ${
            trend.trend === "up"
              ? "text-green-600"
              : trend.trend === "down"
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {trend.trend === "up" && <ArrowTrendingUpIcon className="h-4 w-4" />}
          {trend.trend === "down" && (
            <ArrowTrendingUpIcon className="h-4 w-4 transform rotate-180" />
          )}
          {trend.trend === "stable" && (
            <div className="h-4 w-4 border-2 border-gray-400 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 xs:mb-10"
        >
          <div className="flex items-center justify-center mb-3 xs:mb-4">
            <ArrowTrendingUpIcon className="h-6 w-6 xs:h-8 xs:w-8 text-purple-600 mr-2 xs:mr-3" />
            <h1 className="text-2xl xs:text-4xl font-bold text-gray-900">
              Design Trends
            </h1>
          </div>
          <p className="text-sm xs:text-lg text-gray-600 max-w-3xl mx-auto">
            Stay ahead with real-time design trend analysis from top design
            communities.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-6 xs:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 xs:px-5 py-2 xs:py-3 rounded-lg font-medium text-sm xs:text-base transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="h-4 w-4 xs:h-5 xs:w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-6 xs:py-10">
            <ArrowPathIcon className="h-10 w-10 text-purple-600 mx-auto mb-3 animate-spin" />
            <p className="text-sm xs:text-base text-gray-600">
              Loading trends data...
            </p>
          </div>
        ) : (
          trendsData && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "current" && (
                <div className="space-y-6 xs:space-y-8">
                  {/* Top Trends */}
                  <div>
                    <h2 className="text-lg xs:text-2xl font-bold text-gray-900 mb-4 xs:mb-6">
                      Top Current Trends
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-5">
                      {trendsData.current.topTrends.map((trend) => (
                        <TrendCard key={trend.id} trend={trend} />
                      ))}
                    </div>
                  </div>

                  {/* Emerging Trends */}
                  <div className="bg-white rounded-2xl shadow-xl p-3 xs:p-6">
                    <h3 className="text-lg xs:text-xl font-bold text-gray-900 mb-3 xs:mb-4">
                      Emerging Trends
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-4">
                      {trendsData.current.emergingTrends.map((trend, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-2 xs:p-3 bg-purple-50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-purple-600 rounded-full" />
                          <span className="text-sm xs:text-base text-gray-900 font-medium">
                            {trend}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "platforms" && (
                <div className="space-y-6 xs:space-y-8">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="bg-white rounded-2xl shadow-xl p-3 xs:p-6"
                    >
                      <div className="flex items-center space-x-3 mb-3 xs:mb-5">
                        <platform.icon className="h-5 w-5 xs:h-6 xs:w-6 text-purple-600" />
                        <h3 className="text-lg xs:text-xl font-bold text-gray-900">
                          {platform.name}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
                        {(trendsData.platforms[platform.id] || []).map(
                          (trend, index) => (
                            <PlatformTrend key={index} trend={trend} />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "forecast" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
                  {/* Next Quarter */}
                  <div className="bg-white rounded-2xl shadow-xl p-3 xs:p-6">
                    <h3 className="text-lg xs:text-xl font-bold text-gray-900 mb-3 xs:mb-4">
                      Next Quarter Forecast
                    </h3>
                    <div className="space-y-3 xs:space-y-4">
                      {trendsData.forecast.nextQuarter.map((trend, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 xs:space-x-3"
                        >
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                          <p className="text-sm xs:text-base text-gray-700">
                            {trend}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Year */}
                  <div className="bg-white rounded-2xl shadow-xl p-3 xs:p-6">
                    <h3 className="text-lg xs:text-xl font-bold text-gray-900 mb-3 xs:mb-4">
                      Next Year Forecast
                    </h3>
                    <div className="space-y-3 xs:space-y-4">
                      {trendsData.forecast.nextYear.map((trend, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 xs:space-x-3"
                        >
                          <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5" />
                          <p className="text-sm xs:text-base text-gray-700">
                            {trend}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        )}

        {/* Refresh Button */}
        <div className="text-center mt-6 xs:mt-8">
          <button
            onClick={loadTrendsData}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 xs:px-6 py-2.5 xs:py-3 rounded-lg font-semibold text-sm xs:text-base hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
          >
            <ArrowPathIcon
              className={`h-4 w-4 xs:h-5 xs:w-5 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            <span>{isLoading ? "Refreshing..." : "Refresh Trends"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignTrends;
