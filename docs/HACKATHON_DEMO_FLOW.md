# GrievAI: Hackathon Live Demo Sequence & Evaluation Script

This document outlines the step-by-step presentation flow for demonstrating **GrievAI** to judges and evaluators during the hackathon.

---

## 🚀 Pre-Demo Quick Setup (30 Seconds)

1. **Start Backend**:
   ```bash
   cd backend
   .\.venv\Scripts\uvicorn app.main:app --port 8000 --reload
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open browser at `http://localhost:5173`.

---

## 📋 8-Step Complete Hackathon Demo Sequence

### Step 1: Citizen Submission with Live AI Auto-Triage & Map Pin
1. Open the landing page (`http://localhost:5173`).
2. Click **Demo Switcher** in the top navigation bar and select **Citizen (John Doe)**.
3. Click **Report Issue** or navigate to `/citizen/submit`.
4. Enter:
   - **Title**: `Severe water pipeline rupture in Ward 4`
   - **Description**: `There has been no water supply in our area for three days and elderly people are facing problems. Water is leaking rapidly and flooding the street.`
5. **Highlight Live AI Explainability Preview**:
   - As you type, the right-hand panel automatically infers:
     - **Category**: `Water Supply` (94% confidence)
     - **Priority**: `High` (Trigger reason: prolonged disruption 'three days' + safety hazard keywords 'rupture, flooding')
     - **Sentiment**: `Negative` (Tone of distress)
     - **Recommended Department**: `Water Supply & Sewerage`
     - **1-Line Summary**: Extracted concise problem statement.
     - **Resolution SOP Action**: Standard municipal repair protocol.
6. Click anywhere on the **Interactive Leaflet Map** to position the pin (or click **My Location** to auto-detect GPS).
7. Click **Submit Grievance**. Notice immediate transition to the full **4-Stage Tracking Timeline**.

---

### Step 2: Switch to Admin Dashboard & Review Live Triage
1. Click **Demo Switcher** -> **Admin (Chief Officer)**.
2. The browser navigates to the **Admin Executive Dashboard** (`/admin/dashboard`):
   - Review live **KPI metric cards** (Total Complaints, Pending Triage, In Progress, Resolved).
   - Point out **Recharts visualizations**: Category Distribution Donut, 14-Day Submission vs Resolution Area Trends, and the **Geographic Incident Hotspots GPS Map**.
3. Under **Incoming Grievances Pending Review**, click **Review & Assign** on the newly submitted water complaint.

---

### Step 3: Human-in-the-Loop Review & Officer Assignment
1. On the grievance review page (`/admin/grievances/:id`):
   - Emphasize the **Explainable AI Card** (judges love explainable AI that doesn't operate as a black box).
   - Demonstrate the **Human-in-the-Loop Override** option (Admin can override predicted category or priority).
   - In the **Assign Department & Officer** box:
     - Department is pre-matched to **Water Supply & Sewerage**.
     - Select **Robert Jenkins (Water Officer)**.
     - Add directive remark: *"Emergency repair crew dispatched for valve inspection."*
     - Click **Save Assignment**.
   - Notice the status immediately progresses to **"Assigned"** and updates the timeline audit trail.

---

### Step 4: Officer Portal & Field Resolution Execution
1. Click **Demo Switcher** -> **Water Officer (Robert)**.
2. The browser navigates to the **Field Officer Portal** (`/officer/dashboard`):
   - Notice grievances are automatically sorted with **High Priority** tasks on top.
   - Click **Action Task** on the assigned water grievance.
3. On the task details page (`/officer/grievances/:id`):
   - Click **Set Status "In Progress"** (simulating squad arriving at site).
   - Enter resolution remarks: *"Replaced 4-inch fractured pipeline section with heavy-duty ductile iron sleeve. Mainline pressure restored to 3.5 bar."*
   - Attach photo proof or click **Mark as Resolved with Evidence**.
   - Status instantly transitions to **"Resolved"** and an in-app notification is dispatched to the citizen.

---

### Step 5: Citizen Notification & 5-Star Feedback Verification
1. Click **Demo Switcher** -> **Citizen (John Doe)**.
2. Check the **Notification Bell**:
   - Notice the alert: *"Grievance Resolved - Feedback Requested"*.
3. Click the notification or open the grievance:
   - Notice the **4-Stage Tracking Timeline** is now 100% completed.
   - Citizen can view the verified **Officer Resolution Remarks & Evidence Proof**.
   - Citizen selects **5 Stars**, enters comment: *"High pressure water is back! Amazing turnaround time."*, and clicks **Submit Rating**.

---

### Step 6: Live Analytics Reflection
1. Switch back to **Admin Dashboard**.
2. Notice the **Resolved Complaints Counter** has dynamically incremented and the **Average Resolution Hours** has recalculated from real database timestamps.
3. Navigate to **Export Reports** (`/admin/reports`) and click **Download CSV Report** to demonstrate verified export of real database records.

---

### Step 7: Duplicate Grievance AI Detection
1. Switch to **Citizen** and submit a second complaint:
   - **Title**: `No drinking water supply in Ward 4`
   - **Description**: `Water has been cut off for 3 days in Ward 4.`
   - Select nearby GPS coordinates.
2. Notice the amber **Duplicate AI Warning** banner appears informing the citizen that a similar grievance exists in this area.
3. Switch to **Admin** -> **Duplicate AI Manager** (`/admin/duplicates`):
   - Show side-by-side complaint comparison with **Cosine Similarity %** (e.g. 78% Match) and **Geographic Proximity** (~15m Away).
   - Demonstrate the **Link & Consolidate** button to prevent duplicate municipal dispatch.

---

### Step 8: Closing Impact Statement
- **Faster Triage**: Reduced manual routing time from hours to seconds.
- **Explainable & Safe**: Human-in-the-loop ensures administrative control with explainable rationale.
- **Transparency**: End-to-end accountability with photographic evidence and citizen rating loops.
