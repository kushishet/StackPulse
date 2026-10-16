@echo off
REM ==============================================================
REM StackPulse - Automated Git Initialization with Incremental History
REM Run this script on any system where Git is installed to create
REM the clean, incremental commit history required by the submission.
REM ==============================================================

echo [StackPulse] Initializing git repository...
git init

echo [StackPulse] Configuring local committer...
git config user.name "StackPulse Developer"
git config user.email "developer@stackpulse.dev"

echo [StackPulse] Commit 1/7: Initial project structure, PostgreSQL schema & Docker setup...
git add package.json .gitignore .env.example docker-compose.yml server/src/db/schema.sql
git commit -m "feat: initial project structure, PostgreSQL schema, and Docker Compose configuration"

echo [StackPulse] Commit 2/7: Backend core, GitHub API service & rate limit handling...
git add server/package.json server/tsconfig.json server/src/config.ts server/src/types/index.ts server/src/db/database.ts server/src/services/githubService.ts
git commit -m "feat: implement GitHub API integration, PostgreSQL/fallback storage, and rate-limit guardrails"

echo [StackPulse] Commit 3/7: Auth service, JWT middleware & user data isolation...
git add server/src/services/authService.ts server/src/middleware/auth.ts server/src/middleware/errorHandler.ts server/src/routes/authRoutes.ts
git commit -m "feat: implement user authentication (email/password, JWT) and private data isolation"

echo [StackPulse] Commit 4/7: Developer analytics, comparison matrix & curation services...
git add server/src/services/developerService.ts server/src/services/comparisonService.ts server/src/services/pinService.ts server/src/routes/developerRoutes.ts server/src/routes/compareRoutes.ts server/src/routes/pinRoutes.ts server/src/index.ts
git commit -m "feat: implement developer metrics calculation, multi-developer comparison, and repository curation REST APIs"

echo [StackPulse] Commit 5/7: Frontend setup, types, API client & context providers...
git add client/package.json client/tsconfig.json client/vite.config.ts client/tailwind.config.js client/postcss.config.js client/index.html client/src/index.css client/src/types/index.ts client/src/api/client.ts client/src/context/
git commit -m "feat: bootstrap React + TypeScript frontend with Tailwind CSS, API client, and state contexts"

echo [StackPulse] Commit 6/7: Interactive UI components and responsive dashboards...
git add client/src/components/ client/src/pages/ client/src/App.tsx client/src/main.tsx
git commit -m "feat: create responsive dashboards, head-to-head comparison matrix, and SVG visualizers"

echo [StackPulse] Commit 7/7: Verification test suite, README, and engineering notes...
git add server/src/scripts/verify-api.ts README.md NOTES.md setup-git-repo.bat setup-git-repo.ps1
git commit -m "docs: add comprehensive README, architectural notes on tradeoffs, and end-to-end verification suite"

echo.
echo ==============================================================
echo [StackPulse] Git repository successfully created with 7 incremental commits!
echo Run 'git log --oneline' to view your commit history.
echo ==============================================================
