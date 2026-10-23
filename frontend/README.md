# Collaborative Project Management Platform — Frontend Web Application

High-performance, streetwear-inspired Neo-Brutalist web interface for agile sprint planning, squad orchestration, and cross-project oversight. Built with React 18, Vite 6, Tailwind CSS 4, and TanStack React Query 5.

---

## 🎨 Visual Identity & Design System

The application breaks away from standard enterprise SaaS templates in favor of a bold, tactile **Cyber-Industrial / Neo-Brutalist** aesthetic:
- **Color Palette**: Deep Obsidian Black (`#0A0A0A`), Electric Lime / Volt (`#C6FF3D`), Industrial Amber (`#F59E0B`), Crisp Off-White (`#FAF9F5`), and High-Contrast Grays.
- **Typography**: Display typography using `Bebas Neue` / `Oswald` headers paired with tactical, monospaced data telemetry (`JetBrains Mono` / `Courier`).
- **Tactile UI Elements**: Hard 2px/3px black borders, offset solid drop shadows (`shadow-[4px_4px_0px_0px_#0A0A0A]`), high-contrast state badges, and crisp micro-animations.

---

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Bundler & Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with native CSS variables
- **Data Fetching & State**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Routing**: [React Router v6](https://reactrouter.com/) (Browser router, protected routes, nested outlets)
- **Form Handling & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment Platform**: [Vercel](https://vercel.com/)

---

## 📂 Architecture & Directory Structure

```
frontend/
├── public/                 # Static assets and favicons
├── src/
│   ├── assets/             # Brand logos and vector graphics
│   ├── components/         # Shared component architecture
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx  # Primary shell with sidebar, topbar, and telemetry
│   │   ├── AuthProvider.jsx         # Context provider for authentication state
│   │   ├── ProtectedRoute.jsx       # Route guard for authenticated & admin pages
│   │   └── RoleGuard.jsx            # Granular permission wrapper
│   ├── pages/              # Application views & route targets
│   │   ├── admin/
│   │   │   └── Users.jsx            # 360° User Matrix & Project-Task Hierarchy Oversight
│   │   ├── auth/
│   │   │   ├── Login.jsx            # High-impact login screen
│   │   │   └── Register.jsx         # User registration
│   │   ├── projects/
│   │   │   ├── ProjectList.jsx      # Grid view, Hierarchy view, PM assignment modals
│   │   │   ├── ProjectLayout.jsx    # Project tab navigation, header, quick PM switcher
│   │   │   ├── ProjectTasks.jsx     # Kanban board & List views with inline assignments
│   │   │   └── ProjectTeam.jsx      # Squad roster, member search & role promotion
│   │   ├── tasks/
│   │   │   └── TaskDetail.jsx       # Task specification, OCC conflict resolver, comments
│   │   ├── Dashboard.jsx            # Metric counters, sprint tasks, admin oversight
│   │   └── Profile.jsx              # User credentials & security settings
│   ├── utils/
│   │   ├── api.js                   # Axios/Fetch client with credentials & error handling
│   │   └── auth.js                  # Authentication context hook (`useAuth`)
│   ├── App.jsx                      # Route manifest & provider tree
│   ├── index.css                    # Tailwind CSS v4 design tokens and utility rules
│   └── main.jsx                     # DOM mount point
├── vercel.json             # SPA fallback route rewrites for Vercel
├── vite.config.js          # Vite build & plugin configuration
└── package.json
```

---

## ⚡ Key Capabilities & Workflows

### 1. Admin Project Manager Assignment
- **Project Creation & Editing**: Admins can designate or reassign a Project Manager at any time via dedicated user dropdowns in the creation and editing modals.
- **Quick PM Switcher**: Project cards in `ProjectList` and the project header in `ProjectLayout` include quick-action modals to change the Project Manager in one click without opening full edit settings.

### 2. Project Manager Squad & Task Orchestration
- **Squad Formation (`ProjectTeam`)**: PMs and Admins can search the organization user directory with automatic filtering of already-assigned members, assigning roles (`project_manager`, `team_member`, `viewer`).
- **Inline Role Elevation**: Instantly promote or demote members directly from the team roster.
- **Task Assignment (`ProjectTasks`)**: Quick inline assignee dropdowns on both **Kanban** and **Table/List** views allow seamless task delegation.

### 3. Version-Aware Optimistic Concurrency Control (OCC)
- When updating task statuses or specifications, the client verifies against the task's integer lock version (`v1`, `v2`, ...).
- If a concurrent write conflict occurs (HTTP 409), a prominent **Conflict Resolution Modal** displays differences side-by-side:
  - **USE LATEST**: Refreshes data and discards local modifications.
  - **RE-APPLY MY CHANGES**: Overwrites using the incremented lock version.

### 4. Admin Global Oversight Matrix (`/users` & `/`)
- **360° User Matrix**: View every operative across the company alongside all assigned projects, squad roles, and currently open sprint tasks.
- **Project & Task Hierarchy Tree**: Expandable tree breakdown displaying Project &rarr; Squad & PM &rarr; Sprint Tasks & Assignees.

---

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory based on `.env.example`:

```env
# Backend API Base URL (without trailing slash)
# Local development:
VITE_API_URL=http://localhost:4000

# Production (e.g. Render, Railway, AWS):
# VITE_API_URL=https://your-backend-api.onrender.com
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```
Creates an optimized production bundle inside the `dist/` directory.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🌐 Deploying to Vercel

### Step-by-Step Vercel Setup:
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New Project"** and import this repository.
3. In **Project Settings**:
   - **Root Directory**: Select `frontend` (Click *Edit* &rarr; select the `frontend` folder).
   - **Framework Preset**: `Vite` (automatically detected).
4. In **Environment Variables**, add:
   - `VITE_API_URL`: Your live backend API URL (e.g., `https://collaborative-pm-api.onrender.com`).
5. Click **Deploy**.

> **Note on Client-Side Routing**: The included [`vercel.json`](./vercel.json) automatically routes all requests (`/(.*)`) to `/index.html`, ensuring React Router handles deep URLs on refresh without 404 errors.
