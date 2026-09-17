# Complete Step-by-Step Supabase Deployment Guide for GrievAI

This guide walks you through deploying the **GrievAI** database, storage buckets, and backend/frontend stack using **Supabase** as the core cloud infrastructure.

---

## 📋 Prerequisites
- A free account on [Supabase](https://supabase.com)
- Optional: Supabase CLI (`npm install -g supabase`)

---

## 🛠️ Step 1: Create a New Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com).
2. Click **"New Project"**.
3. Fill in the details:
   - **Name**: `grievai`
   - **Database Password**: Set a strong password (save this password!)
   - **Region**: Choose a region closest to your users (e.g. `ap-south-1` for South Asia or `us-east-1` for US)
   - **Pricing Plan**: Free Tier
4. Click **"Create new project"** and wait ~1-2 minutes for provisioning.

---

## 🗄️ Step 2: Apply Database Schema Migration (10 Tables + RLS)

1. In your Supabase Project dashboard, click **"SQL Editor"** (icon on the left sidebar).
2. Click **"New query"**.
3. Copy the entire contents of [`supabase/migrations/001_initial_schema.sql`](file:///C:/Users/bobde/.gemini/antigravity-ide/scratch/grievai/supabase/migrations/001_initial_schema.sql) and paste it into the editor.
4. Click **"Run"** (or press `Ctrl + Enter`).
5. You should see `Success. No rows returned`.
6. Verify: Click **"Table Editor"** on the left sidebar to confirm all 10 tables are present:
   - `users`
   - `departments`
   - `officers`
   - `grievances`
   - `grievance_attachments`
   - `grievance_status_history`
   - `resolution_evidence`
   - `duplicate_links`
   - `feedback`
   - `notifications`

---

## 🌱 Step 3: Populate Initial Demo & Department Seed Data

1. In the **SQL Editor**, click **"New query"**.
2. Copy the entire contents of [`supabase/seed.sql`](file:///C:/Users/bobde/.gemini/antigravity-ide/scratch/grievai/supabase/seed.sql) and paste it into the editor.
3. Click **"Run"**.
4. This populates:
   - 8 Municipal Departments (`WATER`, `ROADS`, `ELECTRICITY`, `SANITATION`, `TRAFFIC`, `HEALTH`, `EDUCATION`, `OTHER`)
   - Pre-configured demo accounts (`admin@grievai.gov`, `officer.water@grievai.gov`, `citizen@grievai.gov`, etc.)
   - Sample historical grievances and audit history records across all 4 stages.

---

## 🪣 Step 4: Create Supabase Storage Buckets

1. In the left sidebar, click **"Storage"**.
2. Click **"New bucket"**:
   - **Name**: `grievance-attachments`
   - **Public bucket**: Toggle **ON** (checked)
   - Click **"Save"**.
3. Click **"New bucket"** again:
   - **Name**: `resolution-evidence`
   - **Public bucket**: Toggle **ON** (checked)
   - Click **"Save"**.

### Set Storage Access Policies (Optional/Recommended)
Under **Storage -> Policies**:
- Click **"New policy"** on `grievance-attachments` -> Select **"Allow public read access"** and save.
- Click **"New policy"** on `resolution-evidence` -> Select **"Allow public read access"** and save.

---

## 🔑 Step 5: Obtain API Keys & Database Connection URI

1. Go to **"Project Settings"** (gear icon in left sidebar).
2. Go to **"API"**:
   - Copy **Project URL** (e.g. `https://xyzprojectref.supabase.co`)
   - Copy **anon / public key** (safe for client side)
   - Copy **service_role secret** (keep private, only for backend)
3. Go to **"Database"**:
   - Under **Connection string**, select **URI**.
   - Select **Mode: Session (Port 5432)** or **Transaction (Port 6543)**.
   - The connection string will look like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
     *(Replace `[YOUR-PASSWORD]` with the database password created in Step 1).*

---

## ⚙️ Step 6: Connect FastAPI Backend to Supabase

In `backend/.env` (or in your cloud hosting provider environment settings):

```env
# Supabase PostgreSQL Connection
DATABASE_URL=postgresql://postgres.xyzprojectref:YourPassword123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Supabase Storage & Auth
SUPABASE_URL=https://xyzprojectref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend Security
JWT_SECRET=grievai_super_secure_jwt_secret_key_production_2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,https://your-frontend-app.vercel.app
```

---

## 🚀 Step 7: Deploying the Backend & Frontend

### 1. Deploy FastAPI Backend (Render / Railway)
- **Repo Root**: `backend/`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**: Add the variables from Step 6.

### 2. Deploy React Frontend (Vercel / Netlify)
- **Repo Root**: `frontend/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**:
  ```env
  VITE_API_BASE_URL=https://your-backend-api.onrender.com/api
  ```

---

## 🧪 Step 8: Verification & Health Check

1. Open `https://your-backend-api.onrender.com/docs` to test live endpoints on Supabase.
2. Log in using `admin@grievai.gov` / `Admin@123`.
3. Submit a new grievance on the frontend: verify that the new row immediately appears in your **Supabase Table Editor (`grievances`)** with AI tags and priority scores!
