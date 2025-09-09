import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  SwatchIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    name: 'AI Layout Generator',
    description: 'Generate intelligent layout structures based on your requirements using advanced AI.',
    icon: ChartBarIcon,
    href: '/layout-generator',
  },
  {
    name: 'Color Palette Recommender',
    description: 'Create brand-appropriate color schemes with accessibility compliance checking.',
    icon: SwatchIcon,
    href: '/color-palette',
  },
  {
    name: 'Font Suggestion Tool',
    description: 'Get industry-aligned font pairings that match your design tone and style.',
    icon: DocumentTextIcon,
    href: '/font-suggestions',
  },
  {
    name: 'UX Audit Bot',
    description: 'Analyze your designs for usability issues and accessibility compliance.',
    icon: EyeIcon,
    href: '/ux-audit',
  },
  {
    name: 'Design Trends Analyzer',
    description: 'Track trending UI styles across platforms like Dribbble and Behance.',
    icon: ArrowTrendingUpIcon,
    href: '/trends',
  },
];

const benefits = [
  'Save hours of design research and iteration',
  'Ensure accessibility compliance from the start',
  'Stay updated with current design trends',
  'Generate professional layouts instantly',
  'Get expert-level design recommendations',
  'Collaborate with AI-powered insights',
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-accent-50/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 mb-8">
                <SparklesIcon className="h-4 w-4 mr-2 text-primary-600" />
                Powered by Advanced AI
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Design Smarter with{' '}
                <span className="gradient-text">AI Assistance</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Transform your design workflow with intelligent AI tools that generate layouts, 
                suggest color palettes, recommend fonts, and audit your designs for optimal user experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="btn-primary btn-lg inline-flex items-center"
                  >
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="btn-primary btn-lg inline-flex items-center"
                    >
                      Get Started Free
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Link>
                    <Link
                      to="/login"
                      className="btn-secondary btn-lg"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-primary-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to design better
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered tools help you create professional designs faster and more efficiently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-hover p-6"
              >
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <Link
                  to={feature.href}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  Learn more
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why designers choose DesignMate AI
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of designers who have transformed their workflow with our AI-powered tools.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start"
                  >
                    <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <CheckIcon className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="card p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 bg-primary-600 rounded-lg"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-16 bg-primary-100 rounded-lg"></div>
                    <div className="h-16 bg-accent-100 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 card p-4 w-32">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-success-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">AI Generated</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 card p-4 w-40">
                <div className="text-xs text-gray-600">
                  <div className="font-medium">Accessibility Score</div>
                  <div className="text-lg font-bold text-success-600">98%</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to transform your design workflow?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of designers who are already using AI to create better designs faster.
            </p>
            
            {user ? (
              <Link
                to="/dashboard"
                className="btn-lg bg-white text-primary-600 hover:bg-gray-50 inline-flex items-center"
              >
                Continue to Dashboard
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="btn-lg bg-white text-primary-600 hover:bg-gray-50 inline-flex items-center"
                >
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/explore"
                  className="btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Explore Features
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home; 