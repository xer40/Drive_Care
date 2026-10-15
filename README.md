# Drive_Care

A full-stack web app for tracking your car's maintenance and getting help with car problems from an AI diagnostic chatbot. Users create an account, log in, and ask the chatbot about symptoms. The chatbot answers using that user's vehicle details and service history.

## Features

- **Accounts:** sign up and log in. Passwords are hashed with bcrypt and never stored in plain text.
- **Logins with tokens:** signing up or logging in returns a JSON Web Token (JWT) that is valid for 1 hour, so new users are logged in straight away.
- **AI diagnostic chatbot:** diagnoses car problems with Google Gemini. It matches the symptoms against known problems for that year, make and model, uses the user's service history to rule out parts that were recently fixed, and flags overdue maintenance. It can look things up in the database while it works (older records, reminders, past conversations, community posts). Conversations are saved so they can be continued later.
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
│       ├── App.jsx             # Picks which page to show for each URL
│       ├── main.jsx            # Starts the app and sets up the router
│       ├── index.css           # Global styles
│       ├── auth.js             # Login token helpers and authFetch for calling protected API routes
│       ├── RequireAuth.jsx     # Wraps a page so only logged-in users can open it
│       ├── AuthLayout.jsx      # Shared layout for the login and sign-up pages, styled by AuthLayout.css
│       ├── Login.jsx           # Login page (/ and /login)
│       ├── Register.jsx        # Sign-up page (/register)
│       ├── maint&diag.jsx      # Maintenance and diagnostics page (/maintenance), styled by maint&diag.css
│       ├── DiagnosticsChat.jsx # AI diagnostics chat used on /maintenance, styled by DiagnosticsChat.css
│       ├── Markdown.jsx        # Formats the AI's replies (headings, bold, lists)
│       └── assets/             # Background images
├── server/                 # Express backend
│   ├── index.js            # App setup, mounts the route files
│   ├── db.js               # Database connection pool
│   ├── schema.sql          # Creates every table in an empty database
│   ├── helpers.js          # Validation helpers and the error handler
│   ├── aiTools.js          # Read-only database lookups the AI chatbot can run
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

# Which Gemini model the chatbot uses. The code falls back to gemini-2.5-flash,
# which Google no longer offers to new API keys, so set this to a current model
GEMINI_MODEL=gemini-3.5-flash-lite
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
| `/maintenance` | Maintenance and diagnostics: vehicle overview, next service, Quick Diagnostics, stats, maintenance history, costs and the AI diagnostics chat |

Logging in and creating an account both save the token in the browser's `localStorage` under the key `token`, then take you to `/maintenance`. Creating an account logs you in, so there is no need to log in again.

`/maintenance` is logged-in only. Opening it without a token, or with one that has expired, sends you to the login page with "Please log in to continue." To make another page logged-in only, wrap it in `RequireAuth` in [`App.jsx`](client/src/App.jsx):

```jsx
<Route path="/garage" element={<RequireAuth><Garage /></RequireAuth>} />
```

This check only decides what the browser shows. The server still verifies the token on every protected request.

The login and sign-up pages share one layout, [`AuthLayout.jsx`](client/src/AuthLayout.jsx): a photo with the DriveCare headline and features fills the left 2/3 of the screen, and the form sits in a card on the right 1/3 (never narrower than 400px). Below 900px wide the photo is hidden and the form fills the screen. The password field has a show/hide button. All of their styling is in `AuthLayout.css`.

On `/maintenance`:

- **Vehicle picker:** lists the logged-in user's vehicles from the API. Picking a car points the AI chat at that car.
- **AI diagnostics chat:** opens from the "Diagnose Issue" tab, or from the Quick Diagnostics card. Type a symptom (or pick a Common Issues chip) and press "Diagnose with AI"; the chat opens and sends the question. Follow-up questions continue the same conversation, and "New conversation" starts over. Under each answer the chat shows what the AI checked, such as "Checked your maintenance records".
- **Everything else on the page is sample data** kept in the page itself: the vehicle overview card, next service, stats, history table and costs. See [Project status](#project-status).

The page is a light design and sets `color-scheme: light`, so text boxes stay readable when the computer is in dark mode. New pages should do the same or set input text colours explicitly.

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

From the frontend, call protected routes with `authFetch` from [`auth.js`](client/src/auth.js). It adds the token and the JSON headers, returns the parsed response, and throws an `Error` with the server's message if the request fails. If the token is missing or expired (401), it logs the user out and sends them to the login page.

```js
import { authFetch } from './auth.js'

const { vehicles } = await authFetch('/api/vehicles')

const { vehicle } = await authFetch('/api/vehicles', {
  method: 'POST',
  body: { make: 'Honda', model: 'Civic', year: 2016 },
})
```

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

Both ways of asking return `reply`, the two saved `messages` (yours and the assistant's), the `conversation`, and `tools_used`, the names of the database lookups the AI ran for that answer.

How the chatbot works ([`routes/ai.js`](server/routes/ai.js)):

- **What it's given up front:** the conversation's vehicle (or all of the user's vehicles if none is attached), its 20 newest maintenance records with how long and how many miles ago each was done, and open reminders marked `[OVERDUE]` when they're past their date or mileage. Plus the last 40 messages of the conversation.
- **How it's told to diagnose:** match the symptoms to known problems for that year, make and model; demote parts that were replaced recently (while allowing that a fresh repair can cause new problems); treat overdue or never-logged maintenance as more likely causes; then answer with *Most likely causes*, *Less likely, based on your records*, *What to check next*, *Urgency* and *Questions that would help*. Anything involving brakes, steering, tires, overheating or fuel smells gets a clear "is it safe to drive" answer.
- **Database lookups:** while answering, the AI can run the lookups in [`aiTools.js`](server/aiTools.js), up to 4 rounds per question:

  | Lookup | Finds |
  |---|---|
  | `list_my_vehicles` | The user's vehicles, with mileage, record count and last service date |
  | `get_maintenance_records` | A vehicle's records, optionally filtered by keyword (e.g. `brake`) |
  | `get_reminders` | Upcoming and overdue reminders |
  | `search_past_diagnoses` | The user's earlier conversations about a symptom, and the last answer they got |
  | `search_community_posts` | Community posts by other owners, matched by make, model or keyword |

  Every lookup is read-only and filtered by the logged-in user's id on the server. The AI picks a lookup and its arguments but never writes SQL, so it can't read another user's private data. Community posts are the exception by design: every logged-in user can already see them in the feed.
- **Reliability:** temperature is 0.4 so the same question gets a consistent diagnosis. Temporary Gemini errors (429, 500, 503, 504) are retried up to 3 times; if Gemini is still unavailable the API answers `503` with "The AI assistant is busy right now." An empty reply is retried once.

### `GET /api/test-db`

Checks the database connection and returns the database's current time.

## Security notes

- Passwords are hashed with bcrypt (10 salt rounds) before they're saved.
- All database queries are parameterized to prevent SQL injection.
- Email format and password length are checked on the server, not only in the browser, so the rules can't be skipped by calling the API directly.
- Routes take the user's identity from the verified token, never from the request body.
- The AI chatbot only reaches the database through fixed, read-only lookups scoped to the logged-in user (see [AI chatbot](#ai-chatbot)). The vehicle data in its instructions is marked as user-entered information, not instructions.
- Never commit `.env` files. They're already listed in `.gitignore`.

## Project status

What works end to end today:

- Creating an account and logging in, from the browser through to the database.
- The vehicle picker and the AI diagnostics chat on `/maintenance`.
- Every API route listed above, for anyone sending a valid token.

Not connected yet:

- **There's no way to add a vehicle in the app.** Until there is, new users see "No vehicles added yet" and the AI asks for their car's details instead of using records.
- **Most of `/maintenance` is sample data:** the overview card always shows a 2022 Dodge Charger, and the history table, stats and costs are hardcoded. The maintenance, reminder and vehicle routes aren't called by these parts yet.
- **No log out button.** `logout()` in [`auth.js`](client/src/auth.js) is ready to call from one.
- **Unknown URLs show a blank page.**
- **The pages for vehicles, reminders and the community feed don't exist yet.**
- **`Login.css`, `register.css` and `App.css` aren't imported anywhere** and can be deleted.

Known gaps in the backend:

- No rate limiting on login or on the chatbot, which calls a paid API. One question can take up to 5 Gemini calls when the AI runs lookups.
- Tokens expire after 1 hour with no way to refresh them, so users are logged out mid-session.
- No image upload: posts and avatars take an `image_url`.
- No password reset.
- No automated tests.
