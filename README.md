# MEAtec - Personal Habit Tracking & Streak Management API

A backend REST API built with **Node.js**, **TypeScript**, **Express**, **PostgreSQL**, and **Redis**. This service supports habit creation, daily completion tracking, streak calculations, and secure JWT-based access.

---

## 📦 Setup Instructions

### 1. Prerequisites
- Node.js v16+
- PostgreSQL
- Redis (optional, used for caching)

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration
Create a `.env` file in the repository root with the following values:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=habit_tracker
JWT_SECRET=your_secret_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
NODE_ENV=development
```

### 4. Create and seed the database
1. Create the PostgreSQL database:
```sql
CREATE DATABASE habit_tracker;
```
2. Apply schema:
```bash
psql -h localhost -U your_postgres_user -d habit_tracker -f src/database-storage/schema.sql
```
3. (Optional) Seed sample data:
```bash
psql -h localhost -U your_postgres_user -d habit_tracker -f src/database-storage/seed.sql
```

### 5. Run the app
```bash
# Development mode
npm run dev

# Production build + start
npm run build
npm start
```

---

## 🚀 API Routes

All API routes are exposed under the `/api/v1` prefix.

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user | No |
| `POST` | `/api/v1/auth/login` | Login and receive access token | No |
| `POST` | `/api/v1/habits` | Create a habit | Yes |
| `GET` | `/api/v1/habits` | List habits with optional `tag`, `search`, `page`, `limit` | Yes |
| `GET` | `/api/v1/habits/:id` | Get habit details | Yes |
| `PUT` | `/api/v1/habits/:id` | Update habit | Yes |
| `DELETE` | `/api/v1/habits/:id` | Delete a habit | Yes |
| `POST` | `/api/v1/habits/:id/track` | Track habit completion | Yes |
| `GET` | `/api/v1/habits/:id/history` | Retrieve completion history and streak stats | Yes |

---

## 🔐 JWT Usage

Protected endpoints require a valid JWT access token.

Example header:
```http
Authorization: Bearer <ACCESS_TOKEN>
```

Obtain the token by logging in with `/api/v1/auth/login`.

---

## 🧪 Example Requests

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authenticated successfully",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "..."
  }
}
```

### Create Habit
```http
POST /api/v1/habits
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Morning Run",
  "description": "Run 3 km",
  "frequency": "daily",
  "reminder_time": "07:00",
  "tags": ["fitness", "health"]
}
```

### Track Habit Completion
```http
POST /api/v1/habits/8/track
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "completed_date": "2026-05-16"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Habit completion successfully tracked",
  "data": {
    "id": 42,
    "habit_id": 8,
    "user_id": 5,
    "completed_date": "2026-05-16",
    "completed_at": "2026-05-16T12:34:56.789Z"
  }
}
```

### Get Habit History + Streaks
```http
GET /api/v1/habits/8/history
Authorization: Bearer <ACCESS_TOKEN>
```

**Example Response:**
```json
{
  "success": true,
  "message": "Tracking history and streak stats retrieved successfully",
  "data": {
    "habitId": 8,
    "history": [
      {
        "id": 42,
        "habit_id": 8,
        "user_id": 5,
        "completed_date": "2026-05-16",
        "completed_at": "2026-05-16T12:34:56.789Z"
      }
    ],
    "stats": {
      "currentStreak": 1,
      "longestStreak": 1,
      "totalCompletions": 1
    }
  }
}
```

---

## 🧩 Database Schema

This project uses **PostgreSQL**, not MongoDB.

### Tables

#### `users`
- `id` SERIAL PRIMARY KEY
- `email` VARCHAR(255) UNIQUE NOT NULL
- `name` VARCHAR(255) NOT NULL
- `password_hash` VARCHAR(255) NOT NULL
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

#### `habits`
- `id` SERIAL PRIMARY KEY
- `user_id` INTEGER NOT NULL REFERENCES `users(id)`
- `title` VARCHAR(255) NOT NULL
- `description` TEXT
- `frequency` VARCHAR(50) DEFAULT 'daily'
- `reminder_time` VARCHAR(5)
- `tags` TEXT[] DEFAULT '{}'
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

#### `tracking_logs`
- `id` SERIAL PRIMARY KEY
- `habit_id` INTEGER NOT NULL REFERENCES `habits(id)`
- `user_id` INTEGER NOT NULL REFERENCES `users(id)`
- `completed_date` DATE NOT NULL
- `completed_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `UNIQUE (habit_id, completed_date)`

---

## 🐳 Docker

### Build and run with Docker Compose
```bash
docker-compose up -d
```

This will start:
- The API application on port 3000
- PostgreSQL database on port 5432
- Redis cache on port 6379

### Build Docker image manually
```bash
docker build -t habits-api .
docker run -p 3000:3000 --env-file .env habits-api
```

### Stop Docker Compose
```bash
docker-compose down
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage` directory and include HTML, LCOV, and JSON formats. Coverage is collected only for the `src/controllers` and `src/services` folders.

---

## 📌 Notes
- Use `Authorization: Bearer <ACCESS_TOKEN>` for all protected routes.
- Redis is optional; the app can run without it, but caching will be disabled.
