# 🧠 Resilience AI

> **An offline-first AI wellness coach Progressive Web App with VRM avatars and local LLM**

Resilience AI is a cutting-edge wellness coaching application that combines **real local LLM processing** with **immersive VRM avatar interactions**. The app runs entirely offline using WebLLM technology, features hardware-accelerated 3D VRM avatars with advanced animations, and provides professional wellness coaching through a modern conversational interface.

## 🎯 Vision

Create an accessible, privacy-first mental wellness platform that:
- **Works completely offline** with real LLM models for privacy and accessibility
- **Provides genuine AI coaching** through advanced constitutional prompting
- **Features immersive VRM avatar interactions** with 3D rendering, lip-sync, and facial expressions
- **Offers modern, responsive UI** with glassmorphism design and accessibility features
- **Runs on any device** as a Progressive Web App with optimized performance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser with WebGL support
- **Chrome/Edge 90+ recommended** for WebGPU acceleration and VRM support
- **4GB+ available RAM** for local LLM models

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

### 🎮 Experience the Full AI Coach
1. Navigate to the Chat interface
2. **Select your preferred LLM model** (Llama 3.2, Qwen 2.5, Gemma 2)
3. **Choose or upload a VRM avatar** from our collection
4. Watch the model download with **real-time progress tracking**
5. Start conversations with **genuine AI responses**
6. Experience **3D avatar animations** with lip-sync, expressions, and natural movements!

## ✨ Current Features

### 🤖 **Advanced AI Integration**
- ✅ **Real Local LLM Processing**: WebLLM with Llama 3.2 (1B/3B), Qwen 2.5 (1.5B), Gemma 2 (2B)
- ✅ **Constitutional AI Prompting**: Specialized for wellness and therapy applications
- ✅ **Smart Model Selection**: Choose optimal model based on device capabilities
- ✅ **Intelligent Caching**: Models persist offline with cache management
- ✅ **WebGPU Acceleration**: Hardware-accelerated inference with WASM fallback

### 🎭 **VRM Avatar System**
- ✅ **3D VRM Avatar Support**: Industry-standard VRM format used by VTubers
- ✅ **Hardware-Accelerated Rendering**: Three.js with WebGL for smooth 60fps
- ✅ **Advanced Facial Animation**: 14 viseme lip-sync + facial expressions (happy, sad, surprised, angry)
- ✅ **Natural Behaviors**: Eye blinking, head bobbing, breathing animations
- ✅ **Avatar Collection**: Pre-loaded avatars across categories (Male, Female, Anime, Fantasy)
- ✅ **Custom Avatar Upload**: Support for user-provided VRM files
- ✅ **Portrait Optimization**: Camera positioning for head/upper-body focus

### 🎨 **Modern UI/UX**
- ✅ **Glassmorphism Design**: Modern translucent interface with backdrop blur
- ✅ **Fully Responsive Layout**: Optimized for mobile, tablet, and ultra-wide desktop
- ✅ **CSS Grid System**: Adaptive layout with 300px-350px sidebar + flexible chat area
- ✅ **Dynamic Breakpoints**: 5 responsive tiers (≤350px to ≥1400px)
- ✅ **Accessibility First**: ARIA labels, keyboard navigation, reduced motion support
- ✅ **Professional Animations**: Subtle hover effects and smooth transitions

### 🎬 **Audio & Speech**
- ✅ **Advanced Text-to-Speech**: Web Speech API with 191+ voice options
- ✅ **Real-time Lip Sync**: Synchronized mouth movements with speech audio
- ✅ **Voice Controls**: Auto-speak, pause, stop, individual message replay
- ✅ **Viseme Animation**: 14 phoneme mouth shapes for realistic speech

### 🔧 **Technical Excellence**
- ✅ **Progressive Web App**: Full offline capability with service worker
- ✅ **Persistent Model Storage**: Cache API integration for model persistence
- ✅ **Performance Optimized**: Lazy loading, efficient rendering, memory management
- ✅ **Error Handling**: Graceful fallbacks and comprehensive user feedback
- ✅ **State Management**: RxJS observables for reactive UI updates

## 🏗️ Technology Stack

### Frontend & UI
- **Angular 17+** - Modern web framework with standalone components
- **TypeScript** - Type-safe development with strict mode
- **SCSS** - Advanced styling with CSS Grid, glassmorphism effects
- **Three.js** - 3D graphics engine for VRM avatar rendering
- **@pixiv/three-vrm** - VRM format support and animation

### AI & Machine Learning
- **@mlc-ai/web-llm** - Client-side LLM execution with WebGPU/WASM
- **Multiple LLM Models**: Llama 3.2 (1B/3B), Qwen 2.5 (1.5B), Gemma 2 (2B)
- **Constitutional AI**: Specialized prompting for wellness coaching
- **WebGPU API** - Hardware acceleration with automatic fallback

### Audio & Animation
- **Web Speech API** - Cross-browser text-to-speech synthesis
- **Canvas API** - Fallback avatar rendering system
- **WebGL** - Hardware-accelerated 3D graphics
- **RequestAnimationFrame** - Smooth 60fps animations

### PWA & Performance
- **Service Workers** - Model caching and offline functionality
- **Cache API** - Persistent model storage across sessions
- **Background Fetch API** - Large file download support
- **RxJS** - Reactive state management and event handling

## 📋 Development Roadmap

### ✅ Phase 1: Foundation & PWA (COMPLETED)
- [x] Angular 17+ project with PWA support
- [x] Professional UI with navigation and routing
- [x] Core service architecture
- [x] Responsive glassmorphism design

### ✅ Phase 2: Real LLM Integration (COMPLETED)
- [x] **WebLLM Integration**: Multiple model support with model selector
- [x] **Constitutional AI**: Specialized wellness coaching prompts
- [x] **Performance Optimization**: WebGPU acceleration and WASM fallback
- [x] **Caching System**: Persistent model storage with cache management

### ✅ Phase 3: VRM Avatar System (COMPLETED)
- [x] **3D VRM Support**: Three.js integration with VRM loader
- [x] **Avatar Collection**: Pre-loaded avatars with category browsing
- [x] **Custom Upload**: User VRM file support with validation
- [x] **Advanced Animation**: Lip-sync, expressions, natural behaviors
- [x] **Performance**: Hardware-accelerated rendering with fallbacks

### ✅ Phase 4: UI/UX Modernization (COMPLETED)
- [x] **Responsive Design**: 5-tier breakpoint system for all devices
- [x] **Layout Optimization**: CSS Grid with sidebar + flexible chat area
- [x] **Accessibility**: Full ARIA support, keyboard navigation
- [x] **Visual Polish**: Animations, glassmorphism, professional styling

### 📋 Phase 5: Advanced Features (PLANNED)
**Goal**: Enhanced AI capabilities and user personalization

**Tasks**:
- [ ] **5.1**: Voice Input Integration
  - Speech recognition for hands-free interaction
  - Wake word detection for natural conversation
  - Multi-language support
- [ ] **5.2**: Personalization System
  - User preference learning
  - Conversation history analytics
  - Custom coaching styles
- [ ] **5.3**: Advanced Avatar Features
  - Emotion-based expression changes
  - Gesture animation system
  - Avatar personality traits

### 📋 Phase 6: Professional Integration (PLANNED)
**Goal**: Human coaching handoff and scheduling

**Tasks**:
- [ ] **6.1**: Google Calendar Integration
  - OAuth 2.0 authentication flow
  - Meeting scheduling with therapists
  - Availability matching system
- [ ] **6.2**: Coaching Marketplace
  - Therapist discovery and booking
  - Secure communication channels
  - Session management tools

## 🛠️ Development Guide

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── chat-window/           # ✅ AI conversation interface
│   │   ├── vrm-avatar/           # ✅ 3D VRM avatar with Three.js
│   │   ├── avatar-selector/      # ✅ Avatar browsing and upload
│   │   ├── model-selector/       # ✅ LLM model selection UI
│   │   ├── settings-page/        # Configuration and preferences
│   │   └── schedule-flow/        # Meeting scheduling (planned)
│   ├── services/
│   │   ├── ai-coach-enhanced.service.ts  # ✅ WebLLM integration
│   │   ├── head-tts.ts                  # ✅ TTS with viseme mapping
│   │   ├── speech-recognition.service.ts # Speech input (planned)
│   │   └── calendar.service.ts          # Google Calendar (planned)
│   ├── interfaces/
│   │   ├── ai-coach-state.ts           # ✅ AI state management
│   │   └── avatar-types.ts             # ✅ VRM avatar definitions
│   └── app.routes.ts              # ✅ Navigation configuration
├── public/
│   ├── assets/avatars/           # ✅ VRM avatar collection
│   ├── manifest.webmanifest     # ✅ PWA configuration
│   └── icons/                   # ✅ App icons for all platforms
└── assets/                      # Static resources
```

### Model Integration Testing

#### LLM Model Download & Caching
```bash
# Start development server
ng serve

# Navigate to http://localhost:4200/chat
# 1. Select model (Llama 3.2 1B recommended for testing)
# 2. Watch real download progress with speed indicators
# 3. See cache status and model size information
# 4. Verify model persists after page reload
# 5. Test cache clearing functionality
```

#### AI Conversation Testing
```bash
# After model loads:
# 1. Type wellness-related questions
# 2. Observe genuine AI responses (not templates)
# 3. Test constitutional prompting boundaries
# 4. Verify conversation context maintenance
# 5. Check response quality and relevance
```

### VRM Avatar Testing

#### Avatar Selection & Upload
```bash
# Avatar System Testing:
# 1. Browse avatar categories (Male, Female, Anime, Fantasy)
# 2. Select different avatars and watch 3D loading
# 3. Upload custom VRM files (test with VRoid Hub models)
# 4. Verify fallback system if VRM fails to load
# 5. Test portrait view positioning and scaling
```

#### Animation & Lip-Sync
```bash
# During AI responses:
# 1. Watch real-time lip-sync with TTS
# 2. Observe facial expressions (happy, sad, surprised)
# 3. Notice natural eye blinking and head movement
# 4. Test voice controls (pause, stop, replay)
# 5. Verify smooth 60fps rendering performance
```

### Responsive Design Testing

#### Multi-Device Layout
```bash
# Test responsive breakpoints:
# 1. Mobile Portrait (≤568px): Stacked layout
# 2. Mobile Landscape (569-768px): Side-by-side
# 3. Tablet (769-1024px): Enhanced grid
# 4. Desktop (1025-1400px): Standard sidebar
# 5. Large Desktop (≥1400px): Expanded layout

# Check dynamic avatar sizing:
# - Mobile: 160-200px
# - Tablet: 220px  
# - Desktop: 240-280px
```

### Performance Testing

```bash
# Production build with optimizations
ng build --configuration production

# Test with realistic constraints
# 1. Enable CPU throttling (4x slowdown)
# 2. Limit network to 3G speeds
# 3. Test model download interruption/resume
# 4. Verify VRM rendering performance
# 5. Check memory usage with large models
```

## 📱 Browser Support & Performance

### Optimal Experience (Recommended)
- **Chrome 90+** - Full WebGPU, VRM support, all features
- **Edge 90+** - Full WebGPU, VRM support, all features
- **4GB+ RAM** for comfortable LLM model execution

### Good Experience
- **Chrome 80+** - WebGL VRM support, WASM LLM fallback
- **Firefox 80+** - Basic VRM support, some limitations
- **Safari 14+** - Limited VRM support, basic functionality

### Feature Support Matrix
| Feature | Chrome 90+ | Chrome 80+ | Firefox 80+ | Safari 14+ |
|---------|------------|-------------|-------------|------------|
| WebLLM (WebGPU) | ✅ Full | ⚠️ WASM | ⚠️ WASM | ❌ Limited |
| VRM Avatars | ✅ Full | ✅ Full | ⚠️ Basic | ⚠️ Basic |
| TTS Lip-Sync | ✅ Perfect | ✅ Perfect | ✅ Good | ⚠️ Limited |
| Model Caching | ✅ Full | ✅ Full | ✅ Full | ⚠️ Limited |
| Responsive UI | ✅ Perfect | ✅ Perfect | ✅ Perfect | ✅ Perfect |

## 🎭 VRM Avatar Features

### Supported VRM Specifications
- **VRM 0.x and 1.0** format support
- **Humanoid rigging** with standard bone structure
- **Blend shapes** for facial expressions and visemes
- **Texture materials** with PBR support
- **Animation clips** for natural movement

### Animation Capabilities
| Feature | Description | Performance |
|---------|-------------|-------------|
| **Lip Sync** | 14 viseme mouth shapes | Real-time |
| **Facial Expressions** | Happy, sad, surprised, angry, neutral | Smooth transitions |
| **Eye Movement** | Blinking every 3-5 seconds | Natural timing |
| **Head Animation** | Bobbing during speech | Subtle movement |
| **Breathing** | Chest rise/fall simulation | Continuous |

### Avatar Sources
- **Built-in Collection**: 12+ high-quality avatars across categories
- **VRoid Hub**: Free avatars from the community
- **Custom Upload**: Support for user-created VRM files
- **Booth.pm**: Premium avatar marketplace integration

## 🔒 Privacy & Security

### Local-First AI
- **No external API calls**: All LLM processing happens locally
- **Model storage**: Cached in browser with Cache API
- **Conversation privacy**: Data never leaves your device
- **GDPR compliant**: No data collection or transmission

### Security Features
- **Content Security Policy**: Strict CSP headers
- **Service Worker isolation**: Secure background processing
- **Input sanitization**: XSS protection for user input
- **File validation**: Safe VRM upload handling

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/enhancement-name`
3. Test with multiple LLM models and VRM avatars
4. Ensure responsive design works across breakpoints
5. Submit PR with screenshots/videos of new functionality

### Testing Guidelines
- Test LLM model selection and caching
- Verify VRM avatar loading and animations
- Check responsive design on multiple devices
- Validate accessibility features
- Test offline functionality thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MLC AI Team** for WebLLM client-side inference
- **Pixiv Team** for three-vrm VRM support
- **Three.js Community** for 3D graphics framework
- **VRoid Team** for VRM format and avatar creation tools
- **Angular Team** for robust PWA capabilities
- **Open source AI community** for advancing local LLM technology

---

**🎉 Current Status**: Phase 4 Complete - Production-ready AI wellness coach with VRM avatars!

**✅ Live Features**: Real LLM models → VRM avatar conversations → Modern responsive UI → Offline-first PWA

**🚀 Experience Now**: `ng serve` and chat with genuine AI using immersive 3D avatars!

---

*Built with ❤️ for mental wellness, privacy-first AI, and the future of human-computer interaction*
