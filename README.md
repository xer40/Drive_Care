# Drive Care

A full-stack web app for tracking your car's maintenance and getting help with car problems from an AI diagnostic chatbot. Users create an account, log in, and ask the chatbot about symptoms. The chatbot answers using that user's vehicle details and service history.

## Features

- **Accounts:** sign up and log in. Passwords are hashed with bcrypt and never stored in plain text.
- **Logins with tokens:** a successful login returns a JSON Web Token (JWT) that is valid for 1 hour.
- **AI diagnostic chatbot:** answers car questions with Google Gemini (`gemini-2.5-flash`), using the logged-in user's vehicle details and maintenance logs.
- **Protected routes:** the chatbot only works for logged-in users, and each user can only see their own data.

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (via `pg`) |
| Login and security | bcrypt, jsonwebtoken |
| AI | Google Gen AI SDK (Gemini) |

## Project structure

```
DASSK/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── App.jsx         # Picks which page to show for each URL
│       ├── main.jsx        # Starts the app and sets up the router
│       └── pages/
│           ├── Login.jsx     # Landing page (/)
│           └── Register.jsx  # Sign-up page (/register)
├── server/                 # Express backend
│   └── index.js            # API routes, database connection, auth
└── .github/workflows/      # GitHub Actions CI
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- A PostgreSQL database (local or hosted, such as Neon or Supabase)
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/xer40/DASSK.git
cd DASSK
```

### 2. Set up the database

Create these tables in your PostgreSQL database:

```sql
CREATE TABLE users (
  username  TEXT PRIMARY KEY,
  password  TEXT NOT NULL,      -- bcrypt hash, never the plain password
  email     TEXT
);

CREATE TABLE vehicles (
  id               SERIAL PRIMARY KEY,
  user_id          TEXT REFERENCES users(username) ON DELETE CASCADE,
  make             TEXT,
  model            TEXT,
  year             INTEGER,
  current_mileage  INTEGER
);

CREATE TABLE maintenance_logs (
  id                  SERIAL PRIMARY KEY,
  user_id             TEXT REFERENCES users(username) ON DELETE CASCADE,
  service_date        DATE,
  service_type        TEXT,
  mileage_at_service  INTEGER,
  notes               TEXT
);
```

### 3. Set up the backend

```bash
cd server
npm install
```

Create a file named `server/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=a-long-random-string
PORT=5001

# Optional, local development only: turns on DELETE /del_db, which wipes every user
# ALLOW_DB_RESET=true
```

To generate a strong `JWT_SECRET`, run:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start the server:

```bash
npm run dev     # restarts automatically when you edit files (nodemon)
# or
npm start
```

The API runs at `http://localhost:5001`. To check that it can reach the database, open `http://localhost:5001/api/test-db`.

### 4. Set up the frontend

In a second terminal:

```bash
cd client
npm install
```

If your backend isn't at `http://localhost:5001`, create `client/.env`:

```env
VITE_BACKEND_LINK=http://localhost:5001
```

Start the app:

```bash
npm run dev
```

Open the address Vite prints (usually `http://localhost:5173`).

## Pages

| Path | Page |
|---|---|
| `/` | Log in (the landing page) |
| `/register` | Create an account (linked from the login page) |

Any other path redirects to the login page.

## API reference

All request and response bodies are JSON.

### `POST /api/register`

Creates a new account.

```json
{ "username": "jane", "password": "secret123", "email": "jane@example.com" }
```

| Status | Meaning |
|---|---|
| `201` | Account created |
| `400` | Username or password missing |
| `409` | Username already taken |

### `POST /api/login`

Logs in an existing user and returns a token.

```json
{ "username": "jane", "password": "secret123" }
```

On success (`200`):

```json
{ "success": true, "message": "Login successful!", "username": "jane", "token": "<JWT>" }
```

| Status | Meaning |
|---|---|
| `200` | Logged in |
| `400` | Username or password missing |
| `401` | Wrong username or password (the response doesn't say which, so it can't be used to check whether an account exists) |

### `POST /api/chat` (login required)

Sends a question to the AI diagnostic chatbot. Include the token from `/api/login`:

```
Authorization: Bearer <token>
```

```json
{ "message": "My brakes squeak when I stop. What could it be?" }
```

On success (`200`):

```json
{ "success": true, "reply": "..." }
```

| Status | Meaning |
|---|---|
| `200` | The chatbot replied |
| `400` | Message missing |
| `401` | No token, or the token is invalid or expired |

### `GET /api/test-db`

Checks the database connection and returns the database's current time.

## Security notes

- Passwords are hashed with bcrypt (10 salt rounds) before they're saved.
- All database queries are parameterized to prevent SQL injection.
- The chatbot takes the user's identity from the verified token, never from the request body.
- Never commit `.env` files. They're already listed in `.gitignore`.
- Never set `ALLOW_DB_RESET=true` on a deployed server. It lets anyone who can reach the server delete every user.
