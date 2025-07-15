# 🧠 Resilience AI

> **An offline-first AI wellness coach Progressive Web App with local LLM and animated avatar**

Resilience AI is a cutting-edge wellness coaching application that combines local artificial intelligence with engaging avatar interactions. The app runs entirely offline using a simulated AI coach, features real-time lip-synced avatar animation with text-to-speech, and provides a professional wellness coaching experience through conversational interface.

## 🎯 Vision

Create an accessible, privacy-first mental wellness platform that:
- **Works completely offline** for privacy and accessibility
- **Provides instant AI coaching** through conversational interface  
- **Features engaging avatar interactions** with realistic lip-sync and TTS
- **Seamlessly connects to human experts** when needed (planned)
- **Runs on any device** as a Progressive Web App

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser with service worker support
- Chrome/Edge recommended for best experience

### Installation

```bash
# Clone the repository
git clone https://github.com/saki007ster/ResilienceAI.git
cd ResilienceAI

# Install dependencies
npm install

# Start development server
ng serve

# Open browser to http://localhost:4200
```

### 🎮 Try It Now!
1. Navigate to the Chat interface
2. Click **"Download Now"** to simulate AI model download
3. Watch the progress animation complete
4. Start chatting with your AI wellness coach!
5. Experience real-time avatar lip-sync and text-to-speech

## ✨ Current Features

### 🎯 **Core Functionality**
- ✅ **Full Chat Interface**: Working conversation with AI wellness coach
- ✅ **Model Download Simulation**: Realistic progress with fallback for testing
- ✅ **AI Response Generation**: Constitutional prompting for wellness coaching
- ✅ **Real-time Status**: Model Ready, WebGPU detection, TTS Ready indicators

### 🎬 **Avatar & Speech**
- ✅ **Animated Avatar**: Canvas-based lip-sync with 14 viseme mouth shapes
- ✅ **Text-to-Speech**: Web Speech API with 191+ voice options
- ✅ **Viseme Animation**: Real-time mouth movement (aa, E, I, O, U, PP, SS, TH, CH, FF, kk, nn, RR, DD, sil)
- ✅ **Voice Controls**: Auto-speak, pause, stop, individual message replay

### 🎨 **User Experience**
- ✅ **Professional UI**: Glassmorphism design with status indicators
- ✅ **Responsive Layout**: Side-by-side avatar and chat on desktop, stacked on mobile
- ✅ **Accessibility**: Screen reader support, reduced motion, high contrast
- ✅ **PWA Features**: Offline capability, service worker, manifest
- ✅ **Message Management**: Timestamps, conversation history, clear functionality

### 🔧 **Technical Features**
- ✅ **Service Worker**: Advanced caching with model download simulation
- ✅ **State Management**: RxJS observables for AI, model, and TTS states
- ✅ **Error Handling**: Graceful fallbacks and user feedback
- ✅ **Performance**: RequestAnimationFrame animations, optimized rendering

## 🏗️ Technology Stack

### Frontend
- **Angular 17+** - Modern web framework with standalone components
- **TypeScript** - Type-safe development with strict mode
- **SCSS** - Advanced styling with glassmorphism and responsive design
- **Canvas API** - Hardware-accelerated avatar rendering
- **Web Speech API** - Cross-browser text-to-speech synthesis

### AI & ML Implementation
- **Simulated AI Coach** - Constitutional prompting for wellness responses
- **WebGPU Detection** - Hardware acceleration with WASM fallback simulation
- **Conversation Management** - Context-aware response generation
- **Viseme Mapping** - 14 phoneme-to-mouth-shape animations

### PWA & Performance
- **Service Workers** - Model caching and offline functionality
- **Background Fetch API** - Large file download simulation
- **RxJS** - Reactive state management and event handling
- **Performance Optimization** - Lazy loading, efficient rendering

## 📋 Development Roadmap

### ✅ Phase 1: PWA Shell & Core Services (COMPLETED)
**Goal**: Establish the foundation with PWA capabilities and navigation

**Completed**:
- [x] Angular 17+ project with PWA support and service worker
- [x] Professional UI with navigation (Chat, Schedule, Settings)
- [x] Core service architecture and routing
- [x] Responsive design with glassmorphism styling

---

### ✅ Phase 2: Offline AI Core (COMPLETED)
**Goal**: Implement local AI execution with advanced caching strategies

**Completed**:
- [x] **2.1**: Service worker with model download simulation
  - Background Fetch API fallback system
  - Progress tracking and user feedback
  - Smart caching with error handling
- [x] **2.2 & 2.3**: AI Coach service with conversation management
  - Constitutional prompting for wellness coaching
  - WebGPU/WASM device detection simulation
  - Conversation history and context management
  - Automatic model readiness detection

---

### ✅ Phase 3: Interactive Experience (COMPLETED)
**Goal**: Create engaging avatar-based conversations with lip-sync

**Completed**:
- [x] **3.1 & 3.2**: Avatar and TTS integration
  - Canvas-based avatar with real-time rendering
  - Web Speech API integration with 191+ voices
  - Professional glassmorphism UI design
- [x] **3.3**: Lip-sync animation system
  - 14 viseme mouth shapes (aa, E, I, O, U, PP, SS, TH, CH, FF, kk, nn, RR, DD, sil)
  - Real-time synchronization with speech
  - Natural eye blinking and head movement
  - Accessibility features and reduced motion support

**Current Status**: Fully functional chat with AI coach, animated avatar, and TTS

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

## 🛠️ Development Guide

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── chat-window/       # ✅ AI conversation interface
│   │   ├── avatar/           # ✅ Canvas-based lip-sync avatar
│   │   ├── model-download/   # ✅ Download simulation UI
│   │   ├── settings-page/    # Settings and configuration
│   │   └── schedule-flow/    # Meeting scheduling (planned)
│   ├── services/
│   │   ├── ai-coach.service.ts      # ✅ AI conversation management
│   │   ├── model-download.ts        # ✅ Download simulation
│   │   ├── head-tts.ts             # ✅ Text-to-speech with visemes
│   │   ├── calendar.service.ts      # Google Calendar API (planned)
│   │   └── google-auth.service.ts   # OAuth management (planned)
│   ├── app.routes.ts          # ✅ Navigation configuration
│   └── app.config.ts          # ✅ PWA and service providers
├── public/
│   ├── rai-sw.js             # ✅ Custom service worker
│   ├── manifest.webmanifest  # ✅ PWA configuration
│   └── icons/               # ✅ App icons for all sizes
└── assets/
    └── gemma-model.bin      # ✅ Mock model for testing
```

### Testing the Application

#### Model Download Simulation
```bash
# Start development server
ng serve

# Navigate to http://localhost:4200/chat
# 1. Click "Download Now" button
# 2. Watch progress animation (20% increments every 600ms)
# 3. See status change to "Model Ready" + "WEBGPU" + "TTS Ready"
# 4. Chat interface becomes active automatically
```

#### Chat Interface Testing
```bash
# After model download completes:
# 1. Type a wellness-related message
# 2. Press Enter to send
# 3. Watch AI generate thoughtful response
# 4. See avatar lip-sync with TTS audio
# 5. Try voice controls (pause, stop, auto-speak)
```

#### Avatar Animation Testing
```bash
# During TTS playback:
# 1. Watch mouth shapes change with speech sounds
# 2. See natural eye blinking every 3-5 seconds  
# 3. Notice head bobbing during speech
# 4. Try pause/stop controls
# 5. Test individual message replay
```

### Performance Testing

```bash
# Production build
ng build --configuration production

# Serve with service worker
npx http-server dist/resilience-ai -p 8080

# Test offline functionality:
# 1. Load app online
# 2. Go offline (dev tools > Network > Offline)
# 3. Reload page - should work offline
# 4. Download simulation works without network
```

## 📱 Browser Support & Features

### Optimal Experience
- **Chrome 80+** - Full WebGPU, Background Fetch, all features
- **Edge 80+** - Full WebGPU, Background Fetch, all features

### Good Experience  
- **Firefox 78+** - Web Speech API, core functionality
- **Safari 14+** - Basic features, some TTS limitations

### PWA Capabilities
- ✅ **Service Workers** - Offline functionality and caching
- ✅ **Web App Manifest** - Installation and app-like experience
- ✅ **Background Fetch** - Large file downloads (Chrome/Edge)
- ✅ **Web Speech API** - Text-to-speech synthesis
- ✅ **Canvas API** - Hardware-accelerated avatar rendering

## 🎭 Avatar Animation Details

### Viseme Mapping
The avatar supports 14 distinct mouth shapes corresponding to speech sounds:

| Viseme | Sounds | Description |
|--------|---------|-------------|
| `aa` | 'a', 'ah' | Open mouth |
| `E` | 'e', 'eh' | Mid-open |
| `I` | 'i', 'ih' | Narrow smile |
| `O` | 'o', 'oh' | Round mouth |
| `U` | 'u', 'oo' | Pursed lips |
| `PP` | 'p', 'b', 'm' | Closed lips |
| `SS` | 's', 'z' | Narrow opening |
| `TH` | 'th', 'dh' | Tongue visible |
| `CH` | 'ch', 'sh', 'j' | Rounded narrow |
| `FF` | 'f', 'v' | Lip-teeth contact |
| `kk` | 'k', 'g' | Back of tongue |
| `nn` | 'n', 't', 'd', 'l' | Tongue-teeth |
| `RR` | 'r' | Rounded tongue |
| `DD` | Default consonant | Standard position |
| `sil` | Silence | Neutral/closed |

### Animation Features
- **60 FPS rendering** using RequestAnimationFrame
- **Real-time viseme detection** from speech synthesis
- **Natural timing** with proper mouth shape transitions
- **Eye blinking** every 3-5 seconds for realism
- **Head movement** during speech for engagement

## 🔒 Privacy & Security

- **Local-first**: All AI processing simulated locally, no external AI calls
- **No data collection**: Conversations stored in browser session only
- **Privacy-focused**: No analytics, tracking, or data transmission
- **Secure by design**: Service worker isolation and content security

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/enhancement-name`
3. Test thoroughly with the chat interface
4. Submit a pull request with demo screenshots

### Testing Guidelines
- Test model download simulation flow
- Verify chat interface functionality  
- Check avatar lip-sync quality
- Ensure responsive design works
- Test offline capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Angular Team** for the robust PWA framework
- **Web Speech API** for cross-browser TTS support
- **Canvas API** for hardware-accelerated rendering
- **Open source community** for inspiration and tools

---

**🎉 Current Status**: Phase 3 Complete - Full chat interface with animated avatar! 

**✅ Ready Features**: Model download → AI conversation → Avatar lip-sync → TTS

**🚀 Try it now**: `ng serve` and experience the future of offline AI wellness coaching!

---

*Built with ❤️ for mental wellness and privacy-first AI interaction*
