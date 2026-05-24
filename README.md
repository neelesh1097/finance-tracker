# Advanced Wealth & Goal Tracker

An advanced full-stack personal finance platform enabling users to track expenses, set category budgets, manage dynamic investment portfolios (with ROI, CAGR, and XIRR stats), handle subscription cron renewals, and collaborate on shared group bill splits with settlement optimization and custom split presets.

---

## 🚀 Features

* **Dashboard**: Ratios (Income-to-Spend), EOM balance calculators, cash-flow trends, and customizable income settings.
* **Smart Expenses**: Ledger tracking and bank CSV/Excel statement importer with auto-classification.
* **Smart Budgeting**: Limits (daily, weekly, monthly) with warning notifications.
* **Goal Planner**: Multi-year savings targets with compounding projections.
* **Asset Class Investments**: Dynamic CAGR and XIRR performance metrics with absolute ROI fallback for assets held under 1 year.
* **Subscription Engine**: Recurrent bills cron scheduler and reminders.
* **Shared Wallets**: Multi-user bill splitting with min-max settlements optimization and split distribution presets.

---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* MySQL or PostgreSQL database instance

### 1. Backend Setup
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables: Create a `.env` file inside `/backend` and configure:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/finance_db" # or postgresql URL
   JWT_SECRET="your_development_secret_key"
   PORT=5000
   CORS_ORIGIN="http://localhost:3000"
   ```
4. Run migrations and database seeder:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to `/frontend`:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite client:
   ```bash
   npm run dev
   ```
   * The app will run on `http://localhost:3000`.

---

## ☁️ Step-by-Step Render Deployment Guide

Follow this guide to deploy the entire stack (Database, Backend Service, and Frontend Static Site) on Render.

### Step 1: Create a PostgreSQL Database
Render provides native PostgreSQL hosting.
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New** ➡️ **PostgreSQL**.
3. Configure your database details:
   * **Name**: `finance-db`
   * **Database**: `finance_db`
   * **User**: `finance_admin`
   * **Region**: Choose a region closest to your users.
4. Click **Create Database**.
5. Once active, copy the **External Connection String / Database URL** (e.g. `postgres://finance_admin:password@host.render.com/finance_db`).

---

### Step 2: Deploy the Backend (Web Service)
1. In the Render Dashboard, click **New** ➡️ **Web Service**.
2. Connect your GitHub repository.
3. Configure the following build and run settings:
   * **Name**: `finance-backend`
   * **Region**: Choose the same region as your database.
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run build`
     *(This automatically installs dependencies, generates Prisma client, pushes the schema, and builds your TypeScript files).*
   * **Start Command**: `node dist/server.js`
4. Expand the **Environment Variables** section and add:
   * `DATABASE_URL`: *Paste the External Connection String copied from Step 1.*
   * `JWT_SECRET`: *Enter a long, secure random key.*
   * `PORT`: `10000`
   * `CORS_ORIGIN`: `https://your-frontend-subdomain.onrender.com` *(You will update this in Step 4 once the frontend domain is generated).*
5. Click **Deploy Web Service**.
6. Once deployed, copy your backend service URL (e.g. `https://finance-backend.onrender.com`).

---

### Step 3: Deploy the Frontend (Static Site)
1. In the Render Dashboard, click **New** ➡️ **Static Site**.
2. Connect your GitHub repository.
3. Configure the build settings:
   * **Name**: `finance-tracker`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Expand the **Environment Variables** section and add:
   * `VITE_API_URL`: `https://finance-backend.onrender.com/api` *(Paste your backend URL from Step 2, appending `/api`).*
5. Configure **Redirects/Rewrites** (Crucial for React Router client routing):
   * Go to the **Redirects/Rewrites** tab in the sidebar of your Static Site dashboard.
   * Click **Add Rule**.
   * Set **Source**: `/*`
   * Set **Destination**: `/index.html`
   * Set **Action**: `Rewrite`
6. Click **Deploy Static Site**.

---

### Step 4: Link Frontend and Backend (CORS Config)
1. Once your static site finishes deploying, copy its URL (e.g. `https://finance-tracker.onrender.com`).
2. Go back to your **Backend Web Service** dashboard ➡️ **Environment**.
3. Edit the value of `CORS_ORIGIN` to match your frontend static site URL.
4. Save the changes. Render will automatically redeploy the backend server, and the connection is complete!
