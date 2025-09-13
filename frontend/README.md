# AI Medical Doctor - Frontend# Getting Started with Create React App



A modern, responsive React application that provides an intuitive interface for AI-powered medical consultations. Built with TypeScript, React Router, and Tailwind CSS for a professional healthcare experience.This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).



## 🚀 Features## Available Scripts



- **🏥 Professional Medical Interface**: Clean, healthcare-focused designIn the project directory, you can run:

- **🎙️ Audio Recording**: Record symptoms and medical concerns with built-in microphone

- **📷 Medical Image Upload**: Upload and analyze medical images (X-rays, MRIs, skin conditions)### `npm start`

- **🤖 AI-Powered Analysis**: Get instant medical insights with ICD-10 codes

- **🔊 Audio Responses**: Listen to AI-generated doctor responsesRuns the app in the development mode.\

- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devicesOpen [http://localhost:3000](http://localhost:3000) to view it in the browser.

- **♿ Accessibility**: Screen reader friendly with proper ARIA labels

- **🎨 Modern UI/UX**: Gradient backgrounds, smooth animations, and professional stylingThe page will reload if you make edits.\

You will also see any lint errors in the console.

## 🏗️ Architecture

### `npm test`

```

frontend/Launches the test runner in the interactive watch mode.\

├── public/                 # Static assets and HTML templateSee the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

│   ├── index.html         # Main HTML template

│   ├── favicon.ico        # App icon### `npm run build`

│   └── manifest.json      # PWA manifest

├── src/Builds the app for production to the `build` folder.\

│   ├── components/        # React componentsIt correctly bundles React in production mode and optimizes the build for the best performance.

│   │   ├── LandingPage.tsx        # Homepage with features

│   │   ├── LandingPage.css        # Landing page stylesThe build is minified and the filenames include the hashes.\

│   │   ├── ConsultationPage.tsx   # Main consultation interfaceYour app is ready to be deployed!

│   │   ├── ConsultationPage.css   # Consultation page styles

│   │   └── MedicalAICards.tsx     # Feature cards componentSee the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

│   ├── services/          # API services and utilities

│   │   └── api.ts         # Backend API integration### `npm run eject`

│   ├── App.tsx           # Main application component

│   ├── App.css           # Global application styles**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

│   ├── index.tsx         # Application entry point

│   └── index.css         # Global CSS and Tailwind importsIf you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

├── package.json          # Dependencies and scripts

├── tsconfig.json         # TypeScript configurationInstead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

├── tailwind.config.js    # Tailwind CSS configuration

├── postcss.config.js     # PostCSS configurationYou don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

└── README.md            # This file

```## Learn More



## 🛠️ Technology StackYou can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).



- **Framework**: React 19.1.1 with TypeScriptTo learn React, check out the [React documentation](https://reactjs.org/).

- **Routing**: React Router DOM 7.8.2
- **Styling**: Tailwind CSS (via PostCSS)
- **HTTP Client**: Axios 1.11.0
- **Icons**: Lucide React 0.542.0
- **Audio/Media**: Web APIs (MediaRecorder, Audio)
- **Testing**: React Testing Library & Jest
- **Build Tool**: Create React App 5.0.1

## 📋 Prerequisites

- Node.js 16.0+ and npm/yarn
- Backend API running on `http://localhost:8000`
- Modern web browser with microphone access

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install
# or
yarn install
```

### 2. Environment Setup

Create a `.env` file (if needed for custom API URLs):
```bash
REACT_APP_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
# Start the development server
npm start
# or
yarn start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Network Access**: http://[your-ip]:3000

### 4. Build for Production

```bash
# Create production build
npm run build
# or
yarn build
```

## 🎨 User Interface

### Landing Page (`/`)
- **Hero Section**: Eye-catching gradient design with animated medical icons
- **Features Overview**: Three main capabilities showcased with icons
- **Professional Navigation**: Responsive header with mobile menu
- **Call-to-Action**: Direct links to start consultation
- **Footer**: Important disclaimers and quick links

### Consultation Page (`/consultation`)
- **Audio Recording**: Real-time microphone access with visual feedback
- **Image Upload**: Drag-and-drop or click-to-upload medical images
- **Live Preview**: Image preview with removal options
- **Analysis Results**: Structured display of AI responses
- **Audio Playback**: Listen to generated doctor responses
- **Progress Indicators**: Loading states and error handling

## 🔧 Components Overview

### Core Components

#### `App.tsx`
- Main application component
- Handles routing between pages
- Global error boundary

#### `LandingPage.tsx`
- Marketing and information page
- Feature highlights and descriptions
- Professional healthcare branding
- Responsive design with mobile navigation

#### `ConsultationPage.tsx`
- Main medical consultation interface
- Audio recording functionality
- Image upload and preview
- API integration for analysis
- Results display and audio playback

#### `MedicalAICards.tsx`
- Reusable feature cards
- Hover animations and styling
- Icon integration

### Services

#### `api.ts`
- Axios-based API client
- Type-safe interfaces
- Error handling
- File upload support
- Multiple API endpoints

## 🎤 Audio Features

### Recording Capabilities
- **Real-time Recording**: Browser-native MediaRecorder API
- **Visual Feedback**: Recording indicator and controls
- **Format Support**: WAV output for best compatibility
- **Error Handling**: Microphone permission management
- **Browser Compatibility**: Modern browser support

### Audio Playback
- **Generated Responses**: Play AI doctor responses
- **Controls**: Play/pause functionality
- **Progress Indication**: Visual playback status
- **Format Support**: MP3 audio from backend

## 📷 Image Upload System

### Supported Formats
- JPEG, PNG, GIF, WebP
- Medical images (X-rays, MRIs, CT scans, dermatology)
- File size validation
- Preview generation

### Upload Methods
- **Click to Upload**: Traditional file input
- **Drag and Drop**: Modern file drop zone
- **Preview**: Immediate image preview
- **Removal**: Easy image removal with confirmation

## 🌐 API Integration

### Service Architecture
```typescript
// Complete medical consultation
consultationService.medicalConsultation(image?, audio?)

// Individual services
consultationService.transcribeAudio(audio)
consultationService.analyzeImage(image, transcription?)
consultationService.textToSpeech(text)
consultationService.healthCheck()
```

### Error Handling
- Network error recovery
- API timeout handling
- User-friendly error messages
- Fallback UI states

### Loading States
- Spinner animations
- Progress indicators
- Disabled states during processing
- Success/error feedback

## 🎨 Styling & Design

### Design System
- **Color Palette**: Professional medical blues and greens
- **Typography**: Clean, readable fonts optimized for medical content
- **Spacing**: Consistent spacing scale using Tailwind utilities
- **Animations**: Subtle hover effects and loading animations

### Responsive Design
```css
/* Mobile-first approach */
.container {
  @apply w-full px-4;
}

/* Tablet styles */
@screen md {
  .container {
    @apply px-6;
  }
}

/* Desktop styles */
@screen lg {
  .container {
    @apply px-8 max-w-7xl mx-auto;
  }
}
```

### Component Styling
- **Landing Page**: Gradient backgrounds, floating animations
- **Consultation**: Clean forms, professional medical styling
- **Cards**: Glassmorphism effects, hover animations
- **Buttons**: Gradient buttons with hover states

## 📱 Mobile Experience

### Responsive Features
- **Touch-Friendly**: Large tap targets and intuitive gestures
- **Mobile Navigation**: Collapsible hamburger menu
- **Optimized Layouts**: Stack layouts for smaller screens
- **Performance**: Optimized images and lazy loading

### Mobile-Specific Considerations
- Microphone access on mobile browsers
- File upload from camera roll
- Touch gestures for navigation
- Reduced animations for better performance

## ♿ Accessibility

### ARIA Implementation
- Semantic HTML structure
- Screen reader friendly
- Keyboard navigation support
- Focus management

### Accessibility Features
- High contrast color ratios
- Keyboard-only navigation
- Screen reader announcements
- Alternative text for images

## 🔒 Security & Privacy

### Data Handling
- No persistent storage of medical data
- Secure file transmission to backend
- HTTPS enforcement in production
- Privacy-focused design

### CORS Configuration
```typescript
// API configured for local development
const API_BASE_URL = 'http://localhost:8000';
```

## 🚀 Deployment

### Development
```bash
npm start  # Runs on http://localhost:3000
```

### Production Build
```bash
npm run build  # Creates optimized build/
```

### Static Hosting (Netlify/Vercel)
```bash
# Build command
npm run build

# Publish directory
build/

# Environment variables
REACT_APP_API_BASE_URL=https://your-backend-api.com
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
EXPOSE 80
```

## 🧪 Testing

### Available Scripts
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Testing Architecture
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API service testing
- **E2E Tests**: User flow testing (can be added)

### Example Test
```typescript
import { render, screen } from '@testing-library/react';
import LandingPage from './components/LandingPage';

test('renders landing page header', () => {
  render(<LandingPage />);
  const headerElement = screen.getByText(/AI Medical Doctor/i);
  expect(headerElement).toBeInTheDocument();
});
```

## 📊 Performance

### Optimization Strategies
- **Code Splitting**: Lazy loading of routes
- **Image Optimization**: Responsive images and WebP format
- **Bundle Analysis**: webpack-bundle-analyzer for optimization
- **Caching**: Browser caching strategies

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## 🔧 Configuration

### Tailwind Configuration
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom medical theme colors
        medical: {
          blue: '#1e40af',
          green: '#059669',
        }
      }
    },
  },
  plugins: [],
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx"
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   ```
   Error: Failed to access microphone
   ```
   **Solution**: Check browser permissions and use HTTPS

2. **API Connection Failed**
   ```
   Error: Network Error
   ```
   **Solution**: Ensure backend is running on port 8000

3. **File Upload Issues**
   ```
   Error: Failed to upload image
   ```
   **Solution**: Check file format and size limits

4. **Build Errors**
   ```
   Error: Module not found
   ```
   **Solution**: Run `npm install` to install dependencies

### Debug Mode
Enable React Developer Tools for component debugging:
```bash
npm install -g react-devtools
```

## 📈 Analytics & Monitoring

### Recommended Tools
- **Google Analytics**: User behavior tracking
- **Sentry**: Error monitoring and performance
- **LogRocket**: Session replay and debugging
- **Web Vitals**: Core performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Follow the code style guidelines
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use meaningful component and variable names
- Add JSDoc comments for complex functions

## 📄 License

This project is for educational purposes only. Not intended for actual medical diagnosis.

## 🙏 Acknowledgments

- **React Team**: For the excellent framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Lucide Icons**: For the beautiful icon set
- **Create React App**: For the build tooling

---

**⚠️ Medical Disclaimer**: This application is for educational purposes only and should not replace professional medical advice. Always consult qualified healthcare providers for medical concerns.

**🔒 Privacy Notice**: This application processes medical images and audio locally and securely transmits data to the backend API. No medical data is permanently stored.