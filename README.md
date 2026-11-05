<div align="center">

# 📞 CallFlow

**An AI voice agent that phones your customers, books appointments or asks your own questions, and saves every answer in one place.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-frontend-646CFF?logo=vite&logoColor=white)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2451)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

</div>

---

## 📖 About

Businesses, clinics, coaching centres and survey teams spend hours phoning people to confirm appointments or ask the same questions again and again. The answers end up in notebooks and chats, where they are easy to lose.

**CallFlow automates that work.** Upload customers who have agreed to be called, describe what the agent should do, and press start. An AI agent places the calls one by one, talks naturally, retries people who do not answer, and saves the answers as structured results you can filter, read and export. You can watch calls live while they happen.

## ✨ Features

### Calling
- **Two campaign types**
  - **Booking:** the agent asks for a weekday and morning or afternoon, confirms it, and a confirmation email can be sent.
  - **Questions:** write any questions and choose the answer type (text, yes/no, number). Answers are saved per question.
- **Ready-made templates** such as customer feedback, lead qualification and event RSVP.
- **Automatic call queue** with retries for unanswered calls, a limit on simultaneous calls, and safe handling of network errors (never dials the same person twice).
- **Consent first:** only leads marked as consented are ever called.
- **Live view:** calls in progress with a running timer and the conversation as it happens.
- **Call activity:** every call with its status and a plain-words note (waiting for balance, line busy, failed and why, finished).

### Results and data
- **Results page** with status, booked day and time, answers, summary, full transcript, duration and cost.
- **CSV export** of all results.
- **Dashboard** with totals, successful calls and recent activity, plus a weekly **Schedule** of confirmed bookings.
- **Leads manager:** CSV upload, add, edit, delete. Phone numbers are cleaned into international format.

### Billing
- **5 free calls** for every new account, then a **prepaid balance**.
- Prices follow the **CALL-E pay-as-you-go rates**, shown in rupees with a cost calculator.
- **Razorpay** top-ups with server-side signature verification, or **demo mode** for testing without real money.
- Calls wait (not fail) when the trial ends or the balance is low, and continue after money is added.

### Communication
- **Meeting invites:** email Google Meet invites to one or many people.
- **Reports:** email a file as an attachment.
- **Booking confirmation** emails to customers.

### Experience
- Public website: Home, Features, How it works, Pricing, Responsible calling.
- Clean white design with **dark mode**, sidebar app layout, works on phones.
- Every user is a normal user with every feature. There are no admin accounts.

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Vite, CSS variables for themes |
| Backend | Node.js, Express 5 (ES modules) |
| Database | MongoDB, Mongoose 8 |
| Authentication | JWT in an HTTP-only cookie, bcrypt |
| AI calling | CALL-E Developer API (REST and webhooks) |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |
| Uploads | multer |
| Packaging | Docker, Docker Compose, Render blueprint |

## 🔄 How it works

```
Start campaign ─► queue one call per consenting lead
      │
      ▼
Worker places a call through CALL-E (goal, questions, result format, webhook)
      │
      ▼
CALL-E phones the customer and holds the conversation
      │
      ▼
Result arrives by webhook (and is also checked by polling as a backup)
      │
      ▼
Saved as a result: answers, summary, transcript, duration, cost
      │
      ├─► cost taken from the user's balance
      ├─► confirmation email for confirmed bookings
      └─► retry later if nobody answered
```

## 🏗️ Architecture

```
 Browser (React) ──cookie──►  Express API  ◄── CALL-E webhook
                                 │   │
                                 │   └──► CALL-E API (place call, read status)
                 ┌───────────────┼────────────────┐
                 ▼               ▼                ▼
             MongoDB        Call worker      SMTP email
                          (queue, retries,   Razorpay
                           live polling)
```
In production one service runs the API and serves the built website, so login cookies and the API share one address.

## 📁 Project structure

```
callflow/
├── Backend/src/
│   ├── index.js            server start and routes
│   ├── env.js              loads settings first
│   ├── routes/             auth, leads, campaigns, bookings, dashboard,
│   │                       meetings, reports, plan, payments
│   ├── services/           callE, calleResult, callWorker, calleAccount,
│   │                       billing, razorpay, email, secret
│   ├── models/             User, Lead, Campaign, Call, Booking, Payment, Meeting
│   └── middleware/         login check
├── frontend/src/
│   ├── pages/marketing/    Home, Features, How it works, Pricing, Responsible
│   ├── pages/auth/         Login, Register
│   ├── pages/app/          Dashboard, Campaigns, Leads, Results, Schedule,
│   │                       Meetings, Reports, Billing, Settings
│   ├── components/         layout, plan banner, rate card, add-money, icons
│   ├── api/client.js       all backend calls
│   └── styles/             app and marketing styles, light and dark themes
├── Dockerfile · docker-compose.yml · render.yaml
├── DEPLOY.md               deployment guide
└── .env.example            every setting
```

## 🚀 Getting started

**You need:** Node.js 20 or newer and MongoDB (local or Atlas).

```bash
# 1. Settings
cp .env.example .env        # Windows PowerShell: copy .env.example .env
# open .env and fill in JWT_SECRET and MONGODB_URI. Keep CALLE_MOCK=true to test.

# 2. Backend
cd Backend
npm install
npm run dev                 # API on http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # open the address it prints
```

Or with Docker: `docker compose up --build`, then open http://localhost:4000.

**Test mode:** with `CALLE_MOCK=true` the app simulates calls (confirmed, declined, unanswered), so you can try everything without phoning anyone or paying.

**Real calls:** set `CALLE_MOCK=false`, add `CALLE_API_KEY`, and set `PUBLIC_URL` to a public https address (for example from ngrok) because CALL-E sends results to `PUBLIC_URL/api/campaigns/webhook`.

### CSV format for leads
```csv
name,phone,consent,email
Priya Sharma,+919876543210,yes,priya@example.com
```

### Settings

| Variable | Meaning |
|---|---|
| `MONGODB_URI`, `JWT_SECRET` | database and login signing |
| `PUBLIC_URL`, `CLIENT_ORIGIN` | public https address |
| `CALLE_MOCK` | `true` fake calls, `false` real calls |
| `CALLE_API_KEY`, `CALLE_WEBHOOK_SECRET` | CALL-E access and webhook protection |
| `DEFAULT_COUNTRY_CODE` | added to 10-digit numbers, default `+91` |
| `TRIAL_CALL_LIMIT` | free calls per account, default 5 |
| `CALLE_MAX_CONCURRENT`, `CALL_MAX_ATTEMPTS`, `CALL_RETRY_DELAY_MINUTES` | queue behaviour |
| `PAYMENTS_DEMO`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | payments |
| `USD_TO_INR`, `PRICE_MARKUP_PERCENT` | pricing in rupees |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | email (Gmail app password) |

## 🗄️ Data model

| Collection | Purpose |
|---|---|
| **User** | account, trial calls used, prepaid balance, optional own CALL-E key (encrypted) |
| **Lead** | customer to call: name, phone, email, consent |
| **Campaign** | one run: goal, script steps, type, questions |
| **Call** | queue entry per lead: status, tries, next attempt, CALL-E id, live lines, note |
| **Booking** | saved result: status, day, time, answers, summary, transcript, seconds, cost |
| **Payment** | a balance top-up |
| **Meeting** | a sent invite |

## 🔌 API

All routes are under `/api` and need a logged-in user, except register, login, the webhook, `/payments/config` and `/health`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` |
| Leads | `GET /leads` · `POST /leads` · `POST /leads/upload` · `PATCH /leads/:id` · `DELETE /leads/:id` · `DELETE /leads` |
| Campaigns | `POST /campaigns/start` · `GET /campaigns` · `GET /campaigns/calls` · `POST /campaigns/webhook` |
| Results | `GET /bookings` · `GET /bookings/:id` · `GET /bookings/export.csv` |
| Dashboard | `GET /dashboard` |
| Meetings | `GET /meetings` · `POST /meetings/invite` · `POST /meetings/smtp-check` |
| Reports | `POST /reports/send` |
| Plan | `GET /plan` · `PUT /plan/key` · `DELETE /plan/key` · `GET /plan/system` |
| Payments | `GET /payments/config` · `POST /payments/order` · `POST /payments/verify` · `GET /payments/history` |

## 🔒 Security and responsible calling

- Only leads with **consent** are called.
- Passwords are hashed with bcrypt; sessions use HTTP-only cookies.
- The webhook accepts only requests that carry the right secret.
- Optional personal API keys are stored encrypted (AES-256-GCM); secrets are never sent to the browser.
- Razorpay payments are verified on the server and credited only once.
- Daily limits on emails sent.
- All secrets live in environment variables, never in the code.
- Calling laws differ by country (consent and do-not-call rules). Users must follow the rules that apply to them.

## ⚠️ Limitations

- Depends on the CALL-E service, its languages and call limits.
- Real online payments need a verified Razorpay account; demo mode is available until then.
- Booking campaigns use fixed choices (weekday and morning or afternoon).

## 🗺️ Roadmap

- Custom booking slots and calendar sync
- More languages and call recordings
- Team workspaces
- Richer analytics
- Automated tests

## 🌐 Deployment

See [DEPLOY.md](DEPLOY.md) for Render and MongoDB Atlas.
