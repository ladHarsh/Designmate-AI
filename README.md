# DesignMate AI 🎨🤖

> AI-powered design assistance platform for UI/UX designers

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green.svg)](https://www.mongodb.com/)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)

## 📋 Overview

DesignMate AI is a comprehensive design intelligence platform that leverages Google Gemini AI to provide intelligent design recommendations, automated analysis, and smart suggestions for UI/UX designers.

### ✨ Key Features

- 🔤 **AI Font Suggestions** - Smart typography recommendations with perfect pairings
- 🎨 **Color Palette Generator** - AI-powered color schemes with harmony analysis
- 🔍 **UX Audit Tool** - Automated user experience analysis and recommendations
- 📐 **Layout Generator** - Intelligent layout structure suggestions
- 💼 **Brand Intelligence** - Brand analysis and visual identity insights
- 📈 **Design Trends** - Current design trend analysis and tracking
- 👤 **User Management** - Authentication, profiles, and usage tracking

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Google Gemini API Key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ladHarsh/Designmate-AI.git
   cd DesignMate
   ```

2. **Install all dependencies**

   ```bash
   npm run install-all
   ```

3. **Configure environment variables**

   Create `.env` file in the `server` directory:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   PORT=5000
   NODE_ENV=development
   ```

   Create `.env` file in the `client` directory:

   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the application**

   ```bash
   # Development mode (runs both client and server)
   npm run dev

   # Or run separately
   npm run server  # Start server only
   npm run client  # Start client only
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🛠️ Technology Stack

### Frontend

- **React** 18.2.0 - UI library
- **Tailwind CSS** 3.3.6 - Styling framework
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Recharts** - Data visualization

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Google Gemini AI** - AI integration
- **Multer** - File uploads
- **Sharp** - Image processing

## 📁 Project Structure

```
DesignMate/
├── client/          # React frontend application
├── server/          # Express backend API
├── package.json     # Root package file
└── README.md        # This file
```

## 🎯 Main Features

### 1. AI Font Suggestions

Generate intelligent typography recommendations based on:

- Project type (Website, Mobile App, Logo, etc.)
- Design tone (Modern, Professional, Elegant, etc.)
- Brand personality traits
- Accessibility requirements (WCAG A/AA/AAA)

**Output:**

- 3-5 curated font combinations
- Usage guidelines (headings, body, accents)
- Ready-to-use CSS code
- Google Fonts integration
- Best use cases and reasoning

### 2. Color Palette Generator

Create beautiful color schemes with:

- AI-powered color generation
- Color harmony analysis
- Accessibility testing
- Multiple export formats
- Custom palette editing

### 3. UX Audit Tool

Automated design analysis providing:

- Accessibility compliance checking
- Usability recommendations
- Visual design critique
- Performance suggestions
- Improvement action items

### 4. Additional Tools

- **Layout Generator** - Smart layout structure suggestions
- **Brand Intelligence** - Brand analysis and insights
- **Design Trends** - Current trend analysis and tracking

## 📖 API Documentation

### Authentication

```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - User login
GET    /api/auth/me          - Get current user
```

### Font Suggestions

```
POST   /api/fonts/suggest    - Generate AI font suggestions
GET    /api/fonts/pairings   - Get font pairings
GET    /api/fonts/trends     - Get font trends
```

### Color Palettes

```
POST   /api/colors/generate  - Generate color palettes
GET    /api/colors/harmonies - Get color harmonies
POST   /api/colors/analyze   - Analyze color accessibility
```

### UX Audit

```
POST   /api/audit/analyze    - Perform UX audit
GET    /api/audit/history    - Get audit history
POST   /api/audit/upload     - Upload design for analysis
```

## 🔐 Security Features

- JWT-based authentication
- Bcrypt password hashing
- HTTP-only cookies
- Helmet.js security headers
- CORS configuration
- Rate limiting
- Input validation
- XSS protection

## 🎨 UI/UX Design

- **Design System:** Purple/Blue gradient theme
- **Typography:** Inter, Source Sans Pro
- **Components:** Tailwind CSS utility-first
- **Animations:** Framer Motion
- **Responsive:** Mobile-first approach
- **Accessibility:** WCAG 2.1 AA compliance

## 📊 Environment Variables

### Server (.env)

```env
MONGODB_URI=              # MongoDB connection string
JWT_SECRET=               # JWT secret key
JWT_EXPIRE=30d           # Token expiration
GEMINI_API_KEY=          # Google Gemini API key
PORT=5000                # Server port
NODE_ENV=development     # Environment
```

### Client (.env)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

## 🚀 Deployment

### Build for Production

```bash
# Build client
npm run build

# Start production server
npm start
```

## 🌐 Deployment (Vercel + Render)

### Frontend (Vercel)

1. Deploy the `client` folder to Vercel.
2. In Vercel Project → Settings → Environment Variables, set:
   - `REACT_APP_API_URL=https://designmate-ai.onrender.com/api`
   - `REACT_APP_WS_URL=wss://designmate-ai.onrender.com`
3. Build command: `npm run build`
4. Output directory: `build`

### Backend (Render)

1. Deploy the `server` folder as a Web Service on Render.
2. Set environment variables in Render dashboard:
   - `PORT=10000` (Render sets this automatically)
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://DesignMate:Harsh%402817@designmate-ai.c3vuytv.mongodb.net/designmate-ai`
   - `JWT_SECRET=your_jwt_secret_key`
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `GEMINI_FALLBACK_MODEL=gemini-2.5-flash`
   - `CORS_ORIGIN=https://designmate-ai.vercel.app`
3. Build command: `npm ci --omit=dev`
4. Start command: `node index.js`

### Cross-Origin Authentication

- Cookies are set with `sameSite: 'none'` and `secure: true` in production for cross-origin authentication between Vercel and Render.
- Users must log in again after deployment due to cookie changes.

### Notes

- Free Render services may sleep after inactivity, causing cold starts (30–60s delay).
- For persistent uploads, use external storage (Cloudinary/S3) instead of local `/uploads`.
- For local development, set `REACT_APP_API_URL` and `CORS_ORIGIN` to `http://localhost:5000` and `http://localhost:3000` respectively.

## 📝 Scripts

```bash
npm run dev          # Run both client and server in development
npm run server       # Run server only
npm run client       # Run client only
npm run build        # Build client for production
npm start            # Start production server
npm run install-all  # Install all dependencies
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**DesignMate AI Team**

- GitHub: [@ladHarsh](https://github.com/ladHarsh)
- Repository: [Designmate-AI](https://github.com/ladHarsh/Designmate-AI)

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - AI capabilities
- [React](https://reactjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Express.js](https://expressjs.com/) - Backend framework

## 📞 Support

For support, email support@designmate.ai or open an issue in the GitHub repository.

---

**DesignMate AI** - Empowering designers with artificial intelligence 🚀

Made with ❤️ by the DesignMate team
