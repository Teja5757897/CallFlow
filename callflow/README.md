# CallFlow

An AI agent calls your customers, agrees a day and time, saves the booking and emails the confirmation. Only people who gave consent are called.

**Pages:** Home, Features, How it works, Pricing, Responsible calling, Log in, Register, then (after login) Dashboard, Schedule, Campaigns, Leads, Bookings, Reports, Settings. Light and dark themes.

```
callflow/
├── Backend/      Express + MongoDB API, call queue worker, email
├── frontend/     React (Vite) website and app
├── Dockerfile            builds the frontend, then serves it from the backend
├── docker-compose.yml    app + MongoDB together
└── .env.example          every setting the app needs
```

## What you need to do

### 1. Run it on your computer (test mode, no real calls)
1. Install Docker Desktop.
2. Copy `.env.example` to `.env` (in PowerShell: `copy .env.example .env`).
3. Open `.env` and set `JWT_SECRET` to any long random text. Leave `CALLE_MOCK=true`.
4. Run: `docker compose up --build`
5. Open http://localhost:4000, create an account (the first account becomes **admin**), go to **Leads**, upload a CSV, then **Campaigns** and launch. In test mode the calls are simulated and results appear on the Dashboard after a few seconds.

CSV format (a template can be downloaded on the Leads page):
```
name,phone,consent,email
Priya Sharma,+919876543210,yes,priya@example.com
```

### 2. Put it on GitHub
Run in the `callflow` folder:
```
git init
git add .
git status        (check that .env and node_modules are NOT listed)
git commit -m "CallFlow"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin main
```
Never upload `.env`. It holds your secrets, and `.gitignore` already excludes it.

### 3. Deploy on Render (one service, no Netlify needed)
CallFlow signs users in with a cookie, so the website and the API must share one address. The Dockerfile does that: the backend serves the website too.

1. Create a free database at **MongoDB Atlas**. Under *Network Access* allow `0.0.0.0/0`. Copy the connection string (it starts with `mongodb+srv://`).
2. On Render choose **New, Web Service**, connect your repo, language **Docker**, root directory empty.
3. Set the Health Check Path to `/api/health`.
4. Add these environment variables:

| Name | Value |
|---|---|
| `JWT_SECRET` | long random text |
| `MONGODB_URI` | your Atlas connection string |
| `CALLE_MOCK` | `true` to test, `false` for real calls |
| `CALLE_WEBHOOK_SECRET` | long random text |
| `PUBLIC_URL` | your Render address, e.g. `https://callflow-xxxx.onrender.com` (no `/` at the end) |

5. Deploy. Open your Render address and register.

### 4. Real calls and emails (when you are ready)
- **Calls:** get an API key from CALL-E, then set `CALLE_MOCK=false` and `CALLE_API_KEY=...`. `PUBLIC_URL` must be your public https address, because CALL-E posts results back to `PUBLIC_URL/api/campaigns/webhook`.
- **Email:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM`. For Gmail use an app password.
- **Edit the sample pricing plans** in `frontend/src/pages/marketing/Pricing.jsx` to match your real offer.

### Things to know
- Render's free plan sleeps when idle, and the call queue pauses while it sleeps. For real campaigns use a paid instance.
- Calling laws differ by country. Keep consent records and follow the rules that apply to you.
- To work on the frontend with hot reload: run the backend, then in `frontend` run `npm install` and `npm run dev` (it forwards `/api` to port 4000).
