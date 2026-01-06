const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { auth, checkUsageLimit } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  performUXAuditWithAI,
  buildUXAuditPrompt,
} = require("../services/aiService");
const User = require("../models/User");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

// Also use memory storage to get buffer for AI analysis
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Alternative upload for AI analysis with buffer
const uploadWithBuffer = multer({
  storage: memoryStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// @route   POST /api/audit/analyze
// @desc    Analyze uploaded design for UX issues
// @access  Private
// @route   POST /api/audit/analyze
// @desc    Analyze uploaded design for UX issues
// @access  Private
router.post(
  "/analyze",
  auth,
  checkUsageLimit("auditsPerformed"),
  uploadWithBuffer.single("image"),
  asyncHandler(async (req, res) => {
    const {
      context,
      focusAreas,
      description,
      model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
    } = req.body;

    if (!req.file && !description) {
      return res.status(400).json({
        success: false,
        message: "Provide an image or a structured description for analysis",
      });
    }

    try {
      let imageUrl = null;
      let imageBuffer = null;

      // If we have a file, save it to disk and prepare for AI analysis
      if (req.file) {
        // Save file to disk for URL access
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileExtension = req.file.originalname.split(".").pop();
        const filename = `image-${uniqueSuffix}.${fileExtension}`;
        const filepath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(filepath, req.file.buffer);

        imageUrl = `${req.protocol}://${req.get("host")}/uploads/${filename}`;
        imageBuffer = req.file.buffer;
      }

      // Parse focus areas if it's a string
      let parsedFocusAreas = focusAreas;
      if (typeof focusAreas === "string") {
        try {
          parsedFocusAreas = JSON.parse(focusAreas);
        } catch (e) {
          parsedFocusAreas = [focusAreas];
        }
      }

      // Perform UX audit using AI with enhanced image analysis
      const auditResult = await performUXAuditWithAI({
        imageUrl,
        imageBuffer,
        description,
        context: context || "general web application",
        focusAreas: parsedFocusAreas || ["all"],
        model,
      });

      // Ensure we have a valid audit result
      if (!auditResult) {
        throw new Error("Failed to generate audit result");
      }

      // Normalize audit result to ensure required fields exist
      const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
      const safeScore = (n, d = 75) => {
        if (typeof n === "number" && n >= 0 && n <= 100) return n;
        if (typeof n === "string") {
          const parsed = parseFloat(n);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
        }
        return d;
      };

      const safeIssues = (arr) =>
        asArray(arr)
          .filter(Boolean)
          .map((i) => ({
            type: i?.type || "info",
            title: i?.title || "UX Issue",
            description: i?.description || "No description available",
            severity: i?.severity || "low",
            suggestion: i?.suggestion || "Consider reviewing this area",
            priority: i?.priority || "low",
            wcagGuideline: i?.wcagGuideline || null,
          }));

      const normalizedAudit = {
        // Use executive summary score if available, otherwise fallback to overallScore
        overallScore: safeScore(
          auditResult?.executiveSummary?.overallScore ||
            auditResult?.overallScore,
          75
        ),
        summary:
          auditResult?.executiveSummary?.immediateImpression ||
          auditResult?.summary ||
          "UX audit completed successfully",

        // Include all enhanced analysis sections
        executiveSummary: auditResult?.executiveSummary || null,
        designAnalysis: auditResult?.designAnalysis || {
          visualHierarchy: "Visual hierarchy analysis not available",
          colorUsage: "Color usage analysis not available",
          typography: "Typography analysis not available",
          layout: "Layout analysis not available",
          branding: "Branding analysis not available",
        },
        accessibilityAudit: auditResult?.accessibilityAudit || null,
        usabilityAnalysis: auditResult?.usabilityAnalysis || null,
        conversionOptimization: auditResult?.conversionOptimization || null,
        responsiveDesign: auditResult?.responsiveDesign || null,
        uxWriting: auditResult?.uxWriting || null,
        implementationRoadmap: auditResult?.implementationRoadmap || null,
        competitiveBenchmark: auditResult?.competitiveBenchmark || null,
        designSystemRecommendations:
          auditResult?.designSystemRecommendations || null,
        categories: {
          accessibility: {
            score: safeScore(auditResult?.categories?.accessibility?.score, 70),
            issues: safeIssues(auditResult?.categories?.accessibility?.issues),
          },
          usability: {
            score: safeScore(auditResult?.categories?.usability?.score, 75),
            issues: safeIssues(auditResult?.categories?.usability?.issues),
          },
          visualDesign: {
            score: safeScore(auditResult?.categories?.visualDesign?.score, 80),
            issues: safeIssues(auditResult?.categories?.visualDesign?.issues),
          },
          performance: {
            score: safeScore(auditResult?.categories?.performance?.score, 75),
            issues: safeIssues(auditResult?.categories?.performance?.issues),
          },
          content: {
            score: safeScore(auditResult?.categories?.content?.score, 80),
            issues: safeIssues(auditResult?.categories?.content?.issues),
          },
          engagement: {
            score: safeScore(auditResult?.categories?.engagement?.score, 75),
            issues: safeIssues(auditResult?.categories?.engagement?.issues),
          },
        },
        recommendations: asArray(auditResult?.recommendations).map((rec) => ({
          priority: rec?.priority || "medium",
          category: rec?.category || "general",
          title: rec?.title || "Recommendation",
          description: rec?.description || "No description available",
          impact: rec?.impact || "Moderate impact expected",
          effort: rec?.effort || "Medium effort required",
          implementation:
            rec?.implementation || "Implementation steps not specified",
        })),
        strengths:
          asArray(auditResult?.strengths).length > 0
            ? auditResult.strengths
            : [
                "Design shows attention to visual details",
                "Layout structure is organized",
              ],
        quickWins:
          asArray(auditResult?.quickWins).length > 0
            ? auditResult.quickWins
            : [
                "Improve color contrast ratios",
                "Add focus indicators for better accessibility",
              ],
        criticalIssues: asArray(auditResult?.criticalIssues),
        designTokenSuggestions: auditResult?.designTokenSuggestions || {
          colors: "No specific color recommendations",
          typography: "No specific typography recommendations",
          spacing: "No specific spacing recommendations",
          components: "No specific component recommendations",
        },
        nextSteps: [], // Removed next steps generation
        competitorBenchmarks: asArray(auditResult?.competitorBenchmarks),
        metadata: {
          analysisDate: new Date().toISOString(),
          context: context || "general web application",
          focusAreas: parsedFocusAreas || ["all"],
          model: model,
          hasImage: !!req.file,
          imageUrl: imageUrl || null,
        },
      };

      // Update user usage
      const user = await User.findById(req.user.id);
      user.usage.auditsPerformed += 1;
      await user.save();

      res.json({
        success: true,
        message: "UX audit completed successfully",
        data: {
          audit: normalizedAudit,
          imageUrl,
        },
      });
    } catch (error) {
      console.error("UX audit error:", error);

      // Provide a meaningful error response with fallback data
      const fallbackAudit = {
        overallScore: 75,
        summary:
          "Unable to complete AI analysis. This is a baseline assessment.",
        categories: {
          accessibility: { score: 70, issues: [] },
          usability: { score: 75, issues: [] },
          visualDesign: { score: 80, issues: [] },
          performance: { score: 75, issues: [] },
          content: { score: 80, issues: [] },
          engagement: { score: 75, issues: [] },
        },
        recommendations: [
          {
            priority: "high",
            category: "accessibility",
            title: "Verify Color Contrast",
            description: "Ensure all text meets WCAG contrast requirements",
            impact: "Improved accessibility for all users",
            effort: "Low - CSS adjustments needed",
          },
        ],
        strengths: ["Clean visual appearance"],
        quickWins: ["Review accessibility standards"],
        nextSteps: [], // Removed next steps generation
        metadata: {
          analysisDate: new Date().toISOString(),
          context: context || "general web application",
          hasImage: !!req.file,
          error: "AI analysis temporarily unavailable",
        },
      };

      res.status(200).json({
        success: true,
        message: "UX audit completed with limited analysis",
        data: {
          audit: fallbackAudit,
          imageUrl: req.file
            ? `${req.protocol}://${req.get("host")}/uploads/${
                req.file.filename
              }`
            : null,
        },
      });
    }
  })
);

// @route   GET /api/audit/reports
// @desc    Get user's audit reports
// @access  Private
router.get(
  "/reports",
  auth,
  asyncHandler(async (req, res) => {
    // This would typically fetch from an Audit model
    // For now, return mock data
    const reports = [
      {
        id: "1",
        title: "Landing Page Analysis",
        imageUrl: "/uploads/sample-1.jpg",
        overallScore: 85,
        issues: 3,
        strengths: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: {
        reports,
      },
    });
  })
);

// @route   POST /api/audit/download
// @desc    Download audit report as PDF
// @access  Private
router.post(
  "/download",
  auth,
  asyncHandler(async (req, res) => {
    const { auditData, reportTitle = "UX Audit Report" } = req.body;

    if (!auditData) {
      return res.status(400).json({
        success: false,
        message: "Audit data is required for download",
      });
    }

    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set response headers for PDF download
      const filename = `${reportTitle
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_${Date.now()}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Pipe the PDF to the response
      doc.pipe(res);

      // Handle stream errors
      doc.on("error", (err) => {
        console.error("PDF document error:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "PDF generation failed",
            error: err.message,
          });
        }
      });

      res.on("error", (err) => {
        console.error("Response stream error:", err);
        if (!doc.destroyed) {
          doc.destroy();
        }
      });

      // Helper function to add a section header
      const addSectionHeader = (title, yPosition) => {
        doc
          .fontSize(16)
          .fillColor("#4F46E5")
          .text(title, 50, yPosition)
          .fontSize(12)
          .fillColor("#000000");
        return yPosition + 30;
      };

      // Helper function to add text with word wrapping
      const addTextBlock = (text, yPosition, options = {}) => {
        const maxWidth = options.width || 500;
        const fontSize = options.fontSize || 10;
        const color = options.color || "#000000";

        doc
          .fontSize(fontSize)
          .fillColor(color)
          .text(text, 50, yPosition, { width: maxWidth, align: "left" });

        return yPosition + doc.heightOfString(text, { width: maxWidth }) + 10;
      };

      // Add header
      doc
        .fontSize(24)
        .fillColor("#1F2937")
        .text("UX Audit Report", 50, 50)
        .fontSize(12)
        .fillColor("#6B7280")
        .text(`Generated on ${new Date().toLocaleDateString()}`, 50, 80);

      let currentY = 120;

      // Executive Summary
      if (auditData.executiveSummary) {
        currentY = addSectionHeader("📋 Executive Summary", currentY);

        doc
          .fontSize(14)
          .fillColor("#059669")
          .text(
            `Overall Score: ${
              auditData.executiveSummary.overallScore || auditData.overallScore
            }/100`,
            50,
            currentY
          );
        currentY += 25;

        if (auditData.executiveSummary.immediateImpression) {
          doc
            .fontSize(11)
            .fillColor("#000000")
            .text("Immediate Impression:", 50, currentY);
          currentY += 15;
          currentY = addTextBlock(
            auditData.executiveSummary.immediateImpression,
            currentY
          );
        }

        if (auditData.executiveSummary.businessImpact) {
          doc
            .fontSize(11)
            .fillColor("#000000")
            .text("Business Impact:", 50, currentY);
          currentY += 15;
          currentY = addTextBlock(
            auditData.executiveSummary.businessImpact,
            currentY
          );
        }

        if (auditData.executiveSummary.criticalIssuesCount) {
          doc
            .fontSize(11)
            .fillColor("#DC2626")
            .text(
              `Critical Issues: ${auditData.executiveSummary.criticalIssuesCount}`,
              50,
              currentY
            );
          currentY += 20;
        }

        if (auditData.executiveSummary.timeToImplementFixes) {
          doc
            .fontSize(11)
            .fillColor("#059669")
            .text(
              `Time to Fix: ${auditData.executiveSummary.timeToImplementFixes}`,
              50,
              currentY
            );
          currentY += 30;
        }
      }

      // Categories Overview
      if (auditData.categories) {
        currentY = addSectionHeader("📊 Categories Overview", currentY);

        Object.entries(auditData.categories).forEach(([category, data]) => {
          const categoryName = category.replace(/([A-Z])/g, " $1").trim();
          const capitalizedName =
            categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

          doc
            .fontSize(11)
            .fillColor("#374151")
            .text(`${capitalizedName}: ${data.score}/100`, 50, currentY);
          currentY += 15;
        });
        currentY += 15;
      }

      // Quick Wins
      if (auditData.quickWins && auditData.quickWins.length > 0) {
        currentY = addSectionHeader("⚡ Quick Wins", currentY);

        auditData.quickWins.forEach((quickWin, index) => {
          if (typeof quickWin === "object" && quickWin.title) {
            doc
              .fontSize(11)
              .fillColor("#059669")
              .text(`${index + 1}. ${quickWin.title}`, 50, currentY);
            currentY += 15;

            if (quickWin.implementation) {
              currentY = addTextBlock(
                `Implementation: ${quickWin.implementation}`,
                currentY,
                { fontSize: 9, color: "#6B7280" }
              );
            }

            if (quickWin.timeToImplement && quickWin.roiPotential) {
              doc
                .fontSize(9)
                .fillColor("#9CA3AF")
                .text(
                  `Time: ${quickWin.timeToImplement} | ROI: ${quickWin.roiPotential}`,
                  50,
                  currentY
                );
              currentY += 20;
            }
          } else if (typeof quickWin === "string") {
            doc
              .fontSize(11)
              .fillColor("#059669")
              .text(`${index + 1}. ${quickWin}`, 50, currentY);
            currentY += 20;
          }
        });
        currentY += 15;
      }

      // Critical Issues
      if (auditData.criticalIssues && auditData.criticalIssues.length > 0) {
        // Check if we need a new page
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        currentY = addSectionHeader("🚨 Critical Issues", currentY);

        auditData.criticalIssues.forEach((issue, index) => {
          if (typeof issue === "object" && issue.title) {
            doc
              .fontSize(11)
              .fillColor("#DC2626")
              .text(`${index + 1}. ${issue.title}`, 50, currentY);
            currentY += 15;

            if (issue.description) {
              currentY = addTextBlock(issue.description, currentY, {
                fontSize: 9,
                color: "#6B7280",
              });
            }

            if (issue.businessImpact) {
              doc
                .fontSize(9)
                .fillColor("#9CA3AF")
                .text(`Business Impact: ${issue.businessImpact}`, 50, currentY);
              currentY += 15;
            }

            if (issue.implementation && issue.implementation.effort) {
              doc
                .fontSize(9)
                .fillColor("#9CA3AF")
                .text(`Effort: ${issue.implementation.effort}`, 50, currentY);
              currentY += 20;
            }
          } else if (typeof issue === "string") {
            doc
              .fontSize(11)
              .fillColor("#DC2626")
              .text(`${index + 1}. ${issue}`, 50, currentY);
            currentY += 20;
          }
        });
        currentY += 15;
      }

      // Implementation Roadmap
      if (auditData.implementationRoadmap) {
        // Check if we need a new page
        if (currentY > 600) {
          doc.addPage();
          currentY = 50;
        }

        currentY = addSectionHeader("🗺️ Implementation Roadmap", currentY);

        ["phase1", "phase2", "phase3"].forEach((phase) => {
          const phaseData = auditData.implementationRoadmap[phase];
          if (phaseData) {
            doc
              .fontSize(12)
              .fillColor("#4F46E5")
              .text(
                `Phase ${phase.slice(-1)}: ${phaseData.timeframe}`,
                50,
                currentY
              );
            currentY += 15;

            if (phaseData.priority) {
              doc
                .fontSize(10)
                .fillColor("#374151")
                .text(`Priority: ${phaseData.priority}`, 50, currentY);
              currentY += 12;
            }

            if (phaseData.effort) {
              doc
                .fontSize(10)
                .fillColor("#374151")
                .text(`Effort: ${phaseData.effort}`, 50, currentY);
              currentY += 12;
            }

            if (phaseData.tasks && phaseData.tasks.length > 0) {
              doc
                .fontSize(10)
                .fillColor("#374151")
                .text("Tasks:", 50, currentY);
              currentY += 12;

              phaseData.tasks.forEach((task) => {
                doc
                  .fontSize(9)
                  .fillColor("#6B7280")
                  .text(`• ${task}`, 60, currentY);
                currentY += 12;
              });
            }
            currentY += 15;
          }
        });
      }

      // Strengths
      if (auditData.strengths && auditData.strengths.length > 0) {
        currentY = addSectionHeader("💪 Strengths", currentY);

        auditData.strengths.forEach((strength, index) => {
          doc
            .fontSize(10)
            .fillColor("#059669")
            .text(`• ${strength}`, 50, currentY);
          currentY += 15;
        });
        currentY += 15;
      }

      // Recommendations
      if (auditData.recommendations && auditData.recommendations.length > 0) {
        // Check if we need a new page
        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
        }

        currentY = addSectionHeader("📝 Recommendations", currentY);

        auditData.recommendations.slice(0, 5).forEach((rec, index) => {
          // Limit to first 5 to save space
          doc
            .fontSize(11)
            .fillColor("#4F46E5")
            .text(
              `${index + 1}. ${rec.title || "Recommendation"}`,
              50,
              currentY
            );
          currentY += 15;

          if (rec.description) {
            currentY = addTextBlock(rec.description, currentY, {
              fontSize: 9,
              color: "#6B7280",
            });
          }

          if (rec.impact || rec.effort) {
            doc
              .fontSize(8)
              .fillColor("#9CA3AF")
              .text(
                `Impact: ${rec.impact || "N/A"} | Effort: ${
                  rec.effort || "N/A"
                }`,
                50,
                currentY
              );
            currentY += 15;
          }
        });
      }

      // Footer - Add page numbers safely
      const pageCount = doc.bufferedPageRange().count;
      if (pageCount > 0) {
        for (let i = 1; i <= pageCount; i++) {
          try {
            doc.switchToPage(i - 1); // switchToPage uses 0-based indexing internally
            doc
              .fontSize(8)
              .fillColor("#9CA3AF")
              .text(
                `Generated by DesignMate AI | Page ${i} of ${pageCount}`,
                50,
                750
              );
          } catch (pageError) {
            console.warn(
              `Warning: Could not add footer to page ${i}:`,
              pageError.message
            );
          }
        }
      }

      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);

      // Clean up the PDF document properly
      try {
        if (doc && !doc.destroyed) {
          doc.end();
        }
      } catch (docError) {
        console.warn("Error cleaning up PDF document:", docError.message);
      }

      // Send error response only if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to generate PDF report",
          error: error.message,
        });
      }
    }
  })
);

module.exports = router;
