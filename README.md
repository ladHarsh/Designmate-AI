# DesignMate AI

![License](https://img.shields.io/badge/license-MIT-yellow)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)
![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-black)

DesignMate AI is an **AI-powered design intelligence platform** built for UI/UX designers.  
It leverages **Google Gemini 2.5 Flash** to generate intelligent design recommendations, automate UX analysis, and assist designers in making informed, accessible, and modern design decisions.

The system is designed as a **decision-support tool**, not a creative replacement.

---

## TL;DR
DesignMate AI combines **AI reasoning + design heuristics** to help designers generate font pairings, color palettes, UX audits, and layout ideas while maintaining **human control and explainability**.

---

## 🔗 Links
- **Live Application**: https://designmate-ai.vercel.app/
- **Video Demo**: https://youtu.be/ReS6LMpoUiQ
- **Portfolio**: https://harshlad.vercel.app/
- **GitHub**: https://github.com/ladHarsh/Designmate-AI

---

## Problem Statement
UI/UX designers often rely on intuition, trend articles, or fragmented tools when making design decisions.  
This results in:

- **Inconsistent typography and color usage**  
- **Poor accessibility compliance** (WCAG violations)  
- **Time-consuming manual UX audits**  
- **Difficulty staying updated** with design trends  

Existing AI tools focus on **generation**, not **analysis or guidance**.

---

## Solution Overview
DesignMate AI acts as a **design intelligence layer** that assists designers by:

- Analyzing design inputs and intent
- Generating explainable, structured recommendations
- Validating accessibility and usability compliance
- Preserving full creative control for designers

It augments decision-making instead of automating creativity.

---

## Core Features

### 🎨 AI Color Palette Generator
- **AI-generated color schemes** with harmony analysis (Monochromatic, Analogous, Complementary, Triadic, Tetradic, Split-Complementary)
- **Mood-based generation** (Calm, Energetic, Professional, Playful, Elegant, Bold, Minimal, Warm, Cool)
- **Industry-specific palettes** (Technology, Healthcare, Finance, Education, Retail, Food, Travel, Fashion, Entertainment)
- **Advanced gradient generation** (Linear, Radial, Glass morphism effects)
- **WCAG accessibility validation** (AA/AAA compliance with contrast ratio calculations)
- **Export formats**: CSS, SCSS, JSON, Tailwind
- **Live color preview** with copy-to-clipboard functionality

**Technical Implementation:**
- Prompt-engineered AI requests with structured JSON outputs
- Color theory algorithms for harmony validation
- Real-time accessibility scoring using WCAG 2.1 guidelines

---

### 🔤 AI Font Suggestion Tool
- **Context-aware font pairing** recommendations
- **Project-specific suggestions** (Website, Mobile App, Logo, Branding, Print, Presentation, Social Media)
- **Tone-based recommendations** (Modern, Professional, Elegant, Playful, Bold, Minimal, Vintage, Futuristic)
- **Brand personality analysis** (Innovative, Trustworthy, Friendly, Luxurious, Energetic, Calm, Creative, Traditional)
- **WCAG accessibility compliance** (A, AA, AAA levels)
- **Ready-to-use CSS snippets** with Google Fonts integration
- **Live font previews** with customizable preview text
- **Usage guidelines** (Headings, Body, Accents with font weights and line heights)

**Technical Implementation:**
- AI-powered font matching based on design psychology
- Google Fonts API integration
- Accessibility scoring for readability

---

### 🔍 UX Audit Bot
- **Automated UX and accessibility analysis** with image upload support
- **Multi-category scoring** (Accessibility, Usability, Visual Design, Performance, Content)
- **Issue detection** with severity levels (Critical, High, Medium, Low)
- **Quick wins identification** (easy fixes with high impact)
- **Critical issues flagging** (must-fix items)
- **Executive summary** with overall score (0-100)
- **Time-to-fix estimates** for implementation planning
- **Downloadable PDF reports** for stakeholder sharing

**Technical Implementation:**
- Image-to-text analysis using Gemini Vision API
- Rule-based accessibility checks (WCAG 2.1)
- PDFKit for report generation
- Structured AI prompts for consistent evaluation

---

### 📐 AI Layout Generator
- **AI-powered layout structure generation**
- **Multiple layout types** (Landing Page, Dashboard, E-commerce, Blog, Portfolio, Web App)
- **Style variations** (Modern, Minimalist, Bold, Professional, Creative, Elegant)
- **Component-based generation** (Hero, Navigation, Footer, Features, Testimonials, CTA, Gallery, Pricing, FAQ)
- **Industry-specific layouts** with target audience optimization
- **Color scheme integration** from palette generator
- **Responsive design patterns** with mobile-first approach
- **Live HTML/CSS preview** with syntax highlighting

**Technical Implementation:**
- Structured prompt engineering for consistent HTML/CSS output
- Component-based architecture for modular layouts
- Responsive design patterns using modern CSS

---

### 📈 Design Trends Analyzer

*Designed to surface early signals rather than predict long-term trends.*

- **Live trend tracking** from Reddit design communities
- **Platform-specific trends** (web_design, design, userexperience, UI_Design subreddits)
- **Industry-specific insights** (Technology, Fashion, Finance, Healthcare)
- **Keyword frequency analysis** (Glassmorphism, Neumorphism, Dark Mode, Micro-interactions, etc.)
- **Trend forecasting** with confidence scores
- **Emerging trends identification** with adoption stages

**Technical Implementation:**
- Reddit API integration for real-time data
- Keyword extraction and frequency analysis
- Trend scoring algorithms

---

## AI System Design

### Model & Inference
- **AI Provider**: Google Gemini
- **Primary Model**: `gemini-2.5-flash`
- **Fallback Strategy**: Automatic retry with constrained prompts
- **Temperature**: Low (0.2-0.4) for consistency-focused outputs
- **Usage Pattern**: Prompt-engineered structured JSON outputs

### Design Philosophy
- **No raw free-form generation** - All outputs follow strict schemas
- **All AI outputs are**:
  - ✅ Interpretable (with reasoning)
  - ✅ Editable (full user control)
  - ✅ Context-aware (based on user inputs)
- **Human designer always remains the final decision-maker**

### Prompt Engineering Strategy
- Structured prompts with clear output schemas
- Few-shot examples for consistency
- Explicit constraints and validation rules
- Fallback mechanisms for API failures

---

## Backend Architecture

**Design Pattern**: Stateless REST API with modular service-based structure

### Key Components
- **Authentication**: JWT-based with HTTP-only cookies
- **AI Orchestration**: Centralized `aiService.js` with retry logic
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Error Handling**: Centralized middleware with sanitized responses
- **File Upload**: Multer with Sharp for image processing

### API Routes
```
/api/auth/*      - Authentication (register, login, logout, password reset)
/api/colors/*    - Color palette generation and management
/api/fonts/*     - Font suggestion generation
/api/layout/*    - Layout generation and templates
/api/audit/*     - UX audit analysis and PDF reports
/api/trends/*    - Design trends from Reddit
/api/users/*     - User profile and usage tracking
```

### Database Schema (MongoDB)
- **User**: Authentication, preferences, subscription, usage tracking
- **ColorPalette**: Generated palettes with metadata
- **Layout**: Generated layouts with components
- **GeneratedSite**: Full site generations

---

## Tech Stack

### Frontend
- **React 18.2.0** - UI library with hooks
- **Tailwind CSS 3.3.6** - Utility-first CSS
- **Framer Motion 10.16.16** - Animation library
- **React Router 6.20.1** - Client-side routing
- **Axios 1.6.2** - HTTP client
- **React Hook Form 7.48.2** - Form state management
- **React Hot Toast 2.4.1** - Toast notifications
- **Recharts 2.8.0** - Data visualization
- **React Colorful 5.6.1** - Color picker
- **React Dropzone 14.2.3** - File upload
- **Heroicons 2.0.18** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.18.2** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 8.0.3** - MongoDB ODM
- **JWT 9.0.2** - Authentication tokens
- **bcryptjs 2.4.3** - Password hashing (12 salt rounds)
- **Google Generative AI 0.24.1** - Gemini API client
- **Multer 1.4.5** - File upload middleware
- **Sharp 0.33.0** - Image processing
- **PDFKit 0.17.2** - PDF generation
- **Helmet 7.1.0** - Security headers
- **CORS 2.8.5** - Cross-origin resource sharing
- **Express Rate Limit 7.1.5** - Rate limiting
- **Joi 17.11.0** & **Zod 3.25.76** - Input validation

### Security
- **Bcrypt password hashing** (12 salt rounds)
- **HTTP-only cookies** (prevents XSS)
- **CORS configuration** (specific origins)
- **Helmet.js security headers** (CSP, HSTS, X-Frame-Options)
- **Input validation** (Joi + Zod schemas)
- **Rate limiting** (100 req/15min per IP)
- **MongoDB injection prevention** (Mongoose sanitization)
- **File upload validation** (type and size restrictions)

---

## Project Structure

```text
DesignMate-AI/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components (Layout, LivePreview)
│   │   ├── contexts/          # React contexts (AuthContext)
│   │   ├── pages/             # Page components (11 pages)
│   │   │   ├── Home.js
│   │   │   ├── Dashboard.js
│   │   │   ├── ColorPalette.js
│   │   │   ├── FontSuggestions.js
│   │   │   ├── LayoutGenerator.js
│   │   │   ├── UXAudit.js
│   │   │   ├── DesignTrends.js
│   │   │   ├── Profile.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── NotFound.js
│   │   ├── services/          # API client (axios)
│   │   ├── App.js             # Main app with routing
│   │   └── index.js           # Entry point
│   └── public/
│
├── server/                     # Express backend
│   ├── routes/                # API routes (7 modules)
│   │   ├── auth.js
│   │   ├── colors.js
│   │   ├── fonts.js
│   │   ├── layout.js
│   │   ├── audit.js
│   │   ├── trends.js
│   │   └── users.js
│   ├── services/              # Business logic
│   │   ├── aiService.js       # Gemini AI integration (3500+ lines)
│   │   ├── paletteService.js  # Color theory algorithms
│   │   └── scraperService.js  # Reddit API integration
│   ├── models/                # Mongoose schemas (4 models)
│   │   ├── User.js
│   │   ├── ColorPalette.js
│   │   ├── Layout.js
│   │   └── GeneratedSite.js
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js            # JWT verification
│   │   └── errorHandler.js    # Centralized error handling
│   └── index.js               # Server entry point
│
├── package.json               # Root scripts
└── README.md                  # This file
```

---

## Setup & Run

### Prerequisites
- **Node.js v14+**
- **MongoDB instance** (local or MongoDB Atlas)
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))

### Installation

```bash
git clone https://github.com/ladHarsh/Designmate-AI.git
cd Designmate-AI
npm run install-all
```

### Environment Variables

**Server** (`server/.env`)
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
```

**Client** (`client/.env`)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

### Run in Development

```bash
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## Deployment

### Frontend (Vercel)
1. Deploy `client/` folder to Vercel
2. Set environment variables:
   - `REACT_APP_API_URL=https://your-backend.onrender.com`
   - `REACT_APP_GEMINI_API_KEY=your_key`
3. Build command: `npm run build`
4. Output directory: `build`

### Backend (Render)
1. Deploy `server/` folder as Web Service
2. Set environment variables (see above)
3. Build command: `npm ci --omit=dev`
4. Start command: `node index.js`

**Note**: Free Render instances may experience cold starts (~30-60s delay after inactivity).

---

## Evaluation & Reliability

DesignMate AI does **not** claim creative correctness.

Instead, it is evaluated on:
- ✅ **Consistency** of recommendations across similar inputs
- ✅ **Accessibility compliance** accuracy (WCAG 2.1)
- ✅ **Alignment** with established design heuristics
- ✅ **Reduction** in manual audit time (measured via user feedback)

All AI outputs are **advisory and editable** by the designer.

---

## Engineering Learnings

- **Designing AI systems for decision support**, not automation
- **Prompt engineering** for structured, deterministic outputs
- **Managing AI latency** in user-facing systems (retry logic, fallbacks)
- **Balancing creativity** with accessibility constraints
- **Building full-stack AI SaaS** architectures (MERN + AI)
- **Real-time data integration** (Reddit API for trends)
- **PDF generation** from structured data (PDFKit)
- **Image analysis** with vision models (Gemini Vision)

---

## Limitations

- ❌ No direct design file ingestion (Figma API integration pending)
- ❌ AI output quality depends on input clarity and specificity
- ❌ Accessibility checks are rule-based, not visual perception
- ❌ No offline inference support (requires internet for AI)
- ❌ Free tier has usage limits (20 layouts, 10 palettes, 15 fonts, 23 audits)

---

## Future Improvements

- [ ] **Figma plugin integration** for direct design import
- [ ] **Design system consistency scoring** across multiple pages
- [ ] **Visual layout analysis** using computer vision
- [ ] **Vector-based design pattern retrieval** from databases
- [ ] **Team collaboration features** (shared workspaces, comments)
- [ ] **A/B testing suggestions** based on UX principles
- [ ] **Component library generator** from design tokens
- [ ] **Real-time collaboration** with WebSockets
- [ ] **Mobile app** (React Native)
- [ ] **Advanced analytics dashboard** with usage insights

---

## Author

**Harsh Lad**  
AI Engineer & Full Stack Developer

- **GitHub**: https://github.com/ladHarsh
- **Portfolio**: https://harshlad.vercel.app/
- **LinkedIn**: [Connect with me](https://linkedin.com/in/harshlad)
- **Email**: harshlad.dev@gmail.com

---

## License

This project is licensed under the **MIT License**.

---

## Acknowledgments

- **Google Gemini AI** - Powerful AI capabilities
- **Reddit API** - Real-time design trend data
- **MongoDB Atlas** - Cloud database hosting
- **Vercel** - Frontend deployment
- **Render** - Backend deployment
- **Open Source Community** - React, Express, Tailwind, and all dependencies

---

<div align="center">

**DesignMate AI** - Empowering designers with artificial intelligence 🚀

Made with ❤️ by [Harsh Lad](https://github.com/ladHarsh)

⭐ Star this repo if you find it helpful!

</div>
