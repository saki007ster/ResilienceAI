# 🧠 Resilience AI

> **An offline-first AI wellness coach as a Progressive Web App with local LLM capabilities**

Resilience AI is a cutting-edge wellness coaching application that combines local artificial intelligence with human expert support. The app runs entirely offline using a local LLM (Gemma), features a lip-synced video avatar, and allows users to schedule meetings with human coaches via Google Calendar integration.

## 🎯 Vision

Create an accessible, privacy-first mental wellness platform that:
- **Works completely offline** for privacy and accessibility
- **Provides instant AI coaching** through conversational interface
- **Features engaging avatar interactions** with realistic lip-sync
- **Seamlessly connects to human experts** when needed
- **Runs on any device** as a Progressive Web App

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser with service worker support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ResilienceAI

# Install dependencies
npm install

# Start development server
ng serve

# Open browser to http://localhost:4200
```

### Current Features ✅
- **PWA Shell**: Instant loading, offline-capable app shell
- **Navigation**: Clean routing between Chat, Schedule, and Settings
- **Service Worker**: Precaching for fast, reliable performance
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Core Architecture**: Services and components ready for AI integration

## 🏗️ Technology Stack

### Frontend
- **Angular 17+** - Modern web framework with standalone components
- **TypeScript** - Type-safe development
- **SCSS** - Advanced styling with Material Design principles
- **PWA** - Service workers, manifest, offline capabilities

### AI & ML (Planned)
- **Transformers.js** - Client-side machine learning
- **Gemma LLM** - Local language model execution
- **WebGPU/WASM** - Hardware acceleration with fallbacks
- **HeadTTS** - Text-to-speech with viseme data
- **vLitejs** - Video avatar integration

### Integrations (Planned)
- **Google Calendar API** - Meeting scheduling
- **Google OAuth 2.0** - Secure authentication
- **Background Sync API** - Offline scheduling
- **IndexedDB** - Local data storage

## 📋 Development Roadmap

### ✅ Phase 1: PWA Shell & Core Services (COMPLETED)
**Goal**: Establish the foundation with PWA capabilities and navigation

**Tasks Completed**:
- [x] Initialize Angular 17+ project with PWA support
- [x] Configure manifest and service worker for app shell caching
- [x] Create core services: `AiCoachService`, `CalendarService`, `GoogleAuthService`, `HeadTtsService`
- [x] Create main components: `ChatWindow`, `SettingsPage`, `ScheduleFlow`
- [x] Set up routing and professional UI design

**Deliverable**: ✅ Working PWA shell with navigation and basic UI

---

### 🔄 Phase 2: Offline AI Core (IN PROGRESS)
**Goal**: Implement local LLM execution with advanced caching strategies

**Tasks**:
- [ ] **2.1**: Advanced service worker caching for LLM model download
  - Background Fetch API for ~529MB Gemma model
  - Dedicated `rai-model-v1` cache management
  - User consent flow for large downloads
- [ ] **2.2 & 2.3**: Transformers.js integration and prompt engineering
  - WebGPU acceleration with WASM fallback
  - Constitutional prompting for wellness coaching
  - Conversation history management

**Deliverable**: AI coach responding with contextual wellness advice offline

---

### 📋 Phase 3: Interactive Experience (PLANNED)
**Goal**: Create engaging avatar-based conversations with lip-sync

**Tasks**:
- [ ] **3.1 & 3.2**: Avatar and TTS integration
  - vLitejs video avatar implementation
  - HeadTTS for speech synthesis with visemes
  - Audio buffer management
- [ ] **3.3**: Lip-sync animation
  - Precise viseme timing synchronization
  - Web Audio API integration
  - Real-time mouth shape animation

**Deliverable**: Talking avatar that lip-syncs with AI-generated speech

---

### 📋 Phase 4: Human Handoff (PLANNED)
**Goal**: Seamless integration with human coaching services

**Tasks**:
- [ ] **4.1 & 4.2**: Google Calendar integration
  - OAuth 2.0 authentication flow
  - Calendar API for meeting scheduling
  - Secure token storage in IndexedDB
- [ ] **4.3**: Offline scheduling capabilities
  - Background Sync API implementation
  - Queue management for offline requests
  - Automatic sync when connection restored

**Deliverable**: Complete offline-first app with human coach scheduling

## 🛠️ Development Guide

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── chat-window/       # AI conversation interface
│   │   ├── settings-page/     # App configuration
│   │   └── schedule-flow/     # Meeting scheduling
│   ├── services/
│   │   ├── ai-coach.service.ts      # LLM integration
│   │   ├── calendar.service.ts      # Google Calendar API
│   │   ├── google-auth.service.ts   # OAuth management
│   │   └── head-tts.service.ts      # Speech synthesis
│   ├── app.routes.ts          # Navigation configuration
│   └── app.config.ts          # PWA and service providers
├── public/
│   ├── manifest.webmanifest   # PWA configuration
│   └── icons/                 # App icons for all sizes
└── ngsw-config.json           # Service worker caching rules
```

### Running the Application

```bash
# Development with hot reload
ng serve

# Production build
ng build --configuration production

# Serve production build locally
npx http-server dist/resilience-ai -p 8080

# Run tests
ng test

# Check PWA functionality
npm install -g @angular/pwa
ng add @angular/pwa
```

### Service Worker Testing

```bash
# Build and serve with service worker
ng build --configuration production
npx http-server dist/resilience-ai -p 8080

# Check in browser dev tools:
# - Application > Service Workers
# - Application > Cache Storage
# - Network > Throttling (test offline)
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/phase-x-task`
3. Follow the phase-based development approach
4. Write tests for new functionality
5. Submit a pull request with detailed description

### Coding Standards
- Follow Angular style guide
- Use TypeScript strict mode
- Write comprehensive tests
- Document all public APIs
- Follow semantic commit messages

### Phase-Based Development
- Complete phases sequentially for stability
- Each phase builds on the previous foundation
- Test thoroughly before proceeding to next phase
- Update documentation as features are implemented

## 📱 Browser Support

### Minimum Requirements
- Chrome 80+ (WebGPU support recommended)
- Firefox 78+
- Safari 14+
- Edge 80+

### PWA Features
- Service Workers for offline functionality
- Web App Manifest for installability
- Background Sync (Chrome/Edge)
- Background Fetch (Chrome/Edge)

## 🔒 Privacy & Security

- **Local-first**: All AI processing happens on device
- **No data collection**: Conversations stored locally only
- **Secure authentication**: OAuth 2.0 with PKCE
- **Encrypted storage**: Sensitive data protected in IndexedDB

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Angular Team** for the robust PWA framework
- **Hugging Face** for Transformers.js and model hosting
- **Google** for TensorFlow.js and development tools
- **Open source community** for the amazing tools and libraries

---

**Current Status**: 🟢 Phase 1 Complete | 🔄 Phase 2 In Progress

Ready to revolutionize mental wellness with offline-first AI! 🚀
