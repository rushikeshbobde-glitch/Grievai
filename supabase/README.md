# GrievAI: Supabase Database Setup & Schema Guide

This directory contains the database schema migrations, seed data, and instructions to connect GrievAI to Supabase or any standard PostgreSQL instance.

---

## 1. Quick Setup via Supabase Web Dashboard

1. Log into [Supabase Dashboard](https://app.supabase.com) and create a new project named `grievai`.
2. Navigate to **SQL Editor** in the left sidebar.
3. Open `supabase/migrations/001_initial_schema.sql`, copy all contents, and click **Run**.
4. Open `supabase/seed.sql`, copy all contents, and click **Run**.
5. Navigate to **Storage**:
   - Create a public bucket: `grievance-attachments`
   - Create a public bucket: `resolution-evidence`
6. Navigate to **Project Settings -> API** to retrieve:
   - Project URL (`SUPABASE_URL`)
   - anon / public key (`SUPABASE_ANON_KEY`)
   - service_role secret (`SUPABASE_SERVICE_ROLE_KEY`)
   - Connection string URI (`DATABASE_URL`)

---

## 2. Quick Setup via Supabase CLI

```bash
# Login to Supabase CLI
supabase login

# Link your remote project
supabase link --project-ref <your-project-id>

# Push migration
supabase db push

# Apply seed data
supabase db reset
```

---

## 3. Local Development Fallback Engine

GrievAI is built with zero-lock-in architecture. If running offline or without active Supabase credentials, the backend automatically utilizes an embedded SQLite / PostgreSQL engine with the identical schema and seed accounts, enabling full end-to-end development without interruptions.

---

## 4. Pre-Seeded Demo Accounts

| Role | Email | Password | Scope |
|---|---|---|---|
| **Admin** | `admin@grievai.gov` | `Admin@123` | Master triage, analytics, assignments, overrides |
| **Officer (Water)** | `officer.water@grievai.gov` | `Officer@123` | Water supply grievance resolution & evidence |
| **Officer (Roads)** | `officer.roads@grievai.gov` | `Officer@123` | Pothole & road repair tasks |
| **Officer (Electricity)** | `officer.electricity@grievai.gov` | `Officer@123` | Streetlights & power line tasks |
| **Officer (Sanitation)** | `officer.sanitation@grievai.gov` | `Officer@123` | Solid waste management & cleanup |
| **Citizen** | `citizen@grievai.gov` | `Citizen@123` | Citizen grievance submission, tracking & feedback |
