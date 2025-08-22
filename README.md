# DesignMate AI 🎨

A full-stack web application that empowers UI/UX designers with intelligent design assistance using AI and automation.

## ✨ Features

### 🎯 Layout Generator
- AI-powered layout structure suggestions based on user prompts
- Responsive design recommendations
- Component placement optimization

### 🎨 Color Palette Recommender
- Brand-appropriate color scheme generation
- Keyword-based color matching
- Accessibility compliance checking

### 🔤 Font Suggestion Tool
- Industry-aligned font pairings
- Tone-appropriate typography recommendations
- Readability and hierarchy optimization

### 🔍 UX Audit Bot
- Real-time design feedback on uploaded UI screenshots
- Usability issue detection
- Accessibility compliance analysis

### 📊 Design Trends Analyzer
- Live tracking of trending UI styles
- Integration with Dribbble and Behance
- Trend visualization and insights

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI/ML**: Python microservices, Gemini APIs (GPT, Whisper)
- **Deployment**: Vercel (frontend), Render/Railway (backend + ML services)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Python 3.8+ (for ML services)
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd designmate-ai
   ```

2. **Install dependencies**
   ```bash
   npm i 
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

4. **Configure environment variables**
   - Add your MongoDB connection string
   - Add your Gemini API key
   - Configure other service keys as needed

5. **Start the development servers**
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📁 Project Structure

```
designmate-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
├── server/                # Node.js backend
│   ├── routes/            # API routes
│   ├── models/            # MongoDB models
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── ml-services/           # Python microservices
│   ├── layout-generator/
│   ├── color-analyzer/
│   ├── font-suggester/
│   └── trend-analyzer/
└── docs/                  # Documentation
```

## 🔧 API Endpoints

### Layout Generator
- `POST /api/layout/generate` - Generate layout suggestions
- `GET /api/layout/templates` - Get layout templates

### Color Palette
- `POST /api/colors/generate` - Generate color palettes
- `GET /api/colors/trends` - Get trending colors

### Font Suggestions
- `POST /api/fonts/suggest` - Get font recommendations
- `GET /api/fonts/pairings` - Get font pairings

### UX Audit
- `POST /api/audit/analyze` - Analyze uploaded designs
- `GET /api/audit/reports` - Get audit reports

### Design Trends
- `GET /api/trends/current` - Get current trends
- `GET /api/trends/platforms` - Get platform-specific trends
