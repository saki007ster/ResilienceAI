# Contributing to Resilience AI

Thank you for your interest in contributing to Resilience AI! This guide will help you understand our development process and how to contribute effectively.

## 🎯 Development Philosophy

Resilience AI follows a **phase-based development approach** where each phase builds upon the previous foundation. This ensures:
- **Stability**: Each phase is thoroughly tested before proceeding
- **Maintainability**: Clean architecture that scales with complexity  
- **Collaboration**: Clear boundaries make parallel development possible
- **Quality**: Incremental improvements with continuous integration

## 📋 Current Development Status

### ✅ Phase 1: PWA Shell & Core Services (COMPLETED)
- Foundation architecture established
- All core services and components created
- PWA functionality working
- Basic UI/UX implemented

### 🔄 Phase 2: Offline AI Core (IN PROGRESS)
**Priority Tasks for Contributors:**
1. **Advanced Service Worker Implementation** (High Priority)
2. **Transformers.js Integration** (High Priority)
3. **Constitutional Prompt Engineering** (Medium Priority)

## 🚀 Getting Started

### Prerequisites
```bash
# Required
node --version  # Should be 18+
npm --version   # Latest LTS

# Recommended
git --version
code --version  # VS Code with Angular extensions
```

### Development Setup
```bash
# 1. Fork and clone
git clone https://github.com/yourusername/ResilienceAI.git
cd ResilienceAI

# 2. Install dependencies
npm install

# 3. Start development server
ng serve

# 4. Run tests
ng test

# 5. Check PWA functionality
ng build --configuration production
npx http-server dist/resilience-ai -p 8080
```

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "angular.ng-template",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright"
  ]
}
```

## 🛠️ Development Workflow

### Branch Strategy
```bash
# Feature branches for new functionality
git checkout -b feature/phase-2-service-worker

# Bug fixes
git checkout -b fix/service-worker-caching

# Documentation updates
git checkout -b docs/api-documentation
```

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(phase-2): implement background fetch for model download
fix(chat): resolve message history persistence
docs(readme): update installation instructions
test(ai-coach): add unit tests for conversation flow
refactor(services): extract common functionality
```

### Pull Request Process

1. **Create focused PRs**: One feature/fix per PR
2. **Write descriptive titles**: Include phase and component
3. **Fill out PR template**: Describe changes and testing
4. **Request review**: Tag relevant phase contributors
5. **Pass all checks**: Tests, linting, build verification

#### PR Template
```markdown
## Phase X: [Feature/Fix Name]

### Description
Brief description of changes and motivation.

### Type of Change
- [ ] 🚀 New feature (Phase X task)
- [ ] 🐛 Bug fix
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring
- [ ] ✅ Tests

### Testing
- [ ] Unit tests pass
- [ ] E2E tests pass (if applicable)
- [ ] PWA functionality verified
- [ ] Manual testing completed

### Phase Checklist
- [ ] Aligns with phase objectives
- [ ] Doesn't break previous phase functionality
- [ ] Documentation updated
- [ ] Ready for next phase dependencies
```

## 🏗️ Architecture Guidelines

### Service Layer
```typescript
// services/ai-coach.service.ts
@Injectable({
  providedIn: 'root'
})
export class AiCoachService {
  // Clear separation of concerns
  // Dependency injection for testability
  // Observable patterns for async operations
}
```

### Component Structure
```typescript
// components/chat-window/chat-window.ts
@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.scss'
})
export class ChatWindow {
  // Reactive forms for user input
  // OnPush change detection for performance
  // Clear component lifecycle management
}
```

### State Management
- **Local state**: Component-level reactive forms
- **Global state**: Services with RxJS subjects
- **Persistent state**: IndexedDB through services
- **Cache state**: Service worker managed

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run all tests
ng test

# Run specific component tests
ng test --include="**/chat-window.component.spec.ts"

# Run with coverage
ng test --code-coverage
```

### Testing Patterns
```typescript
describe('AiCoachService', () => {
  let service: AiCoachService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AiCoachService]
    });
    service = TestBed.inject(AiCoachService);
  });

  it('should initialize conversation context', () => {
    // Arrange, Act, Assert pattern
    // Mock external dependencies
    // Test both success and error cases
  });
});
```

### PWA Testing
```bash
# Test service worker functionality
ng build --configuration production
npx http-server dist/resilience-ai -p 8080

# Manual testing checklist:
# ✅ App loads offline
# ✅ Service worker updates properly
# ✅ Cache management works
# ✅ Background sync functions
```

## 📦 Phase-Specific Contribution Areas

### Phase 2: Offline AI Core
**High Priority Contributions Needed:**

1. **Service Worker Enhancement** (`src/app/services/`)
   ```typescript
   // Implement Background Fetch API
   // Handle large model file downloads
   // Manage cache versioning
   ```

2. **Transformers.js Integration** (`src/app/services/ai-coach.service.ts`)
   ```typescript
   // WebGPU device detection
   // Model loading and initialization
   // Memory management for large models
   ```

3. **Prompt Engineering** (`src/app/models/`)
   ```typescript
   // Constitutional AI prompting
   // Conversation context management
   // Wellness-specific response formatting
   ```

### Phase 3: Interactive Experience (Future)
**Medium Priority for Early Contributors:**

- Video avatar integration research
- HeadTTS library evaluation
- Lip-sync animation prototypes

### Phase 4: Human Handoff (Future)
**Lower Priority:**

- Google Calendar API research
- OAuth 2.0 flow design
- Background Sync implementation planning

## 🔍 Code Review Guidelines

### For Reviewers
- **Focus on phase alignment**: Does this advance the current phase goals?
- **Check architecture consistency**: Follows established patterns?
- **Verify testing**: Adequate test coverage for new functionality?
- **Performance consideration**: Will this impact PWA performance?
- **Security review**: Especially for authentication and data handling

### For Contributors
- **Self-review first**: Check your own code thoroughly
- **Small, focused changes**: Easier to review and less prone to conflicts
- **Clear documentation**: Comment complex algorithms and decisions
- **Test thoroughly**: Include edge cases and error scenarios

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Phase**: Which phase does this affect?
**Component**: Specific component or service
**Environment**: Browser, device, OS
**Steps to Reproduce**: Clear, numbered steps
**Expected vs Actual**: What should happen vs what happens
**Screenshots**: If applicable
**Additional Context**: Any relevant logs or details
```

### Critical Bug Priority
1. **P0 (Critical)**: App won't start, data loss, security issues
2. **P1 (High)**: Core functionality broken, major performance issues
3. **P2 (Medium)**: Minor functionality issues, UI glitches
4. **P3 (Low)**: Enhancement requests, minor UX improvements

## 🎨 Design & UX Guidelines

### Design System
- **Colors**: Material Design palette with `#1976d2` primary
- **Typography**: System fonts for better performance
- **Spacing**: 8px grid system
- **Components**: Reusable, accessible components

### Accessibility Requirements
- **WCAG 2.1 AA compliance**
- **Keyboard navigation support**
- **Screen reader compatibility**
- **High contrast mode support**

## 📈 Performance Standards

### PWA Performance Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

### Bundle Size Limits
- **Initial bundle**: < 250KB gzipped
- **Model files**: Lazy loaded, cached efficiently
- **Images**: WebP format, optimized sizes

## 🔒 Security Guidelines

### Data Handling
- **Local-first**: All sensitive data stays on device
- **Encryption**: Use Web Crypto API for sensitive storage
- **Authentication**: Secure OAuth 2.0 with PKCE
- **CSP**: Content Security Policy for XSS protection

### Code Security
- **Dependency scanning**: Regular npm audit
- **Input validation**: Sanitize all user inputs
- **HTTPS only**: No mixed content allowed
- **Secrets management**: No hardcoded keys or tokens

## 💬 Communication

### Where to Get Help
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Phase Planning**: Architecture decisions and roadmap

### Response Times
- **Critical bugs**: Within 24 hours
- **Feature questions**: Within 48 hours
- **General inquiries**: Within 1 week

## 🎉 Recognition

Contributors will be recognized in:
- **README acknowledgments**
- **Release notes**
- **Contributor graphs**
- **Special recognition for phase completions**

---

**Ready to contribute?** Start by checking out the [current Phase 2 issues](https://github.com/ResilienceAI/issues?q=is%3Aissue+is%3Aopen+label%3Aphase-2) and join the revolution in offline-first AI wellness! 🚀 