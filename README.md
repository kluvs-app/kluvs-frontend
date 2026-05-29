# Kluvs: Frontend

[![CI](https://github.com/kluvs-app/kluvs-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/kluvs-app/kluvs-frontend/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/kluvs-app/kluvs-frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/kluvs-app/kluvs-frontend)

A React + TypeScript web application for managing book clubs across multiple Discord servers. Track reading sessions, discussions, members, and club activities with OAuth authentication.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd kluvs-frontend

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

## 📋 Prerequisites

- **Node.js** v20+ ([Download](https://nodejs.org/))
  - ⚠️ Node 18 is not supported (reaches EOL April 2025)
  - ✅ Node 20 LTS (recommended)
  - ✅ Node 22 (latest)
- **npm** (comes with Node.js)
- **Git**
- **Supabase account** (for backend services)

## 🔧 Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Supabase client
- Testing libraries (Vitest, React Testing Library)

### 2. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key

> **Note:** Never commit `.env.local` or `.env.production` files to Git. They're already in `.gitignore`.

## 🏃 Running the App

### Development Mode

```bash
# Build locally
npm run dev
```

Starts the development server at `http://localhost:5173` with:
- Hot module reloading
- TypeScript type checking
- Fast refresh

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Build output goes to `/dist` directory.

## 🧪 Testing

### Run Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once (CI/CD)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

See [CLAUDE.md - Testing Section](CLAUDE.md#testing) for guidelines on writing tests.

## 🛠️ Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run type-check` | Run TypeScript type checking |
| `npm run validate` | Run lint + type-check + tests |

## 📁 Project Structure

```
kluvs-frontend/
├── src/
│   ├── components/                 # React components
│   │   ├── modals/                # 15 modal dialogs
│   │   ├── layout/                # AppShell, AppSidebar, Sidebar, TopNavbar
│   │   ├── ui/                    # Reusable primitives (Avatar, BookCover, etc.)
│   │   ├── icons/                 # SVG icon components
│   │   ├── Header.tsx             # Shared header (public pages)
│   │   ├── Footer.tsx             # Shared footer (all pages)
│   │   ├── DiscussionsTimeline.tsx
│   │   ├── MembersTable.tsx
│   │   └── ThemeToggle.tsx        # Light/dark/system theme toggle
│   ├── content/                   # Markdown content files (legal pages)
│   │   ├── privacy-policy.md
│   │   ├── terms-of-use.md
│   │   └── data-deletion.md
│   ├── contexts/                  # React contexts
│   │   ├── AuthContext.tsx        # Authentication state
│   │   └── ThemeContext.tsx       # Theme state (light/dark/system)
│   ├── pages/                     # Page components (12 total)
│   │   ├── LandingPage.tsx        # Public marketing page
│   │   ├── LoginPage.tsx          # OAuth + email/password auth
│   │   ├── ProfilePage.tsx        # /me — user profile & settings
│   │   ├── ClubsPage.tsx          # /clubs — club list
│   │   ├── ClubDetailPage.tsx     # /clubs/:slug — full club view
│   │   ├── BooksPage.tsx          # /books — book discovery
│   │   ├── JoinPage.tsx           # /join/:token — invite link handler
│   │   ├── SetNewPasswordPage.tsx # Password recovery
│   │   ├── PrivacyPolicy.tsx
│   │   ├── TermsOfUse.tsx
│   │   ├── DataDeletion.tsx
│   │   └── DiscordPage.tsx
│   ├── types/                     # TypeScript type definitions
│   │   └── index.ts
│   ├── __tests__/                 # ~1,093 tests across 44 test files
│   │   ├── setup.ts
│   │   ├── utils/                 # Test utilities & mocks
│   │   ├── contexts/
│   │   ├── components/
│   │   └── pages/
│   ├── App.tsx                    # Root component — domain-based routing
│   ├── supabase.ts                # Supabase client + invokeFunction helper
│   └── version.ts                 # Version string
├── .husky/                        # Git hooks
│   └── pre-push                   # Runs validation on push
├── public/                        # Static assets
├── .env.local                     # Local environment vars (create this)
├── package.json                   # Dependencies & scripts
├── vite.config.ts                 # Vite configuration
├── vitest.config.ts               # Test configuration
├── tailwind.config.js             # Tailwind CSS config
└── tsconfig.json                  # TypeScript config
```

## 🔐 Authentication

The app uses Supabase Auth with multiple providers:

- **OAuth Providers:** Discord, Google (*iOS coming soon...*)
- **Email/Password:** Sign up, sign in, password recovery via email link
- **Session:** Stored in localStorage with auto-refresh
- **Roles:** Per-club roles — `owner`, `admin` (full access), `member` (read-only)

### First-Time Login

1. Click "Sign in with Discord", "Sign in with Google", or use email/password
2. For OAuth: authorize the app and you'll be redirected back automatically
3. For email: confirm your email if signing up, then log in
4. A member profile is automatically created on first sign-in

### Role Management

Roles are per-club and managed via the backend API. Contact a club admin or owner to change your role.

## 🎨 Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3 + `@tailwindcss/typography`
- **Markdown:** `react-markdown` for rendering legal pages
- **Routing:** React Router v7
- **Backend:** Supabase (Edge Functions + Auth)
- **Testing:** Vitest + React Testing Library (~1,093 tests across 44 files)
- **Linting:** ESLint with TypeScript support
- **Pre-commit Hooks:** Husky (runs validation on push)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run validation: `npm run validate`
4. Commit changes: `git commit -m "feat: add my feature"`
5. Push and create pull request

### Code Quality Checks

All PRs must pass (via Husky pre-push hook):
- ✅ ESLint (no errors)
- ✅ TypeScript type checking (no errors)
- ✅ Tests (~1,093 tests must pass across 44 test files)
- ✅ Build (must compile successfully)

Run `npm run validate` to check all of these locally before pushing.

## 📝 License

[Your License Here]

---

**Built with ❤️ using React + TypeScript + Supabase**
