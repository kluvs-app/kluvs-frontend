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
│   │   ├── modals/                # Modal dialogs (AddClub, DeleteClub, EditProfile, etc.)
│   │   ├── layout/                # Layout components (Sidebar, TopNavbar)
│   │   ├── Header.tsx             # Shared header (public pages)
│   │   ├── Footer.tsx             # Shared footer (all pages)
│   │   ├── ClubsSidebar.tsx
│   │   ├── CurrentReadingCard.tsx
│   │   ├── DiscussionsTimeline.tsx
│   │   ├── MembersTable.tsx
│   │   └── ThemeToggle.tsx        # Dark/light theme toggle
│   ├── content/                   # Markdown content files
│   │   ├── privacy-policy.md
│   │   ├── terms-of-use.md
│   │   └── data-deletion.md
│   ├── contexts/                  # React contexts
│   │   └── AuthContext.tsx        # Authentication state
│   ├── pages/                     # Page components
│   │   ├── LandingPage.tsx
│   │   ├── ClubsDashboard.tsx
│   │   ├── LoginPage.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   ├── TermsOfUse.tsx
│   │   ├── DataDeletion.tsx
│   │   └── DiscordPage.tsx
│   ├── types/                     # TypeScript type definitions
│   │   └── index.ts
│   ├── __tests__/                 # Test files (25 test files, 469 tests)
│   │   ├── setup.ts
│   │   ├── utils/                 # Test utilities & mocks
│   │   ├── contexts/
│   │   ├── components/
│   │   ├── pages/
│   │   └── [component].test.tsx
│   ├── App.tsx                    # Root component & routing
│   ├── supabase.ts                # Supabase client config
│   └── version.ts                 # Version string
├── .husky/                        # Git hooks
│   └── pre-push                   # Runs validation on push
├── public/                        # Static assets
├── .env.local                     # Local environment vars (create this)
├── .env.production                # Production env vars
├── package.json                   # Dependencies & scripts
├── vite.config.ts                 # Vite configuration
├── vitest.config.ts               # Test configuration
├── tailwind.config.js             # Tailwind CSS config
└── tsconfig.json                  # TypeScript config
```

## 🔐 Authentication

The app uses **OAuth 2.0** with Supabase Auth for authentication:

- **Providers:** Discord, Google (*iOS coming soon...*)
- **Session:** Stored in localStorage with auto-refresh
- **Roles:** Admin (full access) vs Member (read-only)

### First-Time Login

1. Click "Sign in with Discord" or "Sign in with Google"
2. Authorize the app
3. You'll be redirected back to the dashboard
4. A member profile is automatically created

### Role Management

User roles are managed via the backend API. Contact an admin to upgrade your role from `member` to `admin`.

## 🎨 Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3 + `@tailwindcss/typography`
- **Markdown:** `react-markdown` for rendering legal pages
- **Routing:** React Router v7
- **Backend:** Supabase (Edge Functions + Auth)
- **Testing:** Vitest + React Testing Library
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
- ✅ Tests (469 tests must pass across 25 test files)
- ✅ Build (must compile successfully)

Run `npm run validate` to check all of these locally before pushing.

## 📝 License

[Your License Here]

---

**Built with ❤️ using React + TypeScript + Supabase**
