import React, { useState, useRef } from "react";
import { auditAPI, apiUtils } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  PhotoIcon,
  DocumentTextIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  PencilIcon,
  ShieldCheckIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  SparklesIcon,
  BoltIcon,
  TrophyIcon,
  LightBulbIcon,
  XMarkIcon,
  ArrowRightIcon,
  UserGroupIcon,
  BookOpenIcon,
  CpuChipIcon,
  SwatchIcon,
  Square3Stack3DIcon,
  PresentationChartBarIcon,
  CubeIcon,
  AwardIcon,
} from "@heroicons/react/24/outline";

const UXAudit = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [context, setContext] = useState("general web application");
  const [focusAreas, setFocusAreas] = useState(["all"]);
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef(null);

  const contextOptions = [
    {
      value: "general web application",
      label: "General Web App",
      icon: <Square3Stack3DIcon className="h-4 w-4" />,
    },
    {
      value: "e-commerce",
      label: "E-commerce",
      icon: <ChartBarIcon className="h-4 w-4" />,
    },
    {
      value: "landing page",
      label: "Landing Page",
      icon: <DocumentTextIcon className="h-4 w-4" />,
    },
    {
      value: "dashboard",
      label: "Dashboard",
      icon: <PresentationChartBarIcon className="h-4 w-4" />,
    },
    {
      value: "mobile app",
      label: "Mobile App",
      icon: <DevicePhoneMobileIcon className="h-4 w-4" />,
    },
    {
      value: "portfolio",
      label: "Portfolio",
      icon: <UserGroupIcon className="h-4 w-4" />,
    },
    {
      value: "blog",
      label: "Blog/Content",
      icon: <BookOpenIcon className="h-4 w-4" />,
    },
    {
      value: "saas",
      label: "SaaS Platform",
      icon: <CpuChipIcon className="h-4 w-4" />,
    },
  ];

  const focusAreaOptions = [
    {
      value: "all",
      label: "All Areas",
      icon: <SparklesIcon className="h-4 w-4" />,
    },
    {
      value: "accessibility",
      label: "Accessibility",
      icon: <ShieldCheckIcon className="h-4 w-4" />,
    },
    {
      value: "usability",
      label: "Usability",
      icon: <CursorArrowRaysIcon className="h-4 w-4" />,
    },
    {
      value: "visualDesign",
      label: "Visual Design",
      icon: <SwatchIcon className="h-4 w-4" />,
    },
    {
      value: "performance",
      label: "Performance",
      icon: <BoltIcon className="h-4 w-4" />,
    },
    {
      value: "content",
      label: "Content",
      icon: <BookOpenIcon className="h-4 w-4" />,
    },
    {
      value: "engagement",
      label: "Engagement",
      icon: <HeartIcon className="h-4 w-4" />,
    },
    {
      value: "mobile",
      label: "Mobile UX",
      icon: <DevicePhoneMobileIcon className="h-4 w-4" />,
    },
  ];

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <EyeIcon className="h-4 w-4" />,
    },
    {
      id: "accessibility",
      label: "Accessibility",
      icon: <ShieldCheckIcon className="h-4 w-4" />,
    },
    {
      id: "usability",
      label: "Usability",
      icon: <CursorArrowRaysIcon className="h-4 w-4" />,
    },
    { id: "design", label: "Design", icon: <SwatchIcon className="h-4 w-4" /> },
    {
      id: "conversion",
      label: "Conversion",
      icon: <ChartBarIcon className="h-4 w-4" />,
    },
    {
      id: "recommendations",
      label: "Tips",
      icon: <LightBulbIcon className="h-4 w-4" />,
    },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage({
          file: file,
          preview: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeDesign = async () => {
    if (!uploadedImage) {
      alert("Please upload an image of your design");
      return;
    }

    setIsAnalyzing(true);
    try {
      const form = new FormData();

      form.append("image", uploadedImage.file);
      form.append("context", context);
      form.append("focusAreas", JSON.stringify(focusAreas));
      form.append("description", "");

      const { data } = await auditAPI.analyze(form);

      const audit = data?.data?.audit;
      const imageUrl = data?.data?.imageUrl || uploadedImage?.preview;

      if (!audit) {
        throw new Error("No audit data received");
      }

      setAuditReport(audit);
    } catch (error) {
      const message = apiUtils.handleError(error);
      console.error("Error analyzing design:", message);
      alert(`Analysis failed: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case "error":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "info":
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDownloadReport = async () => {
    if (!auditReport) {
      alert("No audit report available to download");
      return;
    }

    try {
      const reportTitle = `UX_Audit_Report_${new Date().getFullYear()}_${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}_${String(new Date().getDate()).padStart(2, "0")}`;

      const response = await auditAPI.download(auditReport, reportTitle);

      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${reportTitle}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const message = apiUtils.handleError(error);
      console.error("Error downloading report:", message);
      alert(`Failed to download report: ${message}`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-2 xs:py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden xs:block text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <EyeIcon className="h-6 xs:h-8 w-6 xs:w-8 text-indigo-600 mr-2 xs:mr-3" />
            <h1 className="text-2xl xs:text-4xl font-bold text-gray-900">
              UX Audit
            </h1>
          </div>
          <p className="text-sm xs:text-xl text-gray-600 max-w-3xl mx-auto">
            Get comprehensive UX analysis and actionable insights for your
            designs. Our AI evaluates accessibility, usability, visual design,
            and conversion optimization to help you create exceptional user
            experiences.
          </p>
        </motion.div>

        {!auditReport ? (
          // Upload Section
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200 p-3 xs:p-6">
              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 xs:p-10 transition-all duration-300 ${
                  dragActive
                    ? "border-indigo-400 bg-indigo-50/50 scale-105"
                    : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="relative group">
                      <img
                        src={uploadedImage.preview}
                        alt="Uploaded design"
                        className="max-w-full h-64 object-cover mx-auto rounded-xl shadow-lg"
                      />
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-500 font-medium">
                        {uploadedImage.file.name}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <PhotoIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg xs:text-xl font-semibold text-slate-700 mb-1.5">
                      Upload your design
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 xs:mb-6">
                      PNG, JPG, or WebP up to 10MB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 xs:px-6 py-2.5 xs:py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm xs:text-base rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Configuration */}

              {/* Analyze Button */}
              {uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <button
                    onClick={analyzeDesign}
                    disabled={isAnalyzing}
                    className="w-full py-3 xs:py-4 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm xs:text-base rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 xs:space-x-3 shadow-lg hover:shadow-xl"
                  >
                    {isAnalyzing ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 xs:h-6 xs:w-6 animate-spin" />
                        <span>Analyzing Design...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5 xs:h-6 xs:w-6" />
                        <span>Start Analysis</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          // Results Section
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 max-w-6xl mx-auto"
          >
            {/* Header Actions */}
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 px-2 py-3 xs:p-4 shadow-sm">
              <div>
                <h2 className="text-sm xs:text-xl font-bold text-slate-900">
                  Analysis Results
                </h2>
                <p className="text-[10px] xs:text-sm text-slate-600">
                  Comprehensive UX audit completed
                </p>
              </div>
              <div className="flex items-center space-x-1 xs:space-x-3">
                <button
                  onClick={() => {
                    setAuditReport(null);
                    setUploadedImage(null);
                    setActiveTab("overview");
                  }}
                  className="hidden xs:flex px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors items-center space-x-2 font-medium"
                >
                  <ArrowRightIcon className="h-4 w-4 rotate-180" />
                  <span>New Analysis</span>
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="p-1.5 xs:p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 xs:h-5 w-4 xs:w-5" />
                </button>
              </div>
            </div>

            {/* Score Overview */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200 p-2 xs:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3 xs:mb-8">
                <div className="flex-1 pr-2 xs:pr-6">
                  <h3 className="text-base xs:text-2xl font-bold text-slate-900 mb-1 xs:mb-3">
                    Overall Score
                  </h3>
                  <p className="text-[10px] xs:text-base text-slate-600 leading-snug xs:leading-relaxed">
                    {(() => {
                      // First, check if there's an actual summary from the audit report
                      const actualSummary =
                        auditReport?.executiveSummary?.summary ||
                        auditReport?.summary;
                      if (actualSummary) {
                        return actualSummary;
                      }

                      // Fall back to score-based messages if no summary available
                      const score =
                        auditReport?.executiveSummary?.overallScore ||
                        auditReport?.overallScore ||
                        0;
                      if (score >= 90)
                        return "Exceptional design with excellent user experience";
                      if (score >= 70)
                        return "Good overall design with room for optimization";
                      if (score >= 50)
                        return "Fair design that needs improvement";
                      return "Design requires significant improvement";
                    })()}
                  </p>
                </div>
                <div className="text-right bg-white/30 rounded-xl p-2 xs:p-4">
                  <div
                    className={`text-2xl xs:text-5xl font-bold mb-1 ${getScoreColor(
                      auditReport?.executiveSummary?.overallScore ||
                        auditReport?.overallScore ||
                        0
                    )}`}
                  >
                    {auditReport?.executiveSummary?.overallScore ||
                      auditReport?.overallScore ||
                      0}
                  </div>
                  <p className="text-slate-500 font-medium text-[10px] xs:text-sm">
                    {getScoreLabel(
                      auditReport?.executiveSummary?.overallScore ||
                        auditReport?.overallScore ||
                        0
                    )}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 xs:h-4 bg-slate-200 rounded-full overflow-hidden mb-4 xs:mb-8 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      auditReport?.executiveSummary?.overallScore ||
                      auditReport?.overallScore ||
                      0
                    }%`,
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 rounded-full shadow-sm ${
                    (auditReport?.executiveSummary?.overallScore ||
                      auditReport?.overallScore ||
                      0) >= 90
                      ? "bg-gradient-to-r from-emerald-500 to-green-600"
                      : (auditReport?.executiveSummary?.overallScore ||
                          auditReport?.overallScore ||
                          0) >= 80
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                      : (auditReport?.executiveSummary?.overallScore ||
                          auditReport?.overallScore ||
                          0) >= 70
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                      : (auditReport?.executiveSummary?.overallScore ||
                          auditReport?.overallScore ||
                          0) >= 60
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600"
                      : (auditReport?.executiveSummary?.overallScore ||
                          auditReport?.overallScore ||
                          0) >= 50
                      ? "bg-gradient-to-r from-orange-500 to-amber-600"
                      : "bg-gradient-to-r from-red-500 to-rose-600"
                  }`}
                />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-6">
                <div className="text-center p-2 xs:p-4 bg-white rounded-xl border border-slate-200">
                  <ExclamationTriangleIcon className="h-4 xs:h-6 w-4 xs:w-6 text-red-500 mx-auto mb-1 xs:mb-2" />
                  <div className="text-base xs:text-2xl font-bold text-slate-900">
                    {auditReport?.executiveSummary?.criticalIssuesCount ||
                      auditReport?.criticalIssues?.length ||
                      0}
                  </div>
                  <div className="text-[9px] xs:text-xs text-slate-600 font-medium">
                    Critical Issues
                  </div>
                </div>
                <div className="text-center p-2 xs:p-4 bg-white rounded-xl border border-slate-200">
                  <ClockIcon className="h-4 xs:h-6 w-4 xs:w-6 text-blue-500 mx-auto mb-1 xs:mb-2" />
                  <div className="text-xs xs:text-lg font-bold text-slate-900">
                    {auditReport?.executiveSummary?.timeToImplementFixes ||
                      "2-3 weeks"}
                  </div>
                  <div className="text-[9px] xs:text-xs text-slate-600 font-medium">
                    Time to Fix
                  </div>
                </div>
                <div className="text-center p-2 xs:p-4 bg-white rounded-xl border border-slate-200">
                  <ChartBarIcon className="h-4 xs:h-6 w-4 xs:w-6 text-emerald-500 mx-auto mb-1 xs:mb-2" />
                  <div className="text-base xs:text-2xl font-bold text-slate-900">
                    {auditReport?.quickWins?.length || 0}
                  </div>
                  <div className="text-[9px] xs:text-xs text-slate-600 font-medium">
                    Quick Wins
                  </div>
                </div>
                <div className="text-center p-2 xs:p-4 bg-white rounded-xl border border-slate-200">
                  <TrophyIcon className="h-4 xs:h-6 w-4 xs:w-6 text-amber-500 mx-auto mb-1 xs:mb-2" />
                  <div className="text-base xs:text-2xl font-bold text-slate-900">
                    {auditReport?.strengths?.length || 0}
                  </div>
                  <div className="text-[9px] xs:text-xs text-slate-600 font-medium">
                    Strengths
                  </div>
                </div>
              </div>

              {/* Business Impact Summary & WCAG Compliance */}
              {(auditReport?.executiveSummary?.businessImpact ||
                auditReport?.accessibilityAudit?.wcagCompliance) && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {auditReport?.executiveSummary?.businessImpact && (
                    <div className="relative overflow-hidden p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 rounded-2xl border border-indigo-200 shadow-lg">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full transform translate-x-16 -translate-y-16"></div>
                      <div className="relative">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-indigo-100 rounded-xl mr-4">
                            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <h4 className="text-xl font-bold text-slate-900">
                            Business Impact Analysis
                          </h4>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-sm">
                          {auditReport.executiveSummary.businessImpact}
                        </p>
                        <div className="mt-6 flex items-center text-indigo-600">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">
                            Strategic Insights
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {auditReport?.accessibilityAudit?.wcagCompliance && (
                    <div className="relative overflow-hidden p-8 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 rounded-2xl border border-emerald-200 shadow-lg">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full transform translate-x-16 -translate-y-16"></div>
                      <div className="relative">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-emerald-100 rounded-xl mr-4">
                            <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
                          </div>
                          <h4 className="text-xl font-bold text-slate-900">
                            WCAG Compliance
                          </h4>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-sm mb-4">
                          {auditReport.accessibilityAudit.wcagCompliance}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center text-emerald-600">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
                            <span className="font-medium">AA - 60%</span>
                          </div>
                          <div className="flex items-center text-emerald-500">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                            <span className="font-medium">AAA - 30%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-1 xs:p-2 shadow-sm">
              <div className="grid grid-cols-3 xs:flex xs:flex-wrap xs:justify-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center space-x-0.5 xs:space-x-2 px-0.5 xs:px-6 py-1.5 xs:py-3 rounded-lg xs:rounded-xl text-[9px] xs:text-base font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span className="hidden xs:inline h-3 w-3 xs:h-4 xs:w-4">
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar"
                style={{ scrollbarWidth: "thin" }}
              >
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Strengths */}
                    <div
                      className={`p-3 xs:p-8 rounded-2xl shadow-lg ${(() => {
                        const score =
                          auditReport?.executiveSummary?.overallScore ||
                          auditReport?.overallScore ||
                          0;
                        if (score >= 90)
                          return "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 border border-emerald-200";
                        if (score >= 70)
                          return "bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-100 border border-blue-200";
                        if (score >= 50)
                          return "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 border border-amber-200";
                        return "bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 border border-slate-200";
                      })()}`}
                    >
                      <div className="flex items-center mb-3 xs:mb-6">
                        <HeartIcon
                          className={`h-4 xs:h-6 w-4 xs:w-6 mr-2 xs:mr-4 ${(() => {
                            const score =
                              auditReport?.executiveSummary?.overallScore ||
                              auditReport?.overallScore ||
                              0;
                            if (score >= 90) return "text-emerald-600";
                            if (score >= 70) return "text-blue-600";
                            if (score >= 50) return "text-amber-600";
                            return "text-slate-600";
                          })()}`}
                        />
                        <h3 className="text-base xs:text-xl font-bold text-slate-900">
                          Strengths
                        </h3>
                      </div>
                      <div className="space-y-2 xs:space-y-3">
                        {(() => {
                          const score =
                            auditReport?.executiveSummary?.overallScore ||
                            auditReport?.overallScore ||
                            0;
                          const strengths = auditReport?.strengths || [];

                          // Only show strengths if score is reasonable (50+)
                          if (score < 50) {
                            return (
                              <p className="text-slate-600 text-center py-8">
                                Significant improvements needed before
                                identifying strengths.
                              </p>
                            );
                          }

                          // Show strengths for scores 50+
                          if (strengths.length > 0) {
                            return strengths.map((strength, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-2 xs:space-x-3"
                              >
                                <CheckCircleIcon className="h-4 xs:h-5 w-4 xs:w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <p className="text-slate-700 text-xs xs:text-base leading-relaxed">
                                  {strength}
                                </p>
                              </div>
                            ));
                          }

                          // No strengths found
                          return (
                            <p className="text-slate-600 text-center py-8">
                              {score >= 70
                                ? "No specific strengths identified yet."
                                : "Focus on addressing key issues to unlock design strengths."}
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Quick Wins */}
                    <div className="p-3 xs:p-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 rounded-2xl border border-amber-200 shadow-lg">
                      <div className="flex items-center mb-3 xs:mb-6">
                        <BoltIcon className="h-4 xs:h-6 w-4 xs:w-6 text-amber-600 mr-2 xs:mr-4" />
                        <h3 className="text-base xs:text-xl font-bold text-slate-900">
                          Quick Wins
                        </h3>
                      </div>
                      <div className="space-y-2 xs:space-y-3">
                        {(auditReport?.quickWins || []).map((win, index) => (
                          <div
                            key={index}
                            className="p-2 xs:p-3 bg-white rounded-xl border border-amber-300 shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-1 xs:mb-2">
                              <h4 className="text-xs xs:text-base font-semibold text-slate-900 leading-tight flex-1">
                                {typeof win === "string" ? win : win.title}
                              </h4>
                              {typeof win === "object" &&
                                win.timeToImplement && (
                                  <span className="px-2 xs:px-3 py-0.5 xs:py-1 bg-amber-200 text-amber-900 rounded-lg text-[10px] xs:text-xs font-medium whitespace-nowrap ml-2 xs:ml-4">
                                    {win.timeToImplement}
                                  </span>
                                )}
                            </div>

                            {typeof win === "object" && win.implementation && (
                              <p className="text-slate-700 leading-relaxed text-[10px] xs:text-sm mb-1 xs:mb-2">
                                {win.implementation}
                              </p>
                            )}

                            {typeof win === "object" && win.expectedImpact && (
                              <div className="flex items-start space-x-1 xs:space-x-2 p-1.5 xs:p-2 bg-green-50 rounded-lg border-l-2 xs:border-l-4 border-green-400">
                                <span className="text-[10px] xs:text-sm text-green-800 font-medium">
                                  Impact: {win.expectedImpact}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {(!auditReport?.quickWins ||
                          auditReport.quickWins.length === 0) && (
                          <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-200 rounded-full mb-3">
                              <BoltIcon className="w-6 h-6 text-amber-700" />
                            </div>
                            <p className="text-slate-700 font-medium mb-1">
                              No quick wins identified yet
                            </p>
                            <p className="text-slate-600 text-sm">
                              Run an audit to discover opportunities
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Accessibility Tab */}
                {activeTab === "accessibility" &&
                  auditReport?.categories?.accessibility && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-3 xs:p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-4 xs:mb-8">
                        <div className="flex items-center space-x-2 xs:space-x-3">
                          <ShieldCheckIcon className="h-5 xs:h-7 w-5 xs:w-7 text-blue-500" />
                          <h3 className="text-base xs:text-2xl font-semibold text-slate-900">
                            Accessibility Analysis
                          </h3>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-xl xs:text-3xl font-bold ${getScoreColor(
                              auditReport.categories.accessibility.score || 0
                            )}`}
                          >
                            {auditReport.categories.accessibility.score || 0}
                            /100
                          </div>
                          <p className="text-xs xs:text-base text-slate-500">
                            {getScoreLabel(
                              auditReport.categories.accessibility.score || 0
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(
                          auditReport.categories.accessibility.issues || []
                        ).map((issue, index) => (
                          <div
                            key={index}
                            className="p-3 xs:p-6 bg-white rounded-xl border border-slate-200 shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-2 xs:mb-4">
                              <div className="flex items-center space-x-2 xs:space-x-3">
                                <div className="flex-shrink-0 p-1.5 xs:p-2.5 rounded-lg bg-red-50">
                                  {getIssueIcon(issue.type)}
                                </div>
                                <h5 className="text-xs xs:text-base font-semibold text-slate-900">
                                  {issue.title || "Issue"}
                                </h5>
                              </div>
                              <span
                                className={`px-2 xs:px-3 py-0.5 xs:py-1 rounded-md text-[10px] xs:text-xs font-semibold whitespace-nowrap ${getSeverityColor(
                                  issue.severity || "low"
                                )}`}
                              >
                                {issue.severity || "low"}
                              </span>
                            </div>

                            <p className="text-slate-600 leading-relaxed text-[10px] xs:text-sm mb-2 xs:mb-4">
                              {issue.description || ""}
                            </p>

                            {issue.suggestion && (
                              <div className="p-2 xs:p-3 bg-blue-50 rounded-lg border-l-2 xs:border-l-4 border-blue-500">
                                <div className="flex items-start space-x-1 xs:space-x-2">
                                  <span className="text-blue-600 flex-shrink-0 mt-0.5 text-xs xs:text-base">
                                    💡
                                  </span>
                                  <p className="text-blue-700 text-[10px] xs:text-sm leading-relaxed">
                                    {issue.suggestion}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {(!auditReport.categories.accessibility.issues ||
                          auditReport.categories.accessibility.issues.length ===
                            0) && (
                          <div className="col-span-full text-center py-16">
                            <div className="inline-flex p-4 rounded-full bg-emerald-100 mb-4">
                              <CheckCircleIcon className="h-16 w-16 text-emerald-500" />
                            </div>
                            <h4 className="text-xl font-semibold text-slate-900 mb-3">
                              No accessibility issues found!
                            </h4>
                            <p className="text-slate-600 max-w-md mx-auto">
                              Your design meets accessibility standards and
                              provides a great experience for all users.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Usability Tab */}
                {activeTab === "usability" && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-3 xs:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-4 xs:mb-8">
                      <div className="flex items-center space-x-2 xs:space-x-3">
                        <CursorArrowRaysIcon className="h-5 xs:h-7 w-5 xs:w-7 text-purple-500" />
                        <h3 className="text-base xs:text-2xl font-semibold text-slate-900">
                          Usability Analysis
                        </h3>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl xs:text-3xl font-bold ${getScoreColor(
                            auditReport?.usabilityAnalysis?.overallScore ||
                              auditReport?.categories?.usability?.score ||
                              0
                          )}`}
                        >
                          {auditReport?.usabilityAnalysis?.overallScore ||
                            auditReport?.categories?.usability?.score ||
                            0}
                          /100
                        </div>
                        <p className="text-xs xs:text-base text-slate-500">
                          {getScoreLabel(
                            auditReport?.usabilityAnalysis?.overallScore ||
                              auditReport?.categories?.usability?.score ||
                              0
                          )}
                        </p>
                      </div>
                    </div>

                    {/* User Flow Efficiency and Navigation Clarity Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-6 mb-4 xs:mb-8">
                      {/* User Flow Efficiency */}
                      {auditReport?.usabilityAnalysis?.userFlowEfficiency && (
                        <div className="p-3 xs:p-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-100 rounded-2xl border border-purple-200 shadow-lg">
                          <div className="flex items-center justify-between mb-3 xs:mb-6">
                            <div className="flex items-center">
                              <BoltIcon className="h-4 xs:h-6 w-4 xs:w-6 text-purple-600 mr-2 xs:mr-4" />
                              <h4 className="text-sm xs:text-xl font-bold text-slate-900">
                                User Flow Efficiency
                              </h4>
                            </div>
                            <div className="text-lg xs:text-3xl font-bold text-purple-600">
                              {
                                auditReport.usabilityAnalysis.userFlowEfficiency
                                  .score
                              }
                              <span className="text-xs xs:text-lg text-purple-300">
                                /100
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 xs:space-y-3">
                            <div className="p-2 xs:p-3">
                              <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                Clicks to Goal
                              </span>
                              <p className="text-slate-700 text-[10px] xs:text-sm">
                                {
                                  auditReport.usabilityAnalysis
                                    .userFlowEfficiency.clicksToGoal
                                }
                              </p>
                            </div>
                            <div className="p-2 xs:p-3">
                              <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                Cognitive Load
                              </span>
                              <p className="text-slate-700 text-[10px] xs:text-sm">
                                {
                                  auditReport.usabilityAnalysis
                                    .userFlowEfficiency.cognitiveLoad
                                }
                              </p>
                            </div>
                          </div>
                          {auditReport.usabilityAnalysis.userFlowEfficiency
                            .errorPrevention && (
                            <div className="mt-2 xs:mt-4 p-2 xs:p-3">
                              <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                Error Prevention
                              </span>
                              <p className="text-slate-700 text-[10px] xs:text-sm">
                                {
                                  auditReport.usabilityAnalysis
                                    .userFlowEfficiency.errorPrevention
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Navigation Clarity */}
                      {auditReport?.usabilityAnalysis?.navigationClarity && (
                        <div className="p-3 xs:p-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 rounded-2xl border border-blue-200 shadow-lg">
                          <div className="flex items-center justify-between mb-3 xs:mb-6">
                            <div className="flex items-center">
                              <Square3Stack3DIcon className="h-4 xs:h-6 w-4 xs:w-6 text-blue-600 mr-2 xs:mr-4" />
                              <h4 className="text-sm xs:text-xl font-bold text-slate-900">
                                Navigation Clarity
                              </h4>
                            </div>
                            <div className="text-lg xs:text-3xl font-bold text-blue-600">
                              {
                                auditReport.usabilityAnalysis.navigationClarity
                                  .score
                              }
                              <span className="text-xs xs:text-lg text-blue-300">
                                /100
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 xs:space-y-3">
                            <div className="p-2 xs:p-3">
                              <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                Menu Structure
                              </span>
                              <p className="text-slate-700 text-[10px] xs:text-sm">
                                {
                                  auditReport.usabilityAnalysis
                                    .navigationClarity.menuStructure
                                }
                              </p>
                            </div>
                            {auditReport.usabilityAnalysis.navigationClarity
                              .breadcrumbs && (
                              <div className="p-2 xs:p-3">
                                <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                  Breadcrumbs
                                </span>
                                <p className="text-slate-700 text-[10px] xs:text-sm">
                                  {
                                    auditReport.usabilityAnalysis
                                      .navigationClarity.breadcrumbs
                                  }
                                </p>
                              </div>
                            )}
                            {auditReport.usabilityAnalysis.navigationClarity
                              .searchability && (
                              <div className="p-2 xs:p-3">
                                <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                  Search
                                </span>
                                <p className="text-slate-700 text-[10px] xs:text-sm">
                                  {
                                    auditReport.usabilityAnalysis
                                      .navigationClarity.searchability
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Usability Issues */}
                    <div className="space-y-6">
                      <h4 className="text-base xs:text-xl font-semibold text-slate-900">
                        Issues & Recommendations
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-6">
                        {(auditReport?.categories?.usability?.issues || []).map(
                          (issue, index) => (
                            <div
                              key={index}
                              className="p-3 xs:p-6 bg-white rounded-xl border border-slate-200 shadow-sm"
                            >
                              <div className="flex items-start justify-between mb-2 xs:mb-4">
                                <div className="flex items-center space-x-2 xs:space-x-3">
                                  <div className="flex-shrink-0 p-1.5 xs:p-2.5 rounded-lg bg-purple-50">
                                    {getIssueIcon(issue.type)}
                                  </div>
                                  <h5 className="text-xs xs:text-base font-semibold text-slate-900">
                                    {issue.title || "Issue"}
                                  </h5>
                                </div>
                                <span
                                  className={`px-2 xs:px-3 py-0.5 xs:py-1 rounded-md text-[10px] xs:text-xs font-semibold whitespace-nowrap ${getSeverityColor(
                                    issue.severity || "low"
                                  )}`}
                                >
                                  {issue.severity || "low"}
                                </span>
                              </div>

                              <p className="text-slate-600 leading-relaxed text-[10px] xs:text-sm mb-2 xs:mb-4">
                                {issue.description || ""}
                              </p>

                              {issue.suggestion && (
                                <div className="p-2 xs:p-3 bg-purple-50 rounded-lg border-l-2 xs:border-l-4 border-purple-500">
                                  <div className="flex items-start space-x-1 xs:space-x-2">
                                    <span className="text-purple-600 flex-shrink-0 mt-0.5 text-xs xs:text-base">
                                      💡
                                    </span>
                                    <p className="text-purple-700 text-[10px] xs:text-sm leading-relaxed">
                                      {issue.suggestion}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Design Tab */}
                {activeTab === "design" && (
                  <div className="space-y-6">
                    {/* Design Analysis Section */}
                    {auditReport?.designAnalysis && (
                      <>
                        {/* Overall Design Score Header with Cards Inside */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-3 xs:p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-4 xs:mb-8">
                            <div className="flex items-center space-x-2 xs:space-x-3">
                              <SwatchIcon className="h-5 xs:h-7 w-5 xs:w-7 text-purple-500" />
                              <h3 className="text-base xs:text-2xl font-semibold text-slate-900">
                                Design Analysis
                              </h3>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-xl xs:text-3xl font-bold ${getScoreColor(
                                  auditReport?.categories?.visualDesign
                                    ?.score || 0
                                )}`}
                              >
                                {auditReport?.categories?.visualDesign?.score ||
                                  0}
                                /100
                              </div>
                              <p className="text-xs xs:text-base text-slate-500">
                                {getScoreLabel(
                                  auditReport?.categories?.visualDesign
                                    ?.score || 0
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Visual Hierarchy, Color Usage, Typography Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xs:gap-6">
                            {/* Visual Hierarchy */}
                            {auditReport.designAnalysis.visualHierarchy && (
                              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-3 xs:p-6 border border-pink-200/50 shadow-sm">
                                <div className="flex items-start justify-between mb-2 xs:mb-4">
                                  <h4 className="text-sm xs:text-lg font-bold text-slate-900">
                                    Visual Hierarchy
                                  </h4>
                                  <div className="text-right">
                                    <span className="text-lg xs:text-2xl font-bold text-pink-600">
                                      {
                                        auditReport.designAnalysis
                                          .visualHierarchy.score
                                      }
                                    </span>
                                    <span className="text-[10px] xs:text-sm text-pink-300 font-medium">
                                      /100
                                    </span>
                                  </div>
                                </div>

                                <p className="text-slate-700 mb-2 xs:mb-4 text-[10px] xs:text-sm leading-relaxed">
                                  {
                                    auditReport.designAnalysis.visualHierarchy
                                      .analysis
                                  }
                                </p>

                                {auditReport.designAnalysis.visualHierarchy
                                  .uxLawsApplied && (
                                  <div className="mb-4">
                                    <h5 className="font-semibold text-slate-900 text-xs mb-2">
                                      UX Laws Applied:
                                    </h5>
                                    <div className="flex flex-wrap gap-1 xs:gap-1.5">
                                      {auditReport.designAnalysis.visualHierarchy.uxLawsApplied.map(
                                        (law, index) => (
                                          <span
                                            key={index}
                                            className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-pink-200 text-pink-800 rounded-full text-[9px] xs:text-xs font-medium"
                                          >
                                            {law}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                                {auditReport.designAnalysis.visualHierarchy
                                  .improvements && (
                                  <div>
                                    <h5 className="font-semibold text-slate-900 text-[10px] xs:text-xs mb-1 xs:mb-2">
                                      Improvements:
                                    </h5>
                                    <p className="text-slate-700 text-[10px] xs:text-xs leading-relaxed">
                                      {
                                        auditReport.designAnalysis
                                          .visualHierarchy.improvements
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Color Usage */}
                            {auditReport.designAnalysis.colorUsage && (
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 xs:p-6 border border-blue-200/50">
                                <div className="flex items-start justify-between mb-2 xs:mb-4">
                                  <h4 className="text-sm xs:text-lg font-bold text-slate-900">
                                    Color Usage
                                  </h4>
                                  <div className="text-right">
                                    <span className="text-lg xs:text-2xl font-bold text-blue-600">
                                      {
                                        auditReport.designAnalysis.colorUsage
                                          .score
                                      }
                                    </span>
                                    <span className="text-[10px] xs:text-sm text-blue-300 font-medium">
                                      /100
                                    </span>
                                  </div>
                                </div>

                                {auditReport.designAnalysis.colorUsage
                                  .contrastRatios && (
                                  <div className="grid grid-cols-2 gap-1 xs:gap-2 mb-2 xs:mb-4">
                                    <div className="bg-white/70 rounded-lg p-2 xs:p-3 text-center border border-blue-200">
                                      <div className="text-base xs:text-lg font-bold text-slate-900">
                                        {
                                          auditReport.designAnalysis.colorUsage
                                            .contrastRatios.primary
                                        }
                                      </div>
                                      <div className="text-[10px] xs:text-xs text-slate-600 font-medium">
                                        Primary Contrast
                                      </div>
                                    </div>
                                    <div className="bg-white/70 rounded-lg p-2 xs:p-3 text-center border border-blue-200">
                                      <div className="text-base xs:text-lg font-bold text-slate-900">
                                        {
                                          auditReport.designAnalysis.colorUsage
                                            .contrastRatios.secondary
                                        }
                                      </div>
                                      <div className="text-[10px] xs:text-xs text-slate-600 font-medium">
                                        Secondary Contrast
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {auditReport.designAnalysis.colorUsage
                                  .psychologyImpact && (
                                  <div className="mb-2 xs:mb-4">
                                    <h5 className="font-semibold text-slate-900 text-[10px] xs:text-xs mb-1 xs:mb-2">
                                      Psychology Impact:
                                    </h5>
                                    <p className="text-slate-700 text-[10px] xs:text-xs leading-relaxed">
                                      {
                                        auditReport.designAnalysis.colorUsage
                                          .psychologyImpact
                                      }
                                    </p>
                                  </div>
                                )}

                                {auditReport.designAnalysis.colorUsage
                                  .improvements && (
                                  <div>
                                    <h5 className="font-semibold text-slate-900 text-[10px] xs:text-xs mb-1 xs:mb-2">
                                      Improvements:
                                    </h5>
                                    <p className="text-slate-700 text-[10px] xs:text-xs leading-relaxed">
                                      {
                                        auditReport.designAnalysis.colorUsage
                                          .improvements
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Typography */}
                            {auditReport.designAnalysis.typography && (
                              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-3 xs:p-6 border border-emerald-200/50">
                                <div className="flex items-start justify-between mb-2 xs:mb-4">
                                  <h4 className="text-sm xs:text-lg font-bold text-slate-900">
                                    Typography
                                  </h4>
                                  <div className="text-right">
                                    <span className="text-lg xs:text-2xl font-bold text-emerald-600">
                                      {
                                        auditReport.designAnalysis.typography
                                          .score
                                      }
                                    </span>
                                    <span className="text-[10px] xs:text-sm text-emerald-300 font-medium">
                                      /100
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1 xs:gap-2 mb-2 xs:mb-4">
                                  <div className="bg-white/70 rounded-lg p-2 xs:p-3 text-center border border-emerald-200">
                                    <div className="text-base xs:text-xl font-bold text-slate-900">
                                      {
                                        auditReport.designAnalysis.typography
                                          .readabilityScore
                                      }
                                    </div>
                                    <div className="text-[10px] xs:text-xs text-slate-600 font-medium">
                                      Readability Score
                                    </div>
                                  </div>
                                  <div className="bg-white/70 rounded-lg p-2 xs:p-3 text-center border border-emerald-200">
                                    <div className="text-base xs:text-xl font-bold text-slate-900">
                                      {
                                        auditReport.designAnalysis.typography
                                          .hierarchyEffectiveness
                                      }
                                    </div>
                                    <div className="text-[10px] xs:text-xs text-slate-600 font-medium">
                                      Hierarchy Effectiveness
                                    </div>
                                  </div>
                                </div>

                                {auditReport.designAnalysis.typography
                                  .emotionalResonance && (
                                  <div className="mb-2 xs:mb-4">
                                    <h5 className="font-semibold text-slate-900 text-[10px] xs:text-xs mb-1 xs:mb-2">
                                      Emotional Resonance:
                                    </h5>
                                    <p className="text-slate-700 text-[10px] xs:text-xs leading-relaxed">
                                      {
                                        auditReport.designAnalysis.typography
                                          .emotionalResonance
                                      }
                                    </p>
                                  </div>
                                )}

                                {auditReport.designAnalysis.typography
                                  .improvements && (
                                  <div>
                                    <h5 className="font-semibold text-slate-900 text-[10px] xs:text-xs mb-1 xs:mb-2">
                                      Improvements:
                                    </h5>
                                    <p className="text-slate-700 text-[10px] xs:text-xs leading-relaxed">
                                      {
                                        auditReport.designAnalysis.typography
                                          .improvements
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Design Issues & Recommendations */}
                          {auditReport?.categories?.visualDesign?.issues &&
                            auditReport.categories.visualDesign.issues.length >
                              0 && (
                              <div className="mt-4 xs:mt-8">
                                <h4 className="text-base xs:text-xl font-semibold text-slate-900 mb-3 xs:mb-6">
                                  Design Issues & Recommendations
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-6 max-h-96 overflow-y-auto custom-scrollbar">
                                  {auditReport.categories.visualDesign.issues.map(
                                    (issue, index) => (
                                      <div
                                        key={index}
                                        className="p-3 xs:p-6 bg-white rounded-xl border border-slate-200 shadow-sm"
                                      >
                                        <div className="flex items-start justify-between mb-2 xs:mb-4">
                                          <div className="flex items-center space-x-2 xs:space-x-3">
                                            <div className="flex-shrink-0 p-1.5 xs:p-2.5 rounded-lg bg-pink-50">
                                              {getIssueIcon(issue.type)}
                                            </div>
                                            <h5 className="text-base font-semibold text-slate-900">
                                              {issue.title || "Issue"}
                                            </h5>
                                          </div>
                                          <span
                                            className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${getSeverityColor(
                                              issue.severity || "low"
                                            )}`}
                                          >
                                            {issue.severity || "low"}
                                          </span>
                                        </div>

                                        <p className="text-slate-600 leading-relaxed text-[10px] xs:text-sm mb-2 xs:mb-4">
                                          {issue.description || ""}
                                        </p>

                                        {issue.suggestion && (
                                          <div className="p-2 xs:p-3 bg-pink-50 rounded-lg border-l-2 xs:border-l-4 border-pink-500">
                                            <div className="flex items-start space-x-1 xs:space-x-2">
                                              <span className="text-pink-600 flex-shrink-0 mt-0.5 text-xs xs:text-base">
                                                💡
                                              </span>
                                              <p className="text-pink-700 text-[10px] xs:text-sm leading-relaxed">
                                                {issue.suggestion}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Conversion Tab */}
                {activeTab === "conversion" && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-3 xs:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-4 xs:mb-8">
                      <div className="flex items-center space-x-2 xs:space-x-3">
                        <ChartBarIcon className="h-5 xs:h-7 w-5 xs:w-7 text-emerald-500" />
                        <h3 className="text-base xs:text-2xl font-semibold text-slate-900">
                          Conversion Optimization
                        </h3>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl xs:text-3xl font-bold ${getScoreColor(
                            auditReport?.conversionOptimization?.overallScore ||
                              0
                          )}`}
                        >
                          {auditReport?.conversionOptimization?.overallScore ||
                            0}
                          /100
                        </div>
                        <p className="text-xs xs:text-base text-slate-500">
                          {getScoreLabel(
                            auditReport?.conversionOptimization?.overallScore ||
                              0
                          )}
                        </p>
                      </div>
                    </div>

                    {auditReport?.conversionOptimization && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-6">
                        {/* CTA Effectiveness */}
                        {auditReport.conversionOptimization
                          .ctaEffectiveness && (
                          <div className="p-3 xs:p-8 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 rounded-2xl border border-emerald-200 shadow-lg">
                            <div className="flex items-center justify-between mb-3 xs:mb-6">
                              <div className="flex items-center">
                                <CursorArrowRaysIcon className="h-4 xs:h-6 w-4 xs:w-6 text-emerald-600 mr-2 xs:mr-4" />
                                <h4 className="text-sm xs:text-xl font-bold text-slate-900">
                                  CTA Effectiveness
                                </h4>
                              </div>
                              <div className="text-lg xs:text-3xl font-bold text-emerald-600">
                                {
                                  auditReport.conversionOptimization
                                    .ctaEffectiveness.score
                                }
                                <span className="text-xs xs:text-lg text-emerald-300">
                                  /100
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2 xs:space-y-3">
                              {auditReport.conversionOptimization
                                .ctaEffectiveness.placement && (
                                <div className="p-2 xs:p-3">
                                  <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                    Placement
                                  </span>
                                  <p className="text-slate-700 text-[10px] xs:text-sm">
                                    {
                                      auditReport.conversionOptimization
                                        .ctaEffectiveness.placement
                                    }
                                  </p>
                                </div>
                              )}
                              {auditReport.conversionOptimization
                                .ctaEffectiveness.copyPersuasiveness && (
                                <div className="p-2 xs:p-3">
                                  <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                    Copy Persuasiveness
                                  </span>
                                  <p className="text-slate-700 text-[10px] xs:text-sm">
                                    {
                                      auditReport.conversionOptimization
                                        .ctaEffectiveness.copyPersuasiveness
                                    }
                                  </p>
                                </div>
                              )}
                              {auditReport.conversionOptimization
                                .ctaEffectiveness.visualHierarchy && (
                                <div className="p-2 xs:p-3">
                                  <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                    Visual Hierarchy
                                  </span>
                                  <p className="text-slate-700 text-[10px] xs:text-sm">
                                    {
                                      auditReport.conversionOptimization
                                        .ctaEffectiveness.visualHierarchy
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Trust Signals */}
                        {auditReport.conversionOptimization.trustSignals && (
                          <div className="p-3 xs:p-8 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 rounded-2xl border border-blue-200 shadow-lg">
                            <div className="flex items-center justify-between mb-3 xs:mb-6">
                              <div className="flex items-center">
                                <ShieldCheckIcon className="h-4 xs:h-6 w-4 xs:w-6 text-blue-600 mr-2 xs:mr-4" />
                                <h4 className="text-sm xs:text-xl font-bold text-slate-900">
                                  Trust Signals
                                </h4>
                              </div>
                              <div className="text-lg xs:text-3xl font-bold text-blue-600">
                                {
                                  auditReport.conversionOptimization
                                    .trustSignals.score
                                }
                                <span className="text-xs xs:text-lg text-blue-300">
                                  /100
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 xs:space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 xs:gap-4">
                                {auditReport.conversionOptimization.trustSignals
                                  .present && (
                                  <div className="p-2 xs:p-3">
                                    <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1 xs:mb-2">
                                      Present Signals
                                    </span>
                                    <div className="space-y-1 xs:space-y-2">
                                      {auditReport.conversionOptimization.trustSignals.present.map(
                                        (signal, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center space-x-1 xs:space-x-2"
                                          >
                                            <CheckCircleIcon className="h-3 xs:h-4 w-3 xs:w-4 text-green-500" />
                                            <span className="text-slate-700 text-[10px] xs:text-sm">
                                              {signal}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                                {auditReport.conversionOptimization.trustSignals
                                  .missing && (
                                  <div className="p-2 xs:p-3">
                                    <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1 xs:mb-2">
                                      Missing Signals
                                    </span>
                                    <div className="space-y-1 xs:space-y-2">
                                      {auditReport.conversionOptimization.trustSignals.missing.map(
                                        (signal, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center space-x-1 xs:space-x-2"
                                          >
                                            <XMarkIcon className="h-3 xs:h-4 w-3 xs:w-4 text-red-500" />
                                            <span className="text-slate-700 text-[10px] xs:text-sm">
                                              {signal}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {auditReport.conversionOptimization.trustSignals
                                .improvements && (
                                <div className="p-2 xs:p-3">
                                  <span className="font-semibold text-slate-900 text-[10px] xs:text-sm block mb-1">
                                    Improvements
                                  </span>
                                  <p className="text-slate-700 text-[10px] xs:text-sm">
                                    {
                                      auditReport.conversionOptimization
                                        .trustSignals.improvements
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === "recommendations" && (
                  <div className="space-y-4">
                    {/* Critical Issues and Implementation Roadmap Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-6">
                      {/* Critical Issues */}
                      {auditReport?.criticalIssues &&
                        auditReport.criticalIssues.length > 0 && (
                          <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-2xl p-3 xs:p-6 border border-red-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-3 xs:mb-6">
                              <div className="flex items-center space-x-2 xs:space-x-3">
                                <div className="p-1.5 xs:p-2 rounded-lg">
                                  <ExclamationTriangleIcon className="h-4 xs:h-5 w-4 xs:w-5 text-red-600" />
                                </div>
                                <h3 className="text-sm xs:text-lg font-bold text-slate-900">
                                  Critical Issues
                                </h3>
                              </div>
                              <div className="text-right">
                                <span className="text-lg xs:text-2xl font-bold text-red-600">
                                  {auditReport.criticalIssues.length}
                                </span>
                                <span className="text-[10px] xs:text-sm text-red-300 font-medium">
                                  {auditReport.criticalIssues.length === 1
                                    ? " issue"
                                    : " issues"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {auditReport.criticalIssues.map(
                                (issue, index) => (
                                  <div
                                    key={index}
                                    className="bg-white/70 rounded-xl p-2 xs:p-4 border border-red-200/50"
                                  >
                                    <div className="flex items-start justify-between mb-2 xs:mb-3">
                                      <h4 className="text-xs xs:text-base font-semibold text-slate-900 flex-1">
                                        {issue.title}
                                      </h4>
                                      <div className="flex gap-1 xs:gap-2 ml-2 xs:ml-3">
                                        <span
                                          className={`px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md text-[10px] xs:text-xs font-medium ${getSeverityColor(
                                            issue.severity
                                          )}`}
                                        >
                                          {issue.severity}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-slate-700 text-[10px] xs:text-sm mb-2 xs:mb-3">
                                      {issue.description}
                                    </p>

                                    {issue.businessImpact && (
                                      <div className="mb-2 xs:mb-3 p-2 xs:p-3 bg-white/80 rounded-lg border border-red-100">
                                        <span className="font-medium text-slate-900 text-[10px] xs:text-xs block mb-1">
                                          Business Impact:
                                        </span>
                                        <p className="text-slate-700 text-[10px] xs:text-xs">
                                          {issue.businessImpact}
                                        </p>
                                      </div>
                                    )}

                                    {issue.implementation && (
                                      <div className="bg-white/80 p-2 xs:p-3 rounded-lg border border-red-100">
                                        <div className="grid grid-cols-2 gap-2 xs:gap-3 mb-1 xs:mb-2">
                                          <div>
                                            <span className="text-[10px] xs:text-xs font-medium text-slate-900 block">
                                              Effort:
                                            </span>
                                            <p className="text-slate-700 text-[10px] xs:text-xs">
                                              {issue.implementation.effort}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-[10px] xs:text-xs font-medium text-slate-900 block">
                                              Priority:
                                            </span>
                                            <p className="text-slate-700 text-[10px] xs:text-xs">
                                              {issue.implementation.priority}
                                            </p>
                                          </div>
                                        </div>
                                        {issue.wcagGuideline && (
                                          <div className="mb-2">
                                            <span className="text-xs font-medium text-slate-900 block">
                                              WCAG:
                                            </span>
                                            <p className="text-slate-700 text-xs">
                                              {issue.wcagGuideline}
                                            </p>
                                          </div>
                                        )}
                                        {issue.implementation.codeSnippet && (
                                          <div>
                                            <span className="text-xs font-medium text-slate-900 block mb-1">
                                              Code Fix:
                                            </span>
                                            <pre className="p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                                              <code>
                                                {
                                                  issue.implementation
                                                    .codeSnippet
                                                }
                                              </code>
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Implementation Roadmap */}
                      {auditReport?.implementationRoadmap && (
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg">
                                <ClockIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-900">
                                Implementation Roadmap
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-blue-600">
                                {
                                  Object.keys(auditReport.implementationRoadmap)
                                    .length
                                }
                              </span>
                              <span className="text-sm text-blue-300 font-medium">
                                {Object.keys(auditReport.implementationRoadmap)
                                  .length === 1
                                  ? " phase"
                                  : " phases"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(
                              auditReport.implementationRoadmap
                            ).map(([phaseKey, phase], index) => (
                              <div
                                key={phaseKey}
                                className="bg-white/70 rounded-xl p-4 border border-blue-200/50"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-base font-semibold text-slate-900 capitalize">
                                    {phaseKey}
                                  </h4>
                                  <div className="text-right text-sm">
                                    <div className="font-medium text-blue-600">
                                      {phase.timeframe}
                                    </div>
                                    <div className="text-slate-600">
                                      {phase.effort}
                                    </div>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-slate-900">
                                    Priority:
                                  </span>
                                  <span className="ml-2 text-blue-600 text-xs font-medium">
                                    {phase.priority}
                                  </span>
                                </div>
                                <div className="mb-3">
                                  <span className="text-xs font-medium text-slate-900 block mb-2">
                                    Tasks:
                                  </span>
                                  <div className="space-y-1">
                                    {phase.tasks.map((task, taskIndex) => (
                                      <div
                                        key={taskIndex}
                                        className="flex items-start space-x-2"
                                      >
                                        <CheckCircleIcon className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-700 text-xs">
                                          {task}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
                                  <span className="text-xs font-medium text-slate-900 block mb-1">
                                    Expected Impact:
                                  </span>
                                  <p className="text-slate-700 text-xs">
                                    {phase.expectedImpact}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UXAudit;
