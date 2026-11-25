# PetalMatch

A production-ready romantic compatibility web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Prisma ORM**, and **PostgreSQL**.

## Two Distinct Experiences

1. **Public Participant Experience (`/m/[slug]` & `/`)**
   - Dreamy pastel floral landing page with lightweight floating petals and glowing ambient particles.
   - Smooth animated transition to a 2-field form (*Your name* & *Your crush's name*).
   - Server-calculated deterministic compatibility score (1–100%) with animated floral reveal, circular progress ring, native Web Share API, PNG card download, and replay controls.
   - Strict privacy: participants never see other submissions, admin data, or analytics.

2. **Private Administrator Dashboard (`/login` & `/dashboard/*`)**
   - Protected by HTTP-only session cookies, bcrypt password hashing, session rotation, and rate limiting.
   - **Overview**: Real-time KPIs from PostgreSQL (Total submissions, Today's submissions, Active links, Total visits, Avg compatibility, Top crush name).
   - **Submissions**: Searchable, filterable, sortable table with pagination, detail side panel, bulk delete, and CSV export.
   - **Sharing Links**: Create unlimited `/m/[slug]` links with custom headings, welcome messages, expiration dates, submission caps, and QR code PNG generator.
   - **Analytics**: Recharts daily/weekly/monthly charts, conversion rates, most active links, and normalized crush-name leaderboard.
   - **Settings**: Profile, password change (with session revocation), and configurable data retention cleanup.

---

## Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your PostgreSQL connection string and secrets:
```bash
cp .env.example .env
```

### 3. Start PostgreSQL & run migrations
Ensure PostgreSQL is running locally, then run:
```bash
npx prisma migrate dev --name init
```

### 4. Seed the administrator account
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run:
```bash
npm run create-admin
```
This creates your administrator account and a default `/m/welcome` sharing link.

### 5. Run the development server
```bash
npm run dev
```
Open `http://localhost:3000` for the public experience and `http://localhost:3000/login` for the admin dashboard.

---

## Production Deployment on Render

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial PetalMatch release"
git push origin main
```

### 2. Create Render PostgreSQL
1. In the Render Dashboard, click **New +** → **PostgreSQL**.
2. Choose a name (e.g. `petalmatch-db`), region, and plan (enable **Automated Backups** on paid plans for managed daily snapshots).
3. Copy the **Internal Database URL** (for the Render Web Service) and **External Database URL** (if running commands from your laptop).

### 3. Create Render Web Service
1. Click **New +** → **Web Service** and connect your GitHub repository (or use the included `render.yaml` Blueprint).
2. Configure:
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
   - **Health Check Path**: `/api/health`

### 4. Set Production Environment Variables
In Render Web Service → **Environment**:
- `NODE_ENV` = `production`
- `DATABASE_URL` = *(your Render PostgreSQL Internal Database URL)*
- `NEXT_PUBLIC_APP_URL` = `https://your-domain.com` (or `https://petalmatch.onrender.com`)
- `APP_SECRET` = *(generate a 64-char random hex string)*
- `ADMIN_EMAIL` = *(your admin email)*
- `ADMIN_PASSWORD` = *(a strong password)*

### 5. Create the Production Admin Account
Once the first deploy succeeds, open the Render **Shell** tab for your Web Service and run:
```bash
npm run create-admin
```
(Remove `ADMIN_PASSWORD` from Render env vars afterward if you prefer.)

### 6. Custom Domain & HTTPS
1. Go to Render Web Service → **Settings** → **Custom Domains** → **Add Custom Domain**.
2. Add the suggested `CNAME` / `A` DNS records at your domain registrar.
3. Render automatically provisions and renews **TLS/HTTPS** certificates via Let's Encrypt.
4. Update `NEXT_PUBLIC_APP_URL` to `https://your-custom-domain.com` and redeploy.
