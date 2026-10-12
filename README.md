# Smart Lost & Found Portal (MERN)

Report lost/found items, search, upload photos, claim items, and let admins review claims.
One Node service serves both the API and the React site.

## Put it online (free): GitHub → MongoDB Atlas → Render

1. **Upload to GitHub** – create a new repository and upload everything in this folder
   (keep `client`, `server`, `package.json`, `render.yaml` at the repository root).
2. **MongoDB Atlas** – create a free cluster, add a database user, and under *Network Access*
   allow `0.0.0.0/0` (Render's IPs change). Copy the connection string
   (`mongodb+srv://USER:PASS@cluster.../lostfound`).
3. **Render** – *New → Blueprint*, pick your repository. When asked, enter:
   - `MONGODB_URI` – your Atlas string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – your first admin login (8+ characters)
   
   `JWT_SECRET` is generated automatically. Click deploy; the first build takes a few minutes.
4. Open the Render URL, log in with the admin email/password, and you're live.
   Afterwards you can delete `ADMIN_PASSWORD` from Render's environment settings.

Note: free Render services sleep after inactivity, so the first visit may take ~30 seconds.

## Run locally
```
cd server && npm install && cp .env.example .env   # fill MONGODB_URI + JWT_SECRET (32+ chars)
npm run dev                                         # API on :5000
cd ../client && npm install && npm run dev          # site on :5173 (proxies /api to :5000)
```
Tests: `cd server && npm test`.

## What's inside
- Auth with HTTP-only cookies, bcrypt, rate limiting, Helmet security headers, live role/disabled checks
- Reports with photos (validated JPEG/PNG/WebP, stored in MongoDB), search and filters
- Rule-based match suggestions, private ownership claims, admin review with recorded reasons
- Admin dashboard: stats, claim review, hide/restore/delete reports, enable/disable users

## Known limits
No email notifications. Match scoring is simple rules, not AI. Add HTTPS-only custom domain via Render if needed.
