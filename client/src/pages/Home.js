import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SparklesIcon,
  SwatchIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

const features = [
  {
    name: "AI Layout Generator",
    description:
      "Generate intelligent layout structures based on your requirements using advanced AI.",
    icon: ChartBarIcon,
    href: "/layout-generator",
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Color Palette Recommender",
    description:
      "Create brand-appropriate color schemes with accessibility compliance checking.",
    icon: SwatchIcon,
    href: "/color-palette",
    color: "bg-purple-100 text-purple-600",
  },
  {
    name: "Font Suggestion Tool",
    description:
      "Get industry-aligned font pairings that match your design tone and style.",
    icon: DocumentTextIcon,
    href: "/font-suggestions",
    color: "bg-green-100 text-green-600",
  },
  {
    name: "UX Audit Bot",
    description:
      "Analyze your designs for usability issues and accessibility compliance.",
    icon: EyeIcon,
    href: "/ux-audit",
    color: "bg-orange-100 text-orange-600",
  },
  {
    name: "Design Trends Analyzer",
    description:
      "Track trending UI styles across platforms like Dribbble and Behance.",
    icon: ArrowTrendingUpIcon,
    href: "/trends",
    color: "bg-pink-100 text-pink-600",
  },
];

const benefits = [
  "Save hours of design research and iteration",
  "Ensure accessibility compliance from the start",
  "Stay updated with current design trends",
  "Generate professional layouts instantly",
  "Get expert-level design recommendations",
  "Collaborate with AI-powered insights",
];

// Animation variants for better performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const Home = () => {
  const { user } = useAuth();

  // Set page title for SEO
  useEffect(() => {
    document.title =
      "DesignMate AI - AI-Powered Design Assistant for UI/UX Designers";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden gradient-bg"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-accent-50/50"></div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-12 xs:py-16 lg:py-28">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-3 xs:px-4 py-1.5 xs:py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs xs:text-sm font-medium text-gray-700 mb-4 xs:mb-8 shadow-sm border border-gray-100">
                <SparklesIcon className="h-3 w-3 xs:h-4 xs:w-4 mr-1.5 xs:mr-2 text-primary-600" />
                Powered by Advanced AI
              </div>

              <h1
                id="hero-heading"
                className="text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 xs:mb-6 tracking-tight px-2"
              >
                Design Smarter with{" "}
                <span className="gradient-text">AI Assistance</span>
              </h1>

              <p className="text-base xs:text-lg md:text-xl text-gray-600 mb-6 xs:mb-10 max-w-3xl mx-auto leading-relaxed px-3">
                Transform your design workflow with intelligent AI tools that
                generate layouts, suggest color palettes, recommend fonts, and
                audit your designs for optimal user experience.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 justify-center px-3">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="btn-primary btn-lg inline-flex items-center justify-center text-sm xs:text-base"
                    aria-label="Go to your dashboard"
                  >
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 h-4 w-4 xs:h-5 xs:w-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="btn-primary btn-lg inline-flex items-center justify-center text-sm xs:text-base"
                      aria-label="Get started for free"
                    >
                      Get Started Free
                      <ArrowRightIcon className="ml-2 h-4 w-4 xs:h-5 xs:w-5" />
                    </Link>
                    <Link
                      to="/login"
                      className="btn-secondary btn-lg text-sm xs:text-base"
                      aria-label="Sign in to your account"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating elements - hidden on mobile for performance */}
        <div
          className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-float hidden md:block"
          aria-hidden="true"
        ></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-accent-200 rounded-full opacity-20 animate-float hidden md:block"
          style={{ animationDelay: "1s" }}
          aria-hidden="true"
        ></div>
        <div
          className="absolute bottom-20 left-20 w-12 h-12 bg-primary-300 rounded-full opacity-20 animate-float hidden md:block"
          style={{ animationDelay: "2s" }}
          aria-hidden="true"
        ></div>
      </section>

      {/* Features Section */}
      <section
        className="py-12 xs:py-16 lg:py-24 bg-white"
        aria-labelledby="features-heading"
      >
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-8 xs:mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-2.5 xs:px-3 py-1 text-xs xs:text-sm font-medium text-primary-700 bg-primary-100 rounded-full mb-3 xs:mb-4">
              Features
            </span>
            <h2
              id="features-heading"
              className="text-2xl xs:text-3xl md:text-4xl font-bold text-gray-900 mb-3 xs:mb-4 px-2"
            >
              Everything you need to design better
            </h2>
            <p className="text-sm xs:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-3">
              Our AI-powered tools help you create professional designs faster
              and more efficiently.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 lg:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                variants={itemVariants}
                className="card p-4 xs:p-6"
              >
                <div
                  className={`h-10 w-10 xs:h-12 xs:w-12 rounded-xl flex items-center justify-center mb-3 xs:mb-4 ${feature.color}`}
                >
                  <feature.icon className="h-5 w-5 xs:h-6 xs:w-6" />
                </div>
                <h3 className="text-lg xs:text-xl font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-sm xs:text-base text-gray-600 mb-3 xs:mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <Link
                  to={feature.href}
                  className="inline-flex items-center text-sm xs:text-base text-primary-600 hover:text-primary-700 font-medium"
                  aria-label={`Learn more about ${feature.name}`}
                >
                  Get Started
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
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
                Join thousands of designers who have transformed their workflow
                with our AI-powered tools.
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
              Join thousands of designers who are already using AI to create
              better designs faster.
            </p>

            {user ? (
              <Link
                to="/dashboard"
                className="btn-lg bg-white text-primary-600 hover:bg-gray-50 inline-flex items-center justify-center shadow-lg"
                aria-label="Continue to your dashboard"
              >
                Continue to Dashboard
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn-lg bg-white text-primary-600 hover:bg-gray-50 inline-flex items-center justify-center shadow-lg"
                aria-label="Sign up for an account"
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <SparklesIcon className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold text-white">
                  DesignMate AI
                </span>
              </div>
              <p className="text-gray-400 max-w-md">
                AI-powered design assistant helping designers create better user
                experiences faster.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/layout-generator"
                    className="hover:text-white transition-colors"
                  >
                    Layout Generator
                  </Link>
                </li>
                <li>
                  <Link
                    to="/color-palette"
                    className="hover:text-white transition-colors"
                  >
                    Color Palette
                  </Link>
                </li>
                <li>
                  <Link
                    to="/font-suggestions"
                    className="hover:text-white transition-colors"
                  >
                    Font Suggestions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ux-audit"
                    className="hover:text-white transition-colors"
                  >
                    UX Audit
                  </Link>
                </li>
              </ul>
            </div>

            {/* More Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/trends"
                    className="hover:text-white transition-colors"
                  >
                    Design Trends
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-white transition-colors"
                  >
                    Get Started Free
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} DesignMate AI. All rights
              reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-sm">Made with ❤️ for designers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
