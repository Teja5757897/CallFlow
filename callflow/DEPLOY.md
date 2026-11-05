# Deploying CallFlow (Render + MongoDB Atlas)

All keys live in **environment variables** on the host. They are never in the code, so you can change
the CALL-E key, the payment keys or demo mode at any time without editing a file: change the value,
save, and Render restarts the app.

## 1. Database (MongoDB Atlas, free)
1. Create a free cluster at mongodb.com/atlas.
2. Database Access: add a user and password. Network Access: allow `0.0.0.0/0` (Render's address changes).
3. Press Connect, then Drivers, and copy the connection string. Put your password in it and add the
   database name: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/callflow`

## 2. Code on GitHub
Push the project to a **private** GitHub repository. `.env` is in `.gitignore`, so it is not uploaded.
Check that no key is in any file before you push.

## 3. Render
1. render.com, New, **Blueprint**, pick your repository. Render reads `render.yaml` and asks for the
   secret values. (Or New, Web Service, Docker, and add the variables by hand from the table below.)
2. After the first deploy, copy your address (for example `https://callflow.onrender.com`) and set
   `PUBLIC_URL` and `CLIENT_ORIGIN` to it, then save. Render restarts.
3. Open the site, create an account, then check **Settings, System status**.
   Green lines mean the server picked up your settings.

## Environment variables
| Variable | What it does | Example |
|---|---|---|
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `JWT_SECRET` | Signs logins. Changing it logs everyone out | long random text |
| `PUBLIC_URL` | Your public https address. CALL-E posts call results here | `https://callflow.onrender.com` |
| `CLIENT_ORIGIN` | Same as `PUBLIC_URL` | `https://callflow.onrender.com` |
| `CALLE_MOCK` | `true` = fake calls, `false` = real calls | `false` |
| `CALLE_API_KEY` | Your CALL-E key. Change it here when it changes | `iams_live_...` |
| `CALLE_WEBHOOK_SECRET` | Secret CALL-E sends with results | long random text |
| `PAYMENTS_DEMO` | `true` = demo payments (no real money). Ignored once Razorpay keys are set | `true` |
| `RAZORPAY_KEY_ID` | Razorpay key id (`rzp_test_...` or `rzp_live_...`) | |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | |
| `USD_TO_INR` | Rupees per US dollar, for pricing calls | `88` |
| `PRICE_MARKUP_PERCENT` | Percent added on top of CALL-E's cost | `0` |
| `TRIAL_CALL_LIMIT` | Free calls per new account | `5` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Email sending (Gmail app password) | |

## Switching things later (no code changes)
- **New CALL-E key:** edit `CALLE_API_KEY`, save.
- **Test mode to real calls:** set `CALLE_MOCK=false`, make sure `CALLE_API_KEY` and `PUBLIC_URL` are set.
- **Demo payments to Razorpay:** add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Demo turns itself off.
  Start with `rzp_test_` keys, move to `rzp_live_` keys after Razorpay activates your account.
- **Turn payments off:** set `PAYMENTS_DEMO=false` and leave the Razorpay keys empty.

## Good to know
- The free Render plan sleeps after inactivity (the first visit is slow) and may block outgoing email.
  Use a paid instance for real customers.
- Uploaded data lives in MongoDB, so redeploys do not delete users or results.
- Never put a real key in GitHub. If one leaks, make a new one and update the variable.
