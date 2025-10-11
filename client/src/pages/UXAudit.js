import React, { useState, useRef } from "react";
import { auditAPI, apiUtils } from "../services/api";
import { motion } from "framer-motion";
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
} from "@heroicons/react/24/outline";

const UXAudit = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [context, setContext] = useState("general web application");
  const [focusAreas, setFocusAreas] = useState(["all"]);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef(null);

  const contextOptions = [
    { value: "general web application", label: "General Web App" },
    { value: "e-commerce", label: "E-commerce" },
    { value: "landing page", label: "Landing Page" },
    { value: "dashboard", label: "Dashboard" },
    { value: "mobile app", label: "Mobile App" },
    { value: "portfolio", label: "Portfolio" },
    { value: "blog", label: "Blog/Content" },
    { value: "saas", label: "SaaS Platform" },
  ];

  const focusAreaOptions = [
    { value: "all", label: "All Areas" },
    { value: "accessibility", label: "Accessibility" },
    { value: "usability", label: "Usability" },
    { value: "visualDesign", label: "Visual Design" },
    { value: "performance", label: "Performance" },
    { value: "content", label: "Content" },
    { value: "engagement", label: "Engagement" },
    { value: "mobile", label: "Mobile UX" },
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
    if (!uploadedImage && !description.trim()) {
      alert("Please upload an image or provide a description of your design");
      return;
    }

    setIsAnalyzing(true);
    try {
      const form = new FormData();

      if (uploadedImage) {
        form.append("image", uploadedImage.file);
      }

      form.append("context", context);
      form.append("focusAreas", JSON.stringify(focusAreas));
      form.append("description", description.trim());
      // Let server use its configured model from environment

      const { data } = await auditAPI.analyze(form);

      console.log("📥 FRONTEND: Received full API response:", data);

      const audit = data?.data?.audit;
      const imageUrl = data?.data?.imageUrl || uploadedImage?.preview;

      console.log("📋 FRONTEND: Extracted audit data:", {
        hasAudit: !!audit,
        auditKeys: audit ? Object.keys(audit) : [],
        hasExecutiveSummary: !!audit?.executiveSummary,
        hasDesignAnalysis: !!audit?.designAnalysis,
        hasAccessibilityAudit: !!audit?.accessibilityAudit,
        hasUsabilityAnalysis: !!audit?.usabilityAnalysis,
        hasConversionOptimization: !!audit?.conversionOptimization,
        hasResponsiveDesign: !!audit?.responsiveDesign,
        hasUxWriting: !!audit?.uxWriting,
        hasImplementationRoadmap: !!audit?.implementationRoadmap,
        hasCompetitiveBenchmark: !!audit?.competitiveBenchmark,
        hasDesignSystemRecommendations: !!audit?.designSystemRecommendations,
        overallScore: audit?.overallScore,
        executiveSummaryScore: audit?.executiveSummary?.overallScore,
      });

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

      // Create blob from response
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${reportTitle}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("✅ PDF report downloaded successfully");
    } catch (error) {
      const message = apiUtils.handleError(error);
      console.error("Error downloading report:", message);
      alert(`Failed to download report: ${message}`);
    }
  };

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
            <MagnifyingGlassIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">UX Audit</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your design and get instant AI-powered UX analysis. Receive
            detailed feedback on accessibility, usability, visual design, and
            performance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Upload Design
              </h2>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-300 hover:border-purple-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedImage ? (
                  <div className="space-y-4">
                    <img
                      src={uploadedImage.preview}
                      alt="Uploaded design"
                      className="max-w-full h-64 object-contain mx-auto rounded-lg"
                    />
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {uploadedImage.file.name}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your design here
                    </p>
                    <p className="text-gray-600 mb-4">
                      or click to browse files
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
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

              {/* Analysis Configuration */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Analysis Configuration
                </h3>

                {/* Context Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Context
                  </label>
                  <select
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {contextOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Focus Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Areas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {focusAreaOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={focusAreas.includes(option.value)}
                          onChange={(e) => {
                            if (option.value === "all") {
                              setFocusAreas(e.target.checked ? ["all"] : []);
                            } else {
                              if (e.target.checked) {
                                setFocusAreas((prev) =>
                                  prev
                                    .filter((f) => f !== "all")
                                    .concat(option.value)
                                );
                              } else {
                                setFocusAreas((prev) =>
                                  prev.filter((f) => f !== option.value)
                                );
                              }
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your design, target audience, goals, or specific concerns..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Adding context helps provide more targeted recommendations
                  </p>
                </div>
              </div>

              {/* Analyze Button */}
              {(uploadedImage || description.trim()) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  <button
                    onClick={analyzeDesign}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {isAnalyzing ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing Design...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                        Analyze Design
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {!auditReport ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Audit Report Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload a design and click "Analyze Design" to get detailed UX
                  feedback.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Accessibility</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Usability</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <PhotoIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Visual Design</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <ArrowPathIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>Performance</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Audit Report
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                      <ShareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className="p-2 text-indigo-600 hover:text-indigo-800 rounded-lg transition-colors hover:bg-indigo-50"
                      title="Download PDF Report"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Executive Summary */}
                {auditReport?.executiveSummary && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      📋 Executive Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Immediate Impression
                        </h4>
                        <p className="text-sm text-gray-700">
                          {auditReport.executiveSummary.immediateImpression}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Business Impact
                        </h4>
                        <p className="text-sm text-gray-700">
                          {auditReport.executiveSummary.businessImpact}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Critical Issues
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-red-600">
                            {auditReport.executiveSummary.criticalIssuesCount}
                          </span>
                          <span className="text-sm text-gray-600">
                            issues found
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <ClockIcon className="h-4 w-4 text-green-600 mr-1" />
                          Time to Fix
                        </h4>
                        <span className="text-lg font-semibold text-green-600">
                          {auditReport.executiveSummary.timeToImplementFixes}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Score */}
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Overall Score
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {auditReport.summary}
                      </p>
                      {auditReport?.metadata?.analysisDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Analyzed on{" "}
                          {new Date(
                            auditReport.metadata.analysisDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">
                        {auditReport?.executiveSummary?.overallScore ||
                          auditReport.overallScore}
                        /100
                      </div>
                      <div className="text-sm text-gray-500">
                        {(auditReport?.executiveSummary?.overallScore ||
                          auditReport.overallScore) >= 90
                          ? "Excellent"
                          : (auditReport?.executiveSummary?.overallScore ||
                              auditReport.overallScore) >= 70
                          ? "Good"
                          : (auditReport?.executiveSummary?.overallScore ||
                              auditReport.overallScore) >= 50
                          ? "Fair"
                          : "Needs Improvement"}
                      </div>
                      {auditReport?.metadata?.model && (
                        <div className="text-xs text-gray-400 mt-1">
                          AI Model: {auditReport.metadata.model}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            auditReport?.executiveSummary?.overallScore ||
                            auditReport.overallScore
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                  {Object.entries(auditReport?.categories || {}).map(
                    ([category, data]) => (
                      <div
                        key={category}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 capitalize">
                            {category.replace(/([A-Z])/g, " $1").trim()}
                          </h4>
                          <div className="text-right">
                            <div className="text-xl font-bold text-purple-600">
                              {data?.score ?? 0}/100
                            </div>
                            <div className="text-sm text-gray-500">
                              {data?.score >= 90
                                ? "Excellent"
                                : data?.score >= 70
                                ? "Good"
                                : data?.score >= 50
                                ? "Fair"
                                : "Needs Work"}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {(data?.issues || []).length === 0 ? (
                            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-green-700">
                                No significant issues found in this category
                              </span>
                            </div>
                          ) : (
                            (data?.issues || []).map((issue, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                              >
                                {getIssueIcon(issue.type)}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h5 className="font-medium text-gray-900">
                                      {issue?.title || "Issue"}
                                    </h5>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                        issue?.severity || "low"
                                      )}`}
                                    >
                                      {issue?.severity || "low"}
                                    </span>
                                    {issue?.priority && (
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          issue.priority === "high"
                                            ? "bg-red-100 text-red-700"
                                            : issue.priority === "medium"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {issue.priority} priority
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {issue?.description || ""}
                                  </p>
                                  {issue?.suggestion && (
                                    <p className="text-sm text-purple-600 font-medium">
                                      💡 {issue.suggestion}
                                    </p>
                                  )}
                                  {issue?.wcagGuideline && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      📋 WCAG: {issue.wcagGuideline}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Enhanced Design Analysis */}
                {auditReport?.designAnalysis && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      🎨 Design Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(auditReport.designAnalysis).map(
                        ([key, analysis]) => (
                          <div
                            key={key}
                            className="bg-white p-4 rounded-lg border"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </h5>
                              {analysis.score && (
                                <span className="text-lg font-bold text-purple-600">
                                  {analysis.score}/100
                                </span>
                              )}
                            </div>

                            {typeof analysis === "string" ? (
                              <p className="text-sm text-gray-600">
                                {analysis}
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {analysis.analysis && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-gray-700 mb-1">
                                      Analysis
                                    </h6>
                                    <p className="text-sm text-gray-600">
                                      {analysis.analysis}
                                    </p>
                                  </div>
                                )}

                                {analysis.uxLawsApplied &&
                                  Array.isArray(analysis.uxLawsApplied) && (
                                    <div>
                                      <h6 className="text-xs font-semibold text-gray-700 mb-1">
                                        UX Laws Applied
                                      </h6>
                                      <div className="flex flex-wrap gap-1">
                                        {analysis.uxLawsApplied.map(
                                          (law, idx) => (
                                            <span
                                              key={idx}
                                              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                                            >
                                              {law}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {analysis.contrastRatios && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-gray-700 mb-1">
                                      Contrast Ratios
                                    </h6>
                                    <div className="space-y-1">
                                      {Object.entries(
                                        analysis.contrastRatios
                                      ).map(([element, ratio]) => (
                                        <div
                                          key={element}
                                          className="flex justify-between text-xs"
                                        >
                                          <span className="text-gray-600 capitalize">
                                            {element}:
                                          </span>
                                          <span
                                            className={`font-mono ${
                                              parseFloat(ratio) >= 4.5
                                                ? "text-green-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            {ratio}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {analysis.psychologyImpact && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-gray-700 mb-1">
                                      Psychology Impact
                                    </h6>
                                    <p className="text-xs text-gray-600">
                                      {analysis.psychologyImpact}
                                    </p>
                                  </div>
                                )}

                                {analysis.emotionalResonance && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-gray-700 mb-1">
                                      Emotional Resonance
                                    </h6>
                                    <p className="text-xs text-gray-600">
                                      {analysis.emotionalResonance}
                                    </p>
                                  </div>
                                )}

                                {analysis.improvements && (
                                  <div>
                                    <h6 className="text-xs font-semibold text-blue-700 mb-1">
                                      💡 Improvements
                                    </h6>
                                    <p className="text-xs text-blue-600">
                                      {analysis.improvements}
                                    </p>
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

                {/* Enhanced Accessibility Audit */}
                {auditReport?.accessibilityAudit && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      ♿ Accessibility Audit
                      <span className="ml-2 text-xl font-bold text-blue-600">
                        {auditReport.accessibilityAudit.overallScore}/100
                      </span>
                    </h4>

                    {/* WCAG Compliance */}
                    <div className="mb-4 p-3 bg-white rounded-lg">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        WCAG Compliance
                      </h5>
                      <p className="text-sm text-gray-700">
                        {auditReport.accessibilityAudit.wcagCompliance}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Keyboard Navigation */}
                      {auditReport.accessibilityAudit.keyboardNavigation && (
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">
                              Keyboard Navigation
                            </h5>
                            <span className="text-sm font-bold text-blue-600">
                              {
                                auditReport.accessibilityAudit
                                  .keyboardNavigation.score
                              }
                              /100
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Tab Order:</strong>{" "}
                              {
                                auditReport.accessibilityAudit
                                  .keyboardNavigation.tabOrder
                              }
                            </p>
                            <p>
                              <strong>Focus Indicators:</strong>{" "}
                              {
                                auditReport.accessibilityAudit
                                  .keyboardNavigation.focusIndicators
                              }
                            </p>
                            <p>
                              <strong>Skip Links:</strong>{" "}
                              {
                                auditReport.accessibilityAudit
                                  .keyboardNavigation.skipLinks
                              }
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Color Contrast */}
                      {auditReport.accessibilityAudit.colorContrast && (
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">
                              Color Contrast
                            </h5>
                            <span className="text-sm font-bold text-blue-600">
                              {
                                auditReport.accessibilityAudit.colorContrast
                                  .score
                              }
                              /100
                            </span>
                          </div>
                          {auditReport.accessibilityAudit.colorContrast
                            .failures && (
                            <div className="space-y-2">
                              <h6 className="text-xs font-semibold text-red-700">
                                Failures:
                              </h6>
                              {auditReport.accessibilityAudit.colorContrast.failures.map(
                                (failure, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-red-50 rounded text-xs"
                                  >
                                    <p>
                                      <strong>{failure.element}</strong>
                                    </p>
                                    <p>
                                      Ratio:{" "}
                                      <span className="font-mono text-red-600">
                                        {failure.ratio}
                                      </span>{" "}
                                      (Required: {failure.required})
                                    </p>
                                    <p>Level: {failure.wcagLevel}</p>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Screen Reader */}
                      {auditReport.accessibilityAudit.screenReader && (
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">
                              Screen Reader
                            </h5>
                            <span className="text-sm font-bold text-blue-600">
                              {
                                auditReport.accessibilityAudit.screenReader
                                  .score
                              }
                              /100
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Alt Text:</strong>{" "}
                              {
                                auditReport.accessibilityAudit.screenReader
                                  .altTextQuality
                              }
                            </p>
                            <p>
                              <strong>Structure:</strong>{" "}
                              {
                                auditReport.accessibilityAudit.screenReader
                                  .semanticStructure
                              }
                            </p>
                            <p>
                              <strong>ARIA Labels:</strong>{" "}
                              {
                                auditReport.accessibilityAudit.screenReader
                                  .ariaLabels
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Code Snippets */}
                    {auditReport.accessibilityAudit.codeSnippets && (
                      <div className="mt-4 p-3 bg-white rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-3">
                          🛠️ Code Fixes
                        </h5>
                        <div className="space-y-3">
                          {auditReport.accessibilityAudit.codeSnippets.map(
                            (snippet, idx) => (
                              <div
                                key={idx}
                                className="border border-gray-200 rounded p-3"
                              >
                                <h6 className="text-sm font-semibold text-gray-800 mb-2">
                                  {snippet.issue}
                                </h6>
                                <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                                  <code>{snippet.fix}</code>
                                </pre>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Usability Analysis */}
                {auditReport?.usabilityAnalysis && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <CursorArrowRaysIcon className="h-5 w-5 text-green-600 mr-2" />
                      🎯 Usability Analysis
                      <span className="ml-2 text-xl font-bold text-green-600">
                        {auditReport.usabilityAnalysis.overallScore}/100
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(auditReport.usabilityAnalysis)
                        .filter(([key]) => key !== "overallScore")
                        .map(([key, analysis]) => (
                          <div key={key} className="bg-white p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </h5>
                              {analysis.score && (
                                <span className="text-sm font-bold text-green-600">
                                  {analysis.score}/100
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              {Object.entries(analysis)
                                .filter(([subKey]) => subKey !== "score")
                                .map(([subKey, value]) => (
                                  <p key={subKey}>
                                    <strong className="text-gray-800 capitalize">
                                      {subKey.replace(/([A-Z])/g, " $1").trim()}
                                      :
                                    </strong>{" "}
                                    {value}
                                  </p>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Conversion Optimization */}
                {auditReport?.conversionOptimization && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      💰 Conversion Optimization
                      <span className="ml-2 text-xl font-bold text-yellow-600">
                        {auditReport.conversionOptimization.overallScore}/100
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(auditReport.conversionOptimization)
                        .filter(([key]) => key !== "overallScore")
                        .map(([key, analysis]) => (
                          <div key={key} className="bg-white p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </h5>
                              {analysis.score && (
                                <span className="text-sm font-bold text-yellow-600">
                                  {analysis.score}/100
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              {Object.entries(analysis)
                                .filter(([subKey]) => subKey !== "score")
                                .map(([subKey, value]) => (
                                  <div key={subKey}>
                                    <strong className="text-gray-800 capitalize">
                                      {subKey.replace(/([A-Z])/g, " $1").trim()}
                                      :
                                    </strong>
                                    {Array.isArray(value) ? (
                                      <ul className="list-disc list-inside ml-2 mt-1">
                                        {value.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span> {value}</span>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Responsive Design */}
                {auditReport?.responsiveDesign && (
                  <div className="mt-6 p-4 bg-pink-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-pink-600 mr-2" />
                      📱 Responsive Design
                      <span className="ml-2 text-xl font-bold text-pink-600">
                        {auditReport.responsiveDesign.overallScore}/100
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(auditReport.responsiveDesign)
                        .filter(([key]) => key !== "overallScore")
                        .map(([key, analysis]) => (
                          <div key={key} className="bg-white p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </h5>
                              {analysis.score && (
                                <span className="text-sm font-bold text-pink-600">
                                  {analysis.score}/100
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              {Object.entries(analysis)
                                .filter(([subKey]) => subKey !== "score")
                                .map(([subKey, value]) => (
                                  <p key={subKey}>
                                    <strong className="text-gray-800 capitalize">
                                      {subKey.replace(/([A-Z])/g, " $1").trim()}
                                      :
                                    </strong>{" "}
                                    {value}
                                  </p>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Enhanced UX Writing */}
                {auditReport?.uxWriting && (
                  <div className="mt-6 p-4 bg-teal-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <PencilIcon className="h-5 w-5 text-teal-600 mr-2" />
                      ✍️ UX Writing
                      <span className="ml-2 text-xl font-bold text-teal-600">
                        {auditReport.uxWriting.overallScore}/100
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(auditReport.uxWriting)
                        .filter(([key]) => key !== "overallScore")
                        .map(([key, analysis]) => (
                          <div key={key} className="bg-white p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </h5>
                              {analysis.score && (
                                <span className="text-sm font-bold text-teal-600">
                                  {analysis.score}/100
                                </span>
                              )}
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              {Object.entries(analysis)
                                .filter(([subKey]) => subKey !== "score")
                                .map(([subKey, value]) => (
                                  <p key={subKey}>
                                    <strong className="text-gray-800 capitalize">
                                      {subKey.replace(/([A-Z])/g, " $1").trim()}
                                      :
                                    </strong>{" "}
                                    {value}
                                  </p>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Detailed Recommendations */}
                {auditReport?.recommendations &&
                  auditReport.recommendations.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Detailed Recommendations
                      </h4>
                      <div className="space-y-4">
                        {auditReport.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg border-l-4 border-blue-500"
                          >
                            <div className="flex items-start space-x-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  rec.priority === "high"
                                    ? "bg-red-100 text-red-700"
                                    : rec.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {rec.priority || "medium"} priority
                              </span>
                              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {rec.category || "general"}
                              </span>
                            </div>
                            <h5 className="font-semibold text-gray-900 mt-2">
                              {rec.title || "Recommendation"}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {rec.description || ""}
                            </p>
                            {rec.impact && (
                              <p className="text-sm text-green-600 mt-2">
                                📈 <strong>Impact:</strong> {rec.impact}
                              </p>
                            )}
                            {rec.effort && (
                              <p className="text-sm text-blue-600 mt-1">
                                ⏱️ <strong>Effort:</strong> {rec.effort}
                              </p>
                            )}
                            {rec.implementation && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-xs text-gray-600">
                                  <strong>Implementation:</strong>{" "}
                                  {rec.implementation}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Strengths & Quick Wins */}
                {((auditReport?.strengths &&
                  auditReport.strengths.length > 0) ||
                  (auditReport?.quickWins &&
                    auditReport.quickWins.length > 0)) && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    {auditReport?.strengths &&
                      auditReport.strengths.length > 0 && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <HeartIcon className="h-5 w-5 text-green-600 mr-2" />
                            Strengths
                          </h4>
                          <ul className="space-y-2">
                            {auditReport.strengths.map((strength, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-2"
                              >
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  {strength}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Quick Wins */}
                    {auditReport?.quickWins &&
                      auditReport.quickWins.length > 0 && (
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            ⚡ Quick Wins
                          </h4>
                          <div className="space-y-3">
                            {(auditReport?.quickWins || []).map(
                              (quickWin, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 rounded-lg border-l-4 border-orange-400"
                                >
                                  {typeof quickWin === "string" ? (
                                    // Handle simple string format (backward compatibility)
                                    <div className="flex items-start space-x-2">
                                      <span className="text-orange-600 font-bold text-sm">
                                        ▶
                                      </span>
                                      <span className="text-sm text-gray-700">
                                        {quickWin}
                                      </span>
                                    </div>
                                  ) : (
                                    // Handle enhanced object format
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-semibold text-gray-900 text-sm">
                                          {quickWin.title}
                                        </h5>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                            {quickWin.timeToImplement}
                                          </span>
                                          <span
                                            className={`text-xs px-2 py-1 rounded ${
                                              quickWin.roiPotential === "High"
                                                ? "bg-green-100 text-green-700"
                                                : quickWin.roiPotential ===
                                                  "Medium"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-blue-100 text-blue-700"
                                            }`}
                                          >
                                            {quickWin.roiPotential} ROI
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">
                                        {quickWin.implementation}
                                      </p>
                                      <p className="text-xs text-green-600">
                                        📈 <strong>Impact:</strong>{" "}
                                        {quickWin.expectedImpact}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Critical Issues */}
                {auditReport?.criticalIssues &&
                  auditReport.criticalIssues.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                        Critical Issues
                      </h4>
                      <div className="space-y-4">
                        {auditReport.criticalIssues.map((issue, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg border-l-4 border-red-500"
                          >
                            {typeof issue === "string" ? (
                              // Handle simple string format (backward compatibility)
                              <div className="flex items-start space-x-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mt-0.5" />
                                <span className="text-sm text-red-700">
                                  {issue}
                                </span>
                              </div>
                            ) : (
                              // Handle enhanced object format
                              <div>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        issue.severity === "high"
                                          ? "bg-red-100 text-red-700"
                                          : issue.severity === "medium"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-orange-100 text-orange-700"
                                      }`}
                                    >
                                      {issue.severity} severity
                                    </span>
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                      {issue.category}
                                    </span>
                                  </div>
                                </div>
                                <h5 className="font-semibold text-red-900 mb-2">
                                  {issue.title}
                                </h5>
                                <p className="text-sm text-red-700 mb-2">
                                  {issue.description}
                                </p>
                                {issue.businessImpact && (
                                  <p className="text-sm text-red-600 mb-2">
                                    💼 <strong>Business Impact:</strong>{" "}
                                    {issue.businessImpact}
                                  </p>
                                )}
                                {issue.uxLawViolated && (
                                  <p className="text-sm text-purple-600 mb-2">
                                    🧠 <strong>UX Law:</strong>{" "}
                                    {issue.uxLawViolated}
                                  </p>
                                )}
                                {issue.wcagGuideline && (
                                  <p className="text-sm text-blue-600 mb-2">
                                    📋 <strong>WCAG:</strong>{" "}
                                    {issue.wcagGuideline}
                                  </p>
                                )}
                                {issue.implementation && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded">
                                    <h6 className="text-xs font-semibold text-gray-700 mb-1">
                                      Implementation Guide
                                    </h6>
                                    {issue.implementation.effort && (
                                      <p className="text-xs text-gray-600 mb-1">
                                        ⏱️ <strong>Effort:</strong>{" "}
                                        {issue.implementation.effort}
                                      </p>
                                    )}
                                    {issue.implementation.priority && (
                                      <p className="text-xs text-gray-600 mb-1">
                                        🎯 <strong>Priority:</strong>{" "}
                                        {issue.implementation.priority}
                                      </p>
                                    )}
                                    {issue.implementation.codeSnippet && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-600 mb-1">
                                          💻 <strong>Code Fix:</strong>
                                        </p>
                                        <code className="text-xs bg-gray-800 text-green-400 p-2 rounded block">
                                          {issue.implementation.codeSnippet}
                                        </code>
                                      </div>
                                    )}
                                    {issue.implementation.suggestions &&
                                      Array.isArray(
                                        issue.implementation.suggestions
                                      ) && (
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-600 mb-1">
                                            💡 <strong>Suggestions:</strong>
                                          </p>
                                          <ul className="text-xs text-gray-600 list-disc list-inside">
                                            {issue.implementation.suggestions.map(
                                              (suggestion, idx) => (
                                                <li key={idx}>{suggestion}</li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Implementation Roadmap */}
                {auditReport?.implementationRoadmap && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      🗺️ Implementation Roadmap
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {auditReport.implementationRoadmap.phase1 && (
                        <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                          <h5 className="font-semibold text-green-900 mb-2">
                            Phase 1:{" "}
                            {auditReport.implementationRoadmap.phase1.timeframe}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">
                            {auditReport.implementationRoadmap.phase1.priority}
                          </p>
                          <p className="text-xs text-green-600 mb-2">
                            ⏱️ {auditReport.implementationRoadmap.phase1.effort}
                          </p>
                          <p className="text-xs text-green-600">
                            📈{" "}
                            {
                              auditReport.implementationRoadmap.phase1
                                .expectedImpact
                            }
                          </p>
                          {auditReport.implementationRoadmap.phase1.tasks && (
                            <ul className="text-xs text-gray-600 mt-2 list-disc list-inside">
                              {auditReport.implementationRoadmap.phase1.tasks.map(
                                (task, idx) => (
                                  <li key={idx}>{task}</li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                      {auditReport.implementationRoadmap.phase2 && (
                        <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500">
                          <h5 className="font-semibold text-yellow-900 mb-2">
                            Phase 2:{" "}
                            {auditReport.implementationRoadmap.phase2.timeframe}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">
                            {auditReport.implementationRoadmap.phase2.priority}
                          </p>
                          <p className="text-xs text-yellow-600 mb-2">
                            ⏱️ {auditReport.implementationRoadmap.phase2.effort}
                          </p>
                          <p className="text-xs text-yellow-600">
                            📈{" "}
                            {
                              auditReport.implementationRoadmap.phase2
                                .expectedImpact
                            }
                          </p>
                          {auditReport.implementationRoadmap.phase2.tasks && (
                            <ul className="text-xs text-gray-600 mt-2 list-disc list-inside">
                              {auditReport.implementationRoadmap.phase2.tasks.map(
                                (task, idx) => (
                                  <li key={idx}>{task}</li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                      {auditReport.implementationRoadmap.phase3 && (
                        <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                          <h5 className="font-semibold text-blue-900 mb-2">
                            Phase 3:{" "}
                            {auditReport.implementationRoadmap.phase3.timeframe}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">
                            {auditReport.implementationRoadmap.phase3.priority}
                          </p>
                          <p className="text-xs text-blue-600 mb-2">
                            ⏱️ {auditReport.implementationRoadmap.phase3.effort}
                          </p>
                          <p className="text-xs text-blue-600">
                            📈{" "}
                            {
                              auditReport.implementationRoadmap.phase3
                                .expectedImpact
                            }
                          </p>
                          {auditReport.implementationRoadmap.phase3.tasks && (
                            <ul className="text-xs text-gray-600 mt-2 list-disc list-inside">
                              {auditReport.implementationRoadmap.phase3.tasks.map(
                                (task, idx) => (
                                  <li key={idx}>{task}</li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Design System Recommendations */}
                {auditReport?.designSystemRecommendations && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <CogIcon className="h-5 w-5 text-slate-600 mr-2" />
                      🔧 Design System Recommendations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Component Library */}
                      {auditReport.designSystemRecommendations
                        .componentLibrary && (
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">
                              Component Library
                            </h5>
                            {auditReport.designSystemRecommendations
                              .componentLibrary.score && (
                              <span className="text-sm font-bold text-slate-600">
                                {
                                  auditReport.designSystemRecommendations
                                    .componentLibrary.score
                                }
                                /100
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Consistency:</strong>{" "}
                              {
                                auditReport.designSystemRecommendations
                                  .componentLibrary.consistency
                              }
                            </p>
                            <p>
                              <strong>Scalability:</strong>{" "}
                              {
                                auditReport.designSystemRecommendations
                                  .componentLibrary.scalability
                              }
                            </p>
                            {auditReport.designSystemRecommendations
                              .componentLibrary.recommendations && (
                              <div>
                                <h6 className="text-xs font-semibold text-gray-700 mt-2 mb-1">
                                  Recommendations:
                                </h6>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                  {auditReport.designSystemRecommendations.componentLibrary.recommendations.map(
                                    (rec, idx) => (
                                      <li key={idx}>{rec}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Token System */}
                      {auditReport.designSystemRecommendations.tokenSystem && (
                        <div className="bg-white p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Token System
                          </h5>
                          <div className="space-y-2 text-sm">
                            {Object.entries(
                              auditReport.designSystemRecommendations
                                .tokenSystem
                            ).map(([key, value]) => (
                              <p key={key}>
                                <strong className="capitalize">{key}:</strong>{" "}
                                {value}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Competitive Benchmark */}
                {auditReport?.competitiveBenchmark && (
                  <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      📊 Competitive Benchmark
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Industry Position
                        </h5>
                        <p className="text-sm text-gray-600">
                          {auditReport.competitiveBenchmark.industryPosition}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Opportunity Areas
                        </h5>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {(
                            auditReport.competitiveBenchmark.opportunityAreas ||
                            []
                          ).map((area, idx) => (
                            <li key={idx}>{area}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Strengths vs Competitors
                        </h5>
                        <ul className="text-sm text-green-600 list-disc list-inside">
                          {(
                            auditReport.competitiveBenchmark
                              .strengthsVsCompetitors || []
                          ).map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Gaps vs Leaders
                        </h5>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {(
                            auditReport.competitiveBenchmark.gapsVsLeaders || []
                          ).map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    🎯 Next Steps
                  </h4>
                  <ol className="space-y-2">
                    {(auditReport?.nextSteps || []).map((step, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UXAudit;
