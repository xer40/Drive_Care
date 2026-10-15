# Drive_Care

A full-stack web app for tracking your car's maintenance and getting help with car problems from an AI diagnostic chatbot. Users create an account, log in, and ask the chatbot about symptoms. The chatbot answers using that user's vehicle details and service history.

## Features

- **Accounts:** sign up and log in. Passwords are hashed with bcrypt and never stored in plain text.
- **Logins with tokens:** signing up or logging in returns a JSON Web Token (JWT) that is valid for 1 hour, so new users are logged in straight away.
- **AI diagnostic chatbot:** answers car questions with Google Gemini, using the logged-in user's vehicles and maintenance records. Conversations are saved so they can be continued later.
- **Garage:** vehicles, maintenance records and service reminders.
- **Community:** posts, comments and likes.
- **Protected routes:** everything except sign-up and login needs a token, and users can only change their own data.

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
Drive_Care/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── App.jsx         # Picks which page to show for each URL
│       ├── auth.js         # Saves, reads and removes the login token (saveToken, getToken, isLoggedIn, logout)
│       ├── RequireAuth.jsx # Wraps a page so only logged-in users can open it
│       ├── main.jsx        # Starts the app and sets up the router
│       ├── index.css       # Global styles
│       ├── Login.jsx       # Login page (/ and /login), styled by Login.css
│       ├── register.jsx    # Sign-up page (/register), styled by register.css
│       ├── maint&diag.jsx  # Maintenance and diagnostics page (/maintenance), styled by maint&diag.css
│       └── assets/         # Background images
├── server/                 # Express backend
│   ├── index.js            # App setup, mounts the route files
│   ├── db.js               # Database connection pool
│   ├── schema.sql          # Creates every table in an empty database
│   ├── helpers.js          # Validation helpers and the error handler
│   ├── middleware/auth.js  # JWT check (requireAuth)
│   └── routes/             # auth, users, vehicles, maintenance, reminders, posts, ai
└── .github/workflows/      # GitHub Actions CI
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- A PostgreSQL database (local or hosted, such as Neon or Supabase)
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/xer40/Drive_Care.git
cd Drive_Care
```

### 2. Set up the database

The server expects these tables: `users`, `vehicles`, `maintenance_records`, `reminders`, `posts`, `comments`, `post_likes`, `ai_conversations` and `ai_messages`. Child rows are removed by `ON DELETE CASCADE` foreign keys, and `updated_at` columns are maintained by database triggers.

If you are using the team's shared database, the tables already exist and there is nothing to do here.

To create them in a new, empty database, run [`server/schema.sql`](server/schema.sql) against it. With `psql` installed:

```bash
psql "postgresql://user:password@host:5432/dbname" -f server/schema.sql
```

Or paste the file's contents into your database host's SQL editor. Only run it on an empty database: where the tables already exist, every statement fails with "already exists". See [Database](#database) for what it creates.

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

# Optional: which Gemini model the chatbot uses (default: gemini-3.8-flash)
# GEMINI_MODEL=gemini-3.5-flash
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
| `/` and `/login` | Log in |
| `/register` | Create an account (linked from the login page) |
| `/maintenance` | Maintenance and diagnostics: overview, service records, add a record, diagnostics and schedule tabs |

Logging in and creating an account both save the token in the browser's `localStorage` under the key `token`, then take you to `/maintenance`. Creating an account logs you in, so there is no need to log in again.

`/maintenance` is logged-in only. Opening it without a token, or with one that has expired, sends you to the login page with "Please log in to continue." To make another page logged-in only, wrap it in `RequireAuth` in [`App.jsx`](client/src/App.jsx):

```jsx
<Route path="/garage" element={<RequireAuth><Garage /></RequireAuth>} />
```

This check only decides what the browser shows. The server still verifies the token on every protected request.

On screens wider than 800px the login and sign-up pages show a background image on the left half and the form centred in the right half. On narrower screens the image is hidden and the form takes the whole screen.

`/maintenance` currently shows built-in sample records and does not call the API yet. See [Project status](#project-status).

## Database

PostgreSQL 17. [`server/schema.sql`](server/schema.sql) is the full definition and matches the live database.

| Table | Holds | Belongs to |
|---|---|---|
| `users` | Accounts: `username`, `email`, `password_hash`, `avatar_url` | |
| `vehicles` | A user's cars: `make`, `model`, `year`, `vin`, `current_mileage` | `users` |
| `maintenance_records` | Services done: `service_type`, `service_date`, `mileage`, `cost`, `notes` | `vehicles` |
| `reminders` | Services coming up: `service_type`, `due_date`, `due_mileage`, `is_done` | `vehicles` |
| `posts` | Community posts: `title`, `body`, `image_url`, optional tagged vehicle | `users` |
| `comments` | Comments on posts | `posts`, `users` |
| `post_likes` | One row per user per liked post | `posts`, `users` |
| `ai_conversations` | Chatbot conversations: `title`, optional vehicle | `users` |
| `ai_messages` | Each question and answer: `role` (`user` or `assistant`), `content` | `ai_conversations` |

Rules the database enforces:

- **Unique values:** usernames, emails and VINs can't be repeated.
- **Ranges:** `year` is between 1900 and 2100; mileage and cost can't be negative.
- **Reminders:** each needs a `due_date` or a `due_mileage`.
- **Likes:** a user can like a post only once.
- **Deleting a user** removes their vehicles, records, reminders, posts, comments, likes and conversations.
- **Deleting a vehicle** removes its maintenance records and reminders. Posts and conversations that tagged it are kept and lose the tag.
- **`updated_at`** is set by a trigger on every update, so the server never sets it. `reminders`, `post_likes` and `ai_messages` have no `updated_at`.
- **IDs** are assigned by the database and can't be set by hand.

Row level security is switched on for every table with no policies. That blocks access through the database host's public API; the server is unaffected because it connects as the table owner.

The constraint names in `schema.sql` matter: `server/helpers.js` maps them to the error messages users see (for example `users_username_key` becomes "This username is already taken."). If you rename or add a constraint, update `CONSTRAINT_MESSAGES` there too.

If you change a table, update `schema.sql` in the same commit so the file keeps matching the database.

## API reference

All request and response bodies are JSON. Successful responses look like `{ "success": true, ... }` and errors like `{ "success": false, "message": "..." }`.

Every route except `/api/register`, `/api/login` and `/api/test-db` needs the token returned by `/api/register` or `/api/login`:

```
Authorization: Bearer <token>
```

Common statuses: `400` invalid or missing input, `401` no token or an invalid/expired one, `404` not found (also used for records that belong to someone else), `409` duplicate username, email or VIN.

Updates use `PATCH` and only change the fields you send. Dates are `YYYY-MM-DD`.

Calling a protected route from the frontend looks like this:

```js
import { getToken } from './auth.js'

const backend = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5001'

const response = await fetch(`${backend}/api/vehicles`, {
  headers: { Authorization: `Bearer ${getToken()}` },
})
const data = await response.json()

if (response.status === 401) {
  // No token, or it expired (tokens last 1 hour): send the user back to the login page
}
```

For `POST`, `PATCH` and `PUT`, also send `'Content-Type': 'application/json'` and a `body` made with `JSON.stringify(...)`.

### Accounts

| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/api/register` | `username`, `email`, `password` | Creates an account. `email` must be a valid address and `password` at least 8 characters. Returns `token` (valid 1 hour) and `user`, same as login |
| `POST` | `/api/login` | `username`, `password` | Returns `token` (valid 1 hour) and `user` |
| `GET` | `/api/users/me` | | Your profile |
| `PATCH` | `/api/users/me` | `username`, `email`, `avatar_url` | `email` must be a valid address |
| `PUT` | `/api/users/me/password` | `current_password`, `new_password` | `new_password` must be at least 8 characters |
| `DELETE` | `/api/users/me` | `password` | Deletes your account and everything in it |
| `GET` | `/api/users/:id` | | Public profile (no email) |

### Vehicles

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/vehicles` | |
| `POST` | `/api/vehicles` | `make`, `model`, `year`, optional `vin`, `current_mileage` |
| `GET` | `/api/vehicles/:id` | |
| `PATCH` | `/api/vehicles/:id` | any of the fields above |
| `DELETE` | `/api/vehicles/:id` | |

### Maintenance records

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/vehicles/:vehicleId/maintenance` | |
| `POST` | `/api/vehicles/:vehicleId/maintenance` | `service_type`, `service_date`, optional `mileage`, `cost`, `notes` |
| `GET` | `/api/maintenance/:id` | |
| `PATCH` | `/api/maintenance/:id` | any of the fields above |
| `DELETE` | `/api/maintenance/:id` | |

Logging or editing a record with a `mileage` higher than the vehicle's `current_mileage` raises the vehicle's `current_mileage` to match. It is never lowered, so older records and deletions don't wind it back.

### Reminders

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/api/reminders` | | All your vehicles. Optional `?done=true` or `?done=false` |
| `GET` | `/api/vehicles/:vehicleId/reminders` | | |
| `POST` | `/api/vehicles/:vehicleId/reminders` | `service_type`, plus `due_date` and/or `due_mileage` | |
| `PATCH` | `/api/reminders/:id` | `service_type`, `due_date`, `due_mileage`, `is_done` | |
| `DELETE` | `/api/reminders/:id` | | |

### Posts, comments and likes

Any logged-in user can read posts and comments. Only the author can edit or delete them.

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/api/posts` | | Newest first. Optional `?user_id=`, `?limit=` (max 100), `?offset=` |
| `POST` | `/api/posts` | `title`, optional `body`, `image_url`, `vehicle_id` | `vehicle_id` must be one of your vehicles |
| `GET` | `/api/posts/:id` | | |
| `PATCH` | `/api/posts/:id` | any of the fields above | |
| `DELETE` | `/api/posts/:id` | | |
| `PUT` | `/api/posts/:postId/like` | | Returns `like_count` |
| `DELETE` | `/api/posts/:postId/like` | | Returns `like_count` |
| `GET` | `/api/posts/:postId/comments` | | Oldest first |
| `POST` | `/api/posts/:postId/comments` | `body` | |
| `PATCH` | `/api/comments/:id` | `body` | |
| `DELETE` | `/api/comments/:id` | | |

Posts include `username`, `avatar_url`, `vehicle_make`, `vehicle_model`, `vehicle_year`, `like_count`, `comment_count` and `liked_by_me`.

### AI chatbot

| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/api/chat` | `message`, optional `conversation_id`, `vehicle_id` | Starts a new conversation if no `conversation_id` is sent |
| `GET` | `/api/conversations` | | Most recently used first |
| `POST` | `/api/conversations` | optional `vehicle_id`, `title` | Starts an empty conversation |
| `GET` | `/api/conversations/:id` | | The conversation and its `messages` |
| `PATCH` | `/api/conversations/:id` | `title`, `vehicle_id` | |
| `DELETE` | `/api/conversations/:id` | | |
| `POST` | `/api/conversations/:id/messages` | `content` | Asks a question in that conversation |

Both ways of asking return `reply`, the two saved `messages` (yours and the assistant's) and the `conversation`. The chatbot is given the conversation's vehicle and its maintenance records, or all of your vehicles if the conversation has none.

### `GET /api/test-db`

Checks the database connection and returns the database's current time.

## Security notes

- Passwords are hashed with bcrypt (10 salt rounds) before they're saved.
- All database queries are parameterized to prevent SQL injection.
- Email format and password length are checked on the server, not only in the browser, so the rules can't be skipped by calling the API directly.
- Routes take the user's identity from the verified token, never from the request body.
- Never commit `.env` files. They're already listed in `.gitignore`.

## Project status

What works end to end today:

- Creating an account and logging in, from the browser through to the database.
- Every API route listed above, for anyone sending a valid token.

Not connected yet:

- **The frontend only calls `/api/register` and `/api/login`.** No page sends the token back, so the vehicle, maintenance, reminder, post and chatbot routes aren't used by any page.
- **`/maintenance` runs on sample data** kept in the page itself. Records added there disappear on refresh.
- **No log out button.** `logout()` in [`auth.js`](client/src/auth.js) is ready to call from one.
- **Unknown URLs show a blank page.**
- **The pages for vehicles, reminders, the community feed and the chatbot don't exist yet.**

Known gaps in the backend:

- No rate limiting on login or on the chatbot, which calls a paid API.
- Tokens expire after 1 hour with no way to refresh them, so users are logged out mid-session.
- No image upload: posts and avatars take an `image_url`.
- No password reset.
- No automated tests.
