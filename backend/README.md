# Collaborative Project Management Platform — Backend API

Robust RESTful API service powering the Collaborative Project Management Platform, engineered with Node.js, Express 5, MongoDB, and Mongoose. Featuring granular Role-Based Access Control (RBAC), multi-tier project assignment, and version-based Optimistic Concurrency Control (OCC) for conflict-free sprint collaboration.

---

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+ or v20+ recommended)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose 8+](https://mongoosejs.com/)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), secure HTTP-Only cookies (`cookie-parser`), password hashing (`bcryptjs`)
- **Validation**: Schema validation with [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) with [Supertest](https://github.com/ladjs/supertest)
- **Dev Tooling**: `tsx` for high-performance TypeScript/ESM execution and hot-reloading

---

## 🏗 System Architecture & Directory Structure

```
backend/
├── config/             # Database connection & environment configuration
│   └── db.js
├── controllers/        # Business logic & request orchestration
│   ├── authController.js       # Signup, login, logout, current user session
│   ├── userController.js       # User directory, role updates, 360° assignment telemetry
│   ├── projectController.js    # Project CRUD, manager allocation, archive/restore
│   ├── memberController.js     # Project team membership, squad promotions/demotions
│   ├── taskController.js       # Task CRUD, assignments, optimistic lock checking (v1, v2...)
│   └── commentController.js    # Task timeline comments & discussions
├── middleware/         # Security, authentication, and authorization filters
│   ├── authMiddleware.js       # JWT extraction & authentication guard
│   └── roleMiddleware.js       # RBAC guards (Admin, PM, Member, Viewer)
├── models/             # Mongoose schemas & data integrity models
│   ├── UserModel.js
│   ├── ProjectModel.js
│   ├── ProjectMemberModel.js
│   ├── TaskModel.js
│   └── CommentModel.js
├── routes/             # REST route declarations & endpoint binding
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── projectRoutes.js
│   ├── memberRoutes.js
│   ├── taskRoutes.js
│   ├── commentRoutes.js
│   └── index.js
├── scripts/            # Database seeding and automated testing scripts
│   ├── seed.js         # Comprehensive mock data generator
│   └── verifyFlow.js   # End-to-end integration flow verification
├── tests/              # Automated unit and integration test suites
├── server.js           # Express app bootstrap & HTTP listener
└── package.json
```

---

## 🔐 Role-Based Access Control (RBAC)

The system operates on a dual-tier authorization model:

### 1. System-Level Roles
- **`admin`**: Full platform authority. Can create/edit/archive any project, assign and change Project Managers, manage global users, promote roles, and oversee all cross-project task assignments.
- **`user`**: Default base system role. Project capabilities are determined by individual project memberships.

### 2. Project-Level Roles
Defined per project in `ProjectMemberModel`:
- **`project_manager`**: Can add and remove operatives, allocate tasks, update project details, and reassign squad members.
- **`team_member`**: Can view project assets, change status/fields of tasks assigned to them, and participate in comment discussions.
- **`viewer`**: Read-only observation permissions for projects, sprints, and tasks.

---

## ⚡ Optimistic Concurrency Control (OCC)

To prevent simultaneous overwrites when multiple team members edit sprint tasks simultaneously:
1. Every task maintains an integer `version` field (starting at `1`).
2. Update requests must include the current task `version` in payload:
   ```json
   {
     "title": "Updated Task Title",
     "version": 3
   }
   ```
3. If another user committed an update in the interim (advancing the server version to `4`), the server rejects the request with **HTTP 409 Conflict**:
   ```json
   {
     "message": "Task was modified by another user. Please refresh and review.",
     "currentTask": { "...": "..." }
   }
   ```
4. Clients can review conflicting differences and choose to either discard local edits or overwrite with latest version.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/collaborative_pm
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key_here
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local HTTP port for Express | `4000` |
| `MONGODB_URI` | MongoDB connection URI string | `mongodb://localhost:27017/collaborative_pm` |
| `CLIENT_URL` | Allowed origin for CORS headers | `http://localhost:5173` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | *(Required)* |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
Populate MongoDB with sample users, projects, squads, sprint tasks, and comments:
```bash
npm run seed
```

#### Pre-configured Test Accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` |
| **Project Manager** | `pm@example.com` | `Manager@123` |
| **Team Member 1 (Rahul)** | `member@example.com` | `Member@123` |
| **Team Member 2 (Aisha)** | `aisha@example.com` | `Member@123` |
| **Viewer** | `viewer@example.com` | `Viewer@123` |

### 3. Start Development Server
```bash
npm run dev
```
The server will boot up with hot-reloading at `http://localhost:4000`.

### 4. Run Automated Tests
```bash
npm test
```

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate & set JWT cookie | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Authenticated |

### Users (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List all users with assigned projects & tasks | Authenticated |
| `POST` | `/api/users` | Admin create new user | Admin |
| `PATCH` | `/api/users/:id/role` | Update user system role | Admin |
| `DELETE` | `/api/users/:id` | Deactivate/remove user | Admin |

### Projects (`/api/projects`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | List projects user has access to (or all if Admin) | Authenticated |
| `POST` | `/api/projects` | Create a new project (assign initial PM) | Admin / PM |
| `GET` | `/api/projects/:id` | Get project details, manager, and metadata | Authenticated |
| `PATCH` | `/api/projects/:id` | Update project details / change Project Manager | Admin / PM |
| `DELETE` | `/api/projects/:id` | Soft delete / archive project | Admin |

### Project Members (`/api/projects/:id/members`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/:id/members` | Get all operatives assigned to project squad | Authenticated |
| `POST` | `/api/projects/:id/members` | Add user to squad with specified role | Admin / PM |
| `PATCH` | `/api/projects/:id/members/:userId` | Promote/demote member (`project_manager`, etc.) | Admin / PM |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove operative from project squad | Admin / PM |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks/mine` | Get sprint tasks assigned to logged-in user | Authenticated |
| `GET` | `/api/projects/:projectId/tasks` | Get all sprint tasks for a project | Authenticated |
| `POST` | `/api/projects/:projectId/tasks` | Create task with initial assignee & priority | Admin / PM |
| `GET` | `/api/tasks/:id` | Get task details, lock version & attachments | Authenticated |
| `PATCH` | `/api/tasks/:id` | Update task fields (checked against `version` OCC) | Assignee / PM / Admin |
| `DELETE` | `/api/tasks/:id` | Delete task | Admin / PM |

### Comments (`/api/tasks/:id/comments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks/:id/comments` | List discussion timeline for a task | Authenticated |
| `POST` | `/api/tasks/:id/comments` | Post a new comment | Authenticated |
| `DELETE` | `/api/tasks/:id/comments/:commentId` | Delete comment | Author / Admin |
