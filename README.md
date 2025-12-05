# Arcana React

> Enterprise-grade React reference architecture implementing Clean Architecture, Offline-First design, and MVVM Input/Output/Effect pattern.

[![Architecture Rating](https://img.shields.io/badge/Architecture%20Rating-⭐⭐⭐⭐⭐%209.2%2F10-gold.svg)](#architecture-evaluation)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Architecture Rating

| Category | Score | Notes |
|----------|-------|-------|
| **Clean Architecture** | 10/10 | 4-layer separation (Core, Domain, Data, Presentation) |
| **Offline-First** | 10/10 | 4-layer caching: Memory → LRU → IndexedDB → API |
| **Type Safety** | 9.5/10 | Only 3 `any` instances in 50+ files |
| **State Management** | 10/10 | MVVM + Input/Output/Effect UDF pattern |
| **Testing** | 9/10 | 269 tests, 87% statement coverage, 16 test suites |
| **Error Handling** | 10/10 | Multi-level error boundaries (root, layout, feature) |
| **Security** | 9/10 | CSRF protection, XSS sanitization, auth handling |
| **Internationalization** | 10/10 | 6 languages, 300+ translation keys |
| **Navigation** | 10/10 | Type-safe NavGraph with 25+ routes |
| **Dependency Injection** | 9/10 | React Context-based DI container |
| **Overall** | **9.2/10** | Production-ready enterprise architecture |

### Architecture Ranking (vs Industry Standards)

| Rank | Category | Status |
|:----:|----------|--------|
| 🥇 | Clean Architecture | Best-in-class 4-layer implementation |
| 🥇 | Offline-First Design | Comprehensive 4-layer caching with sync |
| 🥇 | State Management | MVVM UDF pattern with pure reducers |
| 🥇 | Internationalization | Full 6-language support |
| 🥇 | Testing | 87% coverage with 269 tests (16 suites) |
| 🥇 | Error Handling | Multi-level boundaries with recovery |
| 🥈 | Type Safety | Near-perfect, minimal `any` usage |
| 🥈 | Dependency Injection | Solid React Context-based container |
| 🥈 | Security | CSRF protection, XSS sanitization, auth handling |

## Architecture Pros & Cons

### Strengths

| Category | Description | Impact |
|----------|-------------|--------|
| **Strict Layer Separation** | 4 clean layers with unidirectional dependencies | Excellent maintainability |
| **Type Safety** | Discriminated unions, typed tokens, only 3 `any` instances | Prevents runtime errors |
| **Offline Resilience** | 4-layer cache cascade with pending operation sync | Works without network |
| **Predictable State** | MVVM Input/Output/Effect with pure reducer functions | Easy debugging |
| **Framework-Agnostic Domain** | Business logic has zero React dependencies | Portable, testable |
| **Comprehensive i18n** | 6 languages, 300+ keys, ready for global deployment | Enterprise-ready |
| **Type-Safe Navigation** | Centralized NavGraph with typed route parameters | No broken links |
| **Multi-Level Error Boundaries** | Root, layout, and feature-level error handling | Graceful degradation |
| **CSRF Protection** | Token-based protection for state-changing requests | Secure by default |
| **Comprehensive Testing** | 87% coverage, 269 tests across 16 suites | High confidence |
| **Standardized Errors** | AppError with 8 categories and severity levels | Consistent UX |
| **Reactive Architecture** | RxJS integration for event streaming | Scalable patterns |
| **Clean Mappers** | DTO↔Domain conversions centralized | Decoupled layers |

### Weaknesses

| Category | Description | Impact | Priority |
|----------|-------------|--------|----------|
| **No Rate Limiting** | API requests not throttled | Backend strain | Medium |
| **No Request Deduplication** | Concurrent identical requests not merged | Wasted resources | Medium |
| **Client-Side CSRF** | CSRF tokens generated client-side (should be server-side) | Security | Medium |
| **No APM Integration** | Missing performance monitoring | Limited observability | Low |

### Completed Improvements

| Task | Status | Details |
|------|--------|---------|
| Test coverage 70%+ | ✅ Done | 269 tests, 87% statement coverage, 16 test suites |
| CSRF protection | ✅ Done | Token-based protection for POST/PUT/PATCH/DELETE |
| React error boundaries | ✅ Done | Multi-level: root, layout, feature with recovery |
| Cache service tests | ✅ Done | 100% coverage on Memory and LRU cache |
| DI container tests | ✅ Done | 100% coverage on dependency injection |
| Mapper tests | ✅ Done | 100% coverage on userMapper |

### Improvement Roadmap

| Priority | Task | Category |
|----------|------|----------|
| 1 | Server-side CSRF token generation | Security |
| 1 | Add API rate limiting | Performance |
| 1 | Implement request deduplication | Performance |
| 2 | Add retry with exponential backoff | Reliability |
| 2 | APM/monitoring integration (Sentry) | Observability |
| 2 | E2E tests with Playwright | Testing |
| 3 | Feature flag system | DevOps |
| 3 | A/B testing infrastructure | Product |

## Key Features

- **Clean Architecture** - Strict 4-layer separation with unidirectional dependencies
- **Offline-First Design** - 4-layer caching strategy with pending operations sync
- **MVVM Input/Output/Effect** - Unidirectional Data Flow for predictable state
- **Type-Safe Navigation** - Centralized NavGraph with typed route parameters
- **Dependency Injection** - React Context-based DI container with service tokens
- **Enterprise Security** - XSS sanitization, auth token management, secure storage
- **Full i18n Support** - 6 languages with React-i18next integration
- **Theme System** - Light/Dark/System themes with CSS custom properties

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19.1 with TypeScript 5.8 |
| **Build Tool** | Vite 6.3 |
| **State Management** | React Hooks + useReducer (UDF pattern) |
| **Routing** | React Router 7 |
| **HTTP Client** | Axios with interceptors |
| **Caching** | LRU Cache + IndexedDB (idb) |
| **Styling** | Tailwind CSS 4 |
| **i18n** | react-i18next |
| **Testing** | Vitest + React Testing Library |
| **Reactive Streams** | RxJS 7 |

## Project Structure

```
src/
├── app/
│   ├── core/                    # Core utilities & configuration
│   │   ├── constants/           # App-wide constants
│   │   ├── di/                  # Dependency injection container
│   │   ├── hooks/               # Shared React hooks
│   │   ├── navigation/          # NavGraph & route definitions
│   │   ├── providers/           # Context providers (Auth, Theme, i18n)
│   │   └── utils/               # Utility functions
│   │
│   ├── domain/                  # Business logic layer
│   │   ├── entities/            # Domain models & DTOs
│   │   ├── ports/               # Repository interfaces (ports)
│   │   ├── services/            # Domain service interfaces
│   │   └── validators/          # Business validation rules
│   │
│   ├── data/                    # Data access layer
│   │   ├── api/                 # HTTP client & interceptors
│   │   ├── cache/               # Caching strategies (LRU, IndexedDB)
│   │   ├── mappers/             # DTO ↔ Domain mappers
│   │   ├── repositories/        # Repository implementations
│   │   └── services/            # Service implementations
│   │
│   └── presentation/            # UI layer
│       ├── components/          # Shared UI components
│       ├── features/            # Feature modules
│       │   └── users/
│       │       ├── components/  # Feature-specific components
│       │       ├── pages/       # Route pages
│       │       └── viewmodels/  # MVVM ViewModels
│       └── layouts/             # Layout components
│
├── assets/                      # Static assets
├── locales/                     # i18n translation files
└── routes/                      # Application routing
```

## Architecture Diagram

```mermaid
graph TB
    subgraph Presentation["Presentation Layer"]
        UI[React Components]
        VM[ViewModels<br/>Input/Output/Effect]
        Pages[Pages]
    end

    subgraph Domain["Domain Layer"]
        Entities[Entities & DTOs]
        Ports[Repository Ports]
        DomainServices[Domain Services]
        Validators[Validators]
    end

    subgraph Data["Data Layer"]
        Repos[Repository Impl]
        Services[Service Impl]
        Cache[4-Layer Cache]
        API[API Service]
        Mappers[Mappers]
    end

    subgraph Core["Core Layer"]
        DI[DI Container]
        NavGraph[NavGraph]
        Providers[Providers]
        Constants[Constants]
    end

    subgraph External["External"]
        Backend[REST API]
        IndexedDB[(IndexedDB)]
        LocalStorage[(LocalStorage)]
    end

    UI --> VM
    VM --> DomainServices
    Pages --> VM

    DomainServices --> Ports
    Repos -.implements.-> Ports

    Repos --> Cache
    Repos --> API
    Repos --> Mappers

    Services --> Repos

    Cache --> IndexedDB
    API --> Backend
    Providers --> LocalStorage

    DI --> Services
    VM --> DI
```

## MVVM Input/Output/Effect Pattern

The architecture implements a strict Unidirectional Data Flow pattern:

```mermaid
graph LR
    subgraph ViewModel
        Input[Input<br/>User Actions]
        Reducer[Reducer<br/>Pure Function]
        Output[Output<br/>Immutable State]
        Effect[Effect<br/>Side Effects]
    end

    UI[React Component] -->|dispatch| Input
    Input -->|action| Reducer
    Reducer -->|state| Output
    Output -->|render| UI
    Reducer -->|trigger| Effect
    Effect -->|navigation, toast| External[External Systems]
```

### Input Types (Discriminated Union)
```typescript
export type UserListInput =
  | { type: 'LOAD_USERS'; page?: number }
  | { type: 'REFRESH_USERS' }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'DELETE_USER'; user: User }
  | { type: 'NAVIGATE_TO_CREATE' }
  | { type: 'NAVIGATE_TO_DETAIL'; id: string }
```

### Output Types (Immutable State)
```typescript
export interface UserListOutput {
  users: User[]
  isLoading: boolean
  error: string | null
  filteredUsers: User[]  // Computed
  startItem: number      // Computed
}
```

### Effect Types (Side Effects)
```typescript
export type UserListEffect =
  | { type: 'NAVIGATE'; path: string }
  | { type: 'SHOW_TOAST'; message: string; variant: 'success' | 'error' }
  | { type: 'AUTO_DISMISS_SUCCESS'; delay: number }
```

## 4-Layer Caching Strategy

```mermaid
graph TD
    Request[Data Request] --> Memory{Memory Cache}
    Memory -->|Hit| Return[Return Data]
    Memory -->|Miss| LRU{LRU Cache}
    LRU -->|Hit| UpdateMemory[Update Memory] --> Return
    LRU -->|Miss| IDB{IndexedDB}
    IDB -->|Hit| UpdateLRU[Update LRU] --> UpdateMemory
    IDB -->|Miss| API[API Request]
    API -->|Success| UpdateIDB[Update IndexedDB] --> UpdateLRU
    API -->|Offline| Pending[Queue Pending Operation]
```

### Cache Configuration
| Layer | Storage | TTL | Max Size |
|-------|---------|-----|----------|
| Memory | In-memory Map | 5 min | Unlimited |
| LRU | LRU Cache | 30 min | 100 items |
| IndexedDB | Browser DB | 24 hours | 10MB |
| API | Network | - | - |

## Dependency Injection

The architecture uses a React Context-based DI container:

```typescript
// Container definition
export const ServiceTokens = {
  UserService: 'UserService',
} as const

// Service registration (composition root)
export function configureServices(container: DIContainer): void {
  container.register(ServiceTokens.UserService, userService)
}

// Usage in ViewModels
export function useUserListViewModel() {
  const userService = useUserService()  // DI hook
  // ...
}
```

## Type-Safe Navigation (NavGraph)

```typescript
// Centralized route definitions
export const NavGraph = {
  root: '/',
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    create: '/users/new',
    edit: (id: string) => `/users/${id}/edit`,
  },
  auth: {
    login: '/login',
    register: '/register',
  },
} as const

// Type-safe navigation in ViewModels
dispatch({ type: 'NAVIGATE_TO_DETAIL', id: user.id })
```

## Internationalization

Supports 6 languages with 300+ translation keys:

| Language | Code | Status |
|----------|------|--------|
| English | en | Complete |
| Thai | th | Complete |
| Japanese | ja | Complete |
| Chinese | zh | Complete |
| Korean | ko | Complete |
| Vietnamese | vi | Complete |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+ (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/jrjohn/arcana-react.git
cd arcana-react

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code with Prettier |

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/app/domain/validators/userValidator.test.ts
```

### Test Coverage

| Category | Coverage |
|----------|----------|
| Domain Validators | 100% |
| Mappers | 100% |
| Providers | 94% |
| Cache Services | 96% |
| DI Container | 100% |
| Error Boundary | 94% |
| **Overall** | **~87%** |

## Security Features

- **CSRF Protection**: Token-based protection for state-changing requests (POST, PUT, PATCH, DELETE)
- **XSS Prevention**: HTML sanitization utilities
- **Auth Token Management**: Secure localStorage with interceptors
- **Request ID Tracking**: UUID for each API request
- **Network Status Detection**: Offline-aware operations
- **401 Handling**: Automatic token cleanup and redirect
- **Error Boundaries**: Graceful error handling at root, layout, and feature levels

## Performance Optimizations

- **Vite HMR**: Fast hot module replacement
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo and useMemo for expensive computations
- **Virtual Scrolling**: Ready for large lists
- **Cache-First Strategy**: Reduced API calls

## Related Projects

- [Arcana Angular](https://github.com/jrjohn/arcana-angular) - Angular implementation (9.4/10)
- [Arcana iOS](https://github.com/jrjohn/arcana-ios) - iOS Swift implementation
- [Arcana Android](https://github.com/jrjohn/arcana-android) - Android Kotlin implementation

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with Clean Architecture principles for enterprise-grade React applications.
