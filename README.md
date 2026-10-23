# Collaborative Project Management Platform

A modern, high-velocity project management platform engineered for agile development teams, featuring granular Role-Based Access Control (RBAC), multi-tier project assignment, and version-locked Optimistic Concurrency Control (OCC).

Built with a bold **Cyber-Industrial / Neo-Brutalist** aesthetic, the platform equips Admins with 360-degree organizational oversight and empowers Project Managers to recruit squad members and delegate sprint tasks with zero merge friction.

---

## ⚡ Key Highlights

- **Admin Oversight**: Dynamic Project Manager assignment, live user roster matrix, and multi-tier Project &rarr; Squad &rarr; Task hierarchy.
- **Squad Orchestration**: Project Managers can filter, recruit, and elevate team members with instant unassigned user search.
- **Sprint Collaboration**: Kanban board and List views with inline assignee changes, real-time priority badges, and timeline comments.
- **Optimistic Concurrency Control (OCC)**: Version-checked task locking prevents silent overwrites with interactive conflict resolution modals.
- **Distinctive Streetwear / Brutalist Design**: Tactical `#0A0A0A` obsidian, `#C6FF3D` volt lime accents, high-contrast borders, and responsive layouts.

---

## 📂 Repository Structure

This monorepo contains both frontend client and backend server services:

```
Collaborative-Project-Management-Platform/
├── backend/            # Express 5 + Node.js + MongoDB REST API Service
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Business logic & RBAC checks
│   ├── middleware/     # JWT authentication and role guards
│   ├── models/         # Mongoose schemas (User, Project, Member, Task, Comment)
│   ├── routes/         # REST API route handlers
│   ├── scripts/        # Database seeders and verification tests
│   └── README.md       # Backend documentation & API Reference
│
├── frontend/           # React 18 + Vite 6 + Tailwind CSS 4 Web App
│   ├── public/         # Static assets
│   ├── src/            # Components, pages, hooks, and utilities
│   ├── vercel.json     # SPA routing configuration for Vercel
│   └── README.md       # Frontend documentation & design guide
│
└── README.md           # Master documentation (this file)
```

For detailed documentation on each service, see:
- 📖 [**Backend Documentation & API Endpoints Reference**](./backend/README.md)
- 🎨 [**Frontend Documentation & Design System**](./frontend/README.md)

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- [MongoDB](https://www.mongodb.com/) (running locally on port `27017` or a MongoDB Atlas URI)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Populate MongoDB with sample users, projects, and sprint tasks
npm run seed

# Start backend server
npm run dev
```
> The backend server will be running at **`http://localhost:4000`**.

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start frontend development server
npm run dev
```
> The frontend application will be running at **`http://localhost:5173`**.

---

## 👥 Seeded Test Credentials

When running `npm run seed` in the backend, the following pre-configured test users are automatically generated:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` | Full global oversight, PM allocation, user matrix |
| **Project Manager** | `pm@example.com` | `Manager@123` | Squad recruitment, member roles, task creation & assignment |
| **Team Member** | `member@example.com` | `Member@123` | Assigned task updates, sprint comments |
| **Viewer** | `viewer@example.com` | `Viewer@123` | Read-only observation of projects & sprint progress |

---

## 🌐 Production Deployment

- **Frontend**: Ready for one-click deployment on [Vercel](https://vercel.com/) (Set Root Directory to `frontend` and add `VITE_API_URL` to environment variables).
- **Backend**: Deployable to [Render](https://render.com/), [Railway](https://railway.app/), or any container/Node host with a managed MongoDB Atlas database.

---

## 📄 License

ISC License
