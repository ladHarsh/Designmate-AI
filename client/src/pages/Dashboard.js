import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SparklesIcon,
  SwatchIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Dashboard - DesignMate AI";
  }, []);

  const tools = [
    {
      title: "AI Layout Generator",
      description:
        "Generate intelligent layout structures for your web projects using AI.",
      icon: SparklesIcon,
      color: "bg-purple-100 text-purple-600",
      href: "/layout-generator",
    },
    {
      title: "Color Palette",
      description:
        "Create beautiful, accessible color schemes for your designs.",
      icon: SwatchIcon,
      color: "bg-blue-100 text-blue-600",
      href: "/color-palette",
    },
    {
      title: "Font Suggestions",
      description:
        "Get AI-powered typography recommendations and font pairings.",
      icon: DocumentTextIcon,
      color: "bg-green-100 text-green-600",
      href: "/font-suggestions",
    },
    {
      title: "UX Audit",
      description:
        "Analyze your designs for usability and accessibility issues.",
      icon: MagnifyingGlassIcon,
      color: "bg-orange-100 text-orange-600",
      href: "/ux-audit",
    },
    {
      title: "Design Trends",
      description: "Explore current UI/UX trends from Dribbble and Behance.",
      icon: ArrowTrendingUpIcon,
      color: "bg-pink-100 text-pink-600",
      href: "/trends",
    },
  ];

  const ToolCard = ({ tool }) => (
    <Link to={tool.href}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 xs:p-6 hover:shadow-md transition-all duration-200 h-full"
      >
        <div
          className={`hidden xs:inline-flex items-center justify-center p-2 xs:p-3 rounded-xl ${tool.color} w-fit mb-3 xs:mb-4`}
        >
          <tool.icon className="h-5 w-5 xs:h-6 xs:w-6" />
        </div>
        <h3 className="text-sm xs:text-base md:text-lg font-semibold text-gray-900 mb-2">
          {tool.title}
        </h3>
        <p className="text-gray-600 text-xs xs:text-sm md:text-base mb-3 xs:mb-4 leading-snug">
          {tool.description}
        </p>
        <div className="flex items-center text-primary-600 font-medium text-xs xs:text-sm">
          Get Started
          <ArrowRightIcon className="h-3 w-3 xs:h-4 xs:w-4 ml-1" />
        </div>
      </motion.div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-3 xs:py-8">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 xs:mb-8"
        >
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.firstName || "Designer"}! 👋
          </h1>
          <p className="text-sm xs:text-base text-gray-600">
            Select a tool below to get started with your design project.
          </p>
        </motion.div>

        {/* Tools Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-base xs:text-lg md:text-xl font-semibold text-gray-900 mb-4 xs:mb-6">
            AI Design Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-6">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <ToolCard tool={tool} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden xs:block mt-6 xs:mt-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 xs:p-6 text-white"
        >
          <h3 className="text-base xs:text-lg font-semibold mb-2">
            💡 Quick Tip
          </h3>
          <p className="text-sm xs:text-base text-primary-100">
            Start with the Layout Generator to create a base structure, then use
            the Color Palette and Font Suggestions to complete your design
            system. Finally, run a UX Audit to ensure accessibility compliance!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
