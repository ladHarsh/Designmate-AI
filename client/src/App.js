import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LayoutGenerator from './pages/LayoutGenerator';
import ColorPalette from './pages/ColorPalette';
import FontSuggestions from './pages/FontSuggestions';
import UXAudit from './pages/UXAudit';
import BrandIntelligence from './pages/BrandIntelligence';
import DesignTrends from './pages/DesignTrends';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DesignMate AI...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/trends" element={<DesignTrends />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/layout-generator" element={
          <ProtectedRoute>
            <Layout>
              <LayoutGenerator />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/color-palette" element={
          <ProtectedRoute>
            <Layout>
              <ColorPalette />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/font-suggestions" element={
          <ProtectedRoute>
            <Layout>
              <FontSuggestions />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/ux-audit" element={
          <ProtectedRoute>
            <Layout>
              <UXAudit />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/brand-intelligence" element={
          <ProtectedRoute>
            <Layout>
              <BrandIntelligence />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center gradient-bg"
      >
        <div className="text-center">
          <div className="card p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to access this feature.
            </p>
            <a
              href="/login"
              className="btn-primary"
            >
              Go to Login
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  return children;
}

export default App; 