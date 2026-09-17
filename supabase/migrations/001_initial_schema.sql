-- =====================================================================
-- GrievAI: AI-Powered Public Grievance Analysis & Resolution Platform
-- Migration: 001_initial_schema.sql
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if exists in reverse dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS duplicate_links CASCADE;
DROP TABLE IF EXISTS resolution_evidence CASCADE;
DROP TABLE IF EXISTS grievance_status_history CASCADE;
DROP TABLE IF EXISTS grievance_attachments CASCADE;
DROP TABLE IF EXISTS grievances CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS / PROFILES TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('citizen', 'admin', 'officer')),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_code ON departments(code);

-- 3. OFFICERS TABLE
CREATE TABLE officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    badge_number VARCHAR(100) UNIQUE,
    designation VARCHAR(255) DEFAULT 'Field Resolution Officer',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_officers_user_id ON officers(user_id);
CREATE INDEX idx_officers_dept_id ON officers(department_id);

-- 4. GRIEVANCES TABLE
CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Category (Human approved / final) and AI predicted
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    ai_category VARCHAR(100),
    
    -- Priority (Human approved / final) and AI predicted
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    ai_priority VARCHAR(50) CHECK (ai_priority IN ('Low', 'Medium', 'High')),
    priority_reason TEXT,
    
    -- Sentiment Analysis
    sentiment VARCHAR(50) DEFAULT 'Neutral' CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
    sentiment_score FLOAT DEFAULT 0.0,
    
    -- Department Assignment
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    ai_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,
    
    -- AI Generated Insights & Explainability
    ai_summary TEXT,
    ai_recommendation TEXT,
    ai_confidence FLOAT DEFAULT 0.0,
    ai_keywords JSONB DEFAULT '[]'::jsonb,
    
    -- Status Workflow
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Assigned', 'In Progress', 'Resolved', 'Rejected')),
    
    -- Location Information
    latitude FLOAT,
    longitude FLOAT,
    address TEXT,
    
    -- Duplicate Flagging
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_id UUID REFERENCES grievances(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grievances_citizen_id ON grievances(citizen_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_category ON grievances(category);
CREATE INDEX idx_grievances_priority ON grievances(priority);
CREATE INDEX idx_grievances_department_id ON grievances(department_id);
CREATE INDEX idx_grievances_officer_id ON grievances(assigned_officer_id);
CREATE INDEX idx_grievances_created_at ON grievances(created_at DESC);

-- 5. GRIEVANCE ATTACHMENTS TABLE
CREATE TABLE grievance_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_grievance_id ON grievance_attachments(grievance_id);

-- 6. GRIEVANCE STATUS HISTORY (AUDIT TRAIL)
CREATE TABLE grievance_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_grievance_id ON grievance_status_history(grievance_id);

-- 7. RESOLUTION EVIDENCE TABLE
CREATE TABLE resolution_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    remarks TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resolution_evidence_grievance_id ON resolution_evidence(grievance_id);

-- 8. DUPLICATE LINKS TABLE
CREATE TABLE duplicate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    duplicate_of_grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    distance_meters FLOAT,
    status VARCHAR(50) DEFAULT 'flagged' CHECK (status IN ('flagged', 'merged', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_duplicate_links_grievance_id ON duplicate_links(grievance_id);
CREATE INDEX idx_duplicate_links_parent_id ON duplicate_links(duplicate_of_grievance_id);

-- 9. FEEDBACK TABLE
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL UNIQUE REFERENCES grievances(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_grievance_id ON feedback(grievance_id);
CREATE INDEX idx_feedback_citizen_id ON feedback(citizen_id);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read of departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
