import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  ChartBarIcon,
  SwatchIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Layout Generator", href: "/layout-generator", icon: ChartBarIcon },
  { name: "Color Palette", href: "/color-palette", icon: SwatchIcon },
  {
    name: "Font Suggestions",
    href: "/font-suggestions",
    icon: DocumentTextIcon,
  },
  { name: "UX Audit", href: "/ux-audit", icon: EyeIcon },
  { name: "Design Trends", href: "/trends", icon: ArrowTrendingUpIcon },
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="relative flex w-full max-w-xs flex-1 flex-col bg-white"
            >
              <div className="flex flex-shrink-0 items-center px-2 xs:px-6 py-3 xs:py-4">
                <Link to="/dashboard" className="flex items-center">
                  <div className="h-7 w-7 xs:h-8 xs:w-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs xs:text-sm">
                      D
                    </span>
                  </div>
                  <span className="ml-2 xs:ml-3 text-lg xs:text-xl font-bold gradient-text">
                    DesignMate AI
                  </span>
                </Link>
              </div>
              <nav className="flex-1 space-y-1 px-2 xs:px-4 py-2.5 xs:py-4 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-1.5 xs:px-2.5 py-1.5 xs:py-2 text-xs xs:text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`mr-2 xs:mr-2.5 h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0 ${
                          isActive
                            ? "text-primary-600"
                            : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-gray-200 p-2.5 xs:p-4">
                <div className="flex items-center px-0.5">
                  <div className="h-7 w-7 xs:h-8 xs:w-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs xs:text-sm">
                      {user?.name?.split(" ")[0]?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <div className="ml-2 xs:ml-3 flex-1 min-w-0">
                    <p className="text-xs xs:text-sm font-medium text-gray-700 truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 xs:mt-4 space-y-1 px-0.5">
                  <Link
                    to="/profile"
                    className="flex items-center px-1.5 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <UserIcon className="mr-2 xs:mr-3 h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-1.5 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <ArrowRightOnRectangleIcon className="mr-2 xs:mr-3 h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex flex-shrink-0 items-center px-6 py-4">
            <Link to="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="ml-3 text-xl font-bold gradient-text">
                DesignMate AI
              </span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`mr-2.5 h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.split(" ")[0]?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <UserIcon className="mr-3 h-5 w-5 text-gray-400" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-14 xs:h-16 shrink-0 items-center gap-x-2 xs:gap-x-4 border-b border-gray-200 bg-white px-1 xs:px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-5 w-5 xs:h-6 xs:w-6" />
          </button>

          <div className="flex flex-1 gap-x-2 xs:gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-2 xs:gap-x-4 lg:gap-x-6">
              <Link
                to="/profile"
                className="inline-flex items-center justify-center gap-1 px-1 text-xs xs:text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span className="hidden xs:inline">Profile</span>
                <UserIcon className="h-5 w-5 xs:hidden" />
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1 px-1 text-xs xs:text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span className="hidden xs:inline">Sign Out</span>
                <ArrowRightOnRectangleIcon className="h-5 w-5 xs:hidden" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-2 xs:py-4 sm:py-6">
          <div className="mx-auto max-w-7xl px-1.5 xs:px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
