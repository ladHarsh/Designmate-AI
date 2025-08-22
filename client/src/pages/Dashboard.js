import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  SwatchIcon, 
  DocumentTextIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  ClockIcon,
  HeartIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockStats = {
        totalProjects: 24,
        layoutsGenerated: 156,
        palettesCreated: 89,
        auditsCompleted: 42,
        monthlyGrowth: 12.5,
        weeklyActivity: 8
      };

      const mockActivity = [
        {
          id: 1,
          type: 'layout',
          title: 'Generated "Modern Landing Layout"',
          description: 'Created a new layout for e-commerce website',
          timestamp: '2 hours ago',
          icon: SparklesIcon,
          color: 'text-purple-600'
        },
        {
          id: 2,
          type: 'palette',
          title: 'Created "Ocean Breeze" palette',
          description: 'Generated 5-color palette for mobile app',
          timestamp: '1 day ago',
          icon: SwatchIcon,
          color: 'text-blue-600'
        },
        {
          id: 3,
          type: 'audit',
          title: 'Completed UX audit for "TechCorp"',
          description: 'Analyzed landing page and provided recommendations',
          timestamp: '3 days ago',
          icon: MagnifyingGlassIcon,
          color: 'text-green-600'
        },
        {
          id: 4,
          type: 'font',
          title: 'Selected "Inter + Source Serif" pairing',
          description: 'Applied typography recommendation to project',
          timestamp: '1 week ago',
          icon: DocumentTextIcon,
          color: 'text-orange-600'
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, href }) => (
    <Link to={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer"
      >
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 w-fit mb-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </motion.div>
    </Link>
  );

  const ActivityItem = ({ activity }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className={`p-2 rounded-lg ${activity.color} bg-opacity-10`}>
        <activity.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-sm text-gray-600">{activity.description}</p>
        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'Designer'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your design projects today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            change={stats.monthlyGrowth}
            icon={ChartBarIcon}
            color="text-purple-600"
          />
          <StatCard
            title="Layouts Generated"
            value={stats.layoutsGenerated}
            icon={SparklesIcon}
            color="text-blue-600"
          />
          <StatCard
            title="Palettes Created"
            value={stats.palettesCreated}
            icon={SwatchIcon}
            color="text-green-600"
          />
          <StatCard
            title="UX Audits"
            value={stats.auditsCompleted}
            icon={MagnifyingGlassIcon}
            color="text-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickActionCard
                  title="Generate Layout"
                  description="Create AI-powered layout suggestions for your project"
                  icon={SparklesIcon}
                  color="text-purple-600"
                  href="/layout-generator"
                />
                <QuickActionCard
                  title="Create Palette"
                  description="Generate harmonious color schemes with AI assistance"
                  icon={SwatchIcon}
                  color="text-blue-600"
                  href="/color-palette"
                />
                <QuickActionCard
                  title="Font Suggestions"
                  description="Get intelligent typography recommendations"
                  icon={DocumentTextIcon}
                  color="text-green-600"
                  href="/font-suggestions"
                />
                <QuickActionCard
                  title="UX Audit"
                  description="Analyze your designs for usability and accessibility"
                  icon={MagnifyingGlassIcon}
                  color="text-orange-600"
                  href="/ux-audit"
                />
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  to="/activity"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View all activity →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">This Week's Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.weeklyActivity}
              </div>
              <p className="text-gray-600">Projects worked on</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round(stats.weeklyActivity * 1.5)}
              </div>
              <p className="text-gray-600">Designs created</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(stats.weeklyActivity * 0.8)}
              </div>
              <p className="text-gray-600">Hours saved with AI</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 