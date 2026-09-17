-- =====================================================================
-- GrievAI: AI-Powered Public Grievance Analysis & Resolution Platform
-- Seed Data: seed.sql (Valid Hexadecimal UUIDs: [0-9a-f])
-- =====================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (id, name, code, description, contact_email, contact_phone) VALUES
('d1111111-1111-1111-1111-111111111111', 'Water Supply & Sewerage', 'WATER', 'Municipal water distribution, pipeline maintenance, leaks, and drainage management.', 'water.dept@grievai.gov', '+1-800-555-0101'),
('d2222222-2222-2222-2222-222222222222', 'Roads & Public Works', 'ROADS', 'Road construction, pothole repairs, bridges, footpaths, and storm drains.', 'roads.pwd@grievai.gov', '+1-800-555-0102'),
('d3333333-3333-3333-3333-333333333333', 'Electricity & Public Lighting', 'ELECTRICITY', 'Power grid maintenance, street lighting, faulty transformers, and dangling cables.', 'electricity.dept@grievai.gov', '+1-800-555-0103'),
('d4444444-4444-4444-4444-444444444444', 'Sanitation & Solid Waste Management', 'SANITATION', 'Garbage collection, public bins, street sweeping, and dumping cleanup.', 'sanitation.dept@grievai.gov', '+1-800-555-0104'),
('d5555555-5555-5555-5555-555555555555', 'Traffic & Transport Authority', 'TRAFFIC', 'Traffic signal repairs, road markings, public transit issues, and congestion.', 'traffic.dept@grievai.gov', '+1-800-555-0105'),
('d6666666-6666-6666-6666-666666666666', 'Public Health & Sanitation', 'HEALTH', 'Public health clinics, mosquito fogging, disease vector control, and food safety.', 'health.dept@grievai.gov', '+1-800-555-0106'),
('d7777777-7777-7777-7777-777777777777', 'Education & Public Schools', 'EDUCATION', 'Civic school infrastructure, amenities, cleanliness, and public playground upkeep.', 'education.dept@grievai.gov', '+1-800-555-0107'),
('d8888888-8888-8888-8888-888888888888', 'General Civic Administration', 'OTHER', 'General civic issues, public parks, noise pollution, and unclassified grievances.', 'civic.admin@grievai.gov', '+1-800-555-0108')
ON CONFLICT (id) DO NOTHING;

-- 2. USERS (Pass: Admin@123, Officer@123, Citizen@123)
INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
('a1111111-1111-1111-1111-111111111111', 'Chief Admin Officer', 'admin@grievai.gov', '$2b$12$m72O1B2X6cW5vV4e4.Q28OU4r3q0Q9kO6xNl2M7KjQ3F0E8Q7G9u2', 'admin', '+1-800-555-ADMIN'),
('a2222222-2222-2222-2222-222222222222', 'Robert Jenkins (Water Officer)', 'officer.water@grievai.gov', '$2b$12$m72O1B2X6cW5vV4e4.Q28OU4r3q0Q9kO6xNl2M7KjQ3F0E8Q7G9u2', 'officer', '+1-800-555-0201'),
('a3333333-3333-3333-3333-333333333333', 'Sarah Lin (Roads Officer)', 'officer.roads@grievai.gov', '$2b$12$m72O1B2X6cW5vV4e4.Q28OU4r3q0Q9kO6xNl2M7KjQ3F0E8Q7G9u2', 'officer', '+1-800-555-0202'),
('a4444444-4444-4444-4444-444444444444', 'David Kim (Electricity Officer)', 'officer.electricity@grievai.gov', '$2b$12$m72O1B2X6cW5vV4e4.Q28OU4r3q0Q9kO6xNl2M7KjQ3F0E8Q7G9u2', 'officer', '+1-800-555-0203'),
('a5555555-5555-5555-5555-555555555555', 'Elena Gomez (Sanitation Officer)', 'officer.sanitation@grievai.gov', '$2b$12$m72O1B2X6cW5vV4e4.Q28OU4r3q0Q9kO6xNl2M7KjQ3F0E8Q7G9u2', 'officer', '+1-800-555-0204'),
('a6666666-6666-6666-6666-666666666666', 'John Doe (Citizen)', 'citizen@grievai.gov', '$2b$12$m72O1B2X6cW5vV4e4.Q28OU4r3q0Q9kO6xNl2M7KjQ3F0E8Q7G9u2', 'citizen', '+1-800-555-CITIZ')
ON CONFLICT (id) DO NOTHING;

-- 3. OFFICERS
INSERT INTO officers (id, user_id, department_id, badge_number, designation, is_available) VALUES
('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'WTR-409', 'Senior Hydraulic Engineer', true),
('b2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', 'PWD-812', 'Public Works Inspector', true),
('b3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'ELE-305', 'Grid Maintenance Supervisor', true),
('b4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 'd4444444-4444-4444-4444-444444444444', 'SNT-650', 'Sanitation Zone Lead', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SAMPLE GRIEVANCES
INSERT INTO grievances (
    id, citizen_id, title, description, category, ai_category, priority, ai_priority, priority_reason,
    sentiment, sentiment_score, department_id, ai_department_id, assigned_officer_id,
    ai_summary, ai_recommendation, ai_confidence, ai_keywords, status, latitude, longitude, address, is_duplicate, created_at
) VALUES
-- Grievance 1: Submitted (Water)
(
    'c1111111-1111-1111-1111-111111111111',
    'a6666666-6666-6666-6666-666666666666',
    'Main water supply pipeline leaking heavily near civic center',
    'A main underground water pipe has burst and high pressure water is flooding the street for over 18 hours. Traffic is slowed and water is wasted.',
    'Water Supply', 'Water Supply', 'High', 'High', 'Urgent water loss, street flooding, active hazard',
    'Negative', -0.65, 'd1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', NULL,
    'Main pipeline burst flooding street for over 18 hours.',
    'Dispatch emergency pipe repair crew to isolate valve and repair fractured section.',
    0.94, '["pipe", "burst", "flooding", "water wasted", "high pressure"]'::jsonb,
    'Submitted', 28.6139, 77.2090, 'Sector 4, Central Avenue, Near Metro Gate 2', false,
    NOW() - INTERVAL '2 hours'
),
-- Grievance 2: Assigned (Roads)
(
    'c2222222-2222-2222-2222-222222222222',
    'a6666666-6666-6666-6666-666666666666',
    'Dangerous deep pothole causing two-wheeler accidents',
    'Deep crater-like pothole right after the curve on Grand Trunk Road. Two motorcyclists skidded yesterday evening. Needs urgent asphalt patching.',
    'Roads/Potholes', 'Roads/Potholes', 'High', 'High', 'Safety risk, multiple accidents reported',
    'Negative', -0.78, 'd2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222',
    'Hazardous deep pothole causing vehicle skids on curve.',
    'Inspect road section, deploy barricade immediately, and apply cold-mix asphalt patch.',
    0.92, '["pothole", "accidents", "two-wheeler", "crater", "danger"]'::jsonb,
    'Assigned', 28.6250, 77.2150, 'Grand Trunk Road, Pillar No. 142', false,
    NOW() - INTERVAL '1 day'
),
-- Grievance 3: In Progress (Electricity)
(
    'c3333333-3333-3333-3333-333333333333',
    'a6666666-6666-6666-6666-666666666666',
    'Streetlights non-functional on 5th Cross Road for 2 weeks',
    'All five sodium street lamps on 5th cross are out. The street is pitch dark and unsafe for pedestrians and women walking back from the station at night.',
    'Electricity/Street Lights', 'Electricity/Street Lights', 'Medium', 'Medium', 'Public safety concern, prolonged duration (2 weeks)',
    'Negative', -0.45, 'd3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333',
    'Streetlights completely out for 2 weeks causing dark unsafe lane.',
    'Check feeder pillar circuit breaker, replace burnt LED bulbs, test automatic timer.',
    0.96, '["streetlights", "dark", "lamps", "unsafe", "power"]'::jsonb,
    'In Progress', 28.6320, 77.2200, '5th Cross Road, Green Park Colony', false,
    NOW() - INTERVAL '3 days'
),
-- Grievance 4: Resolved (Sanitation)
(
    'c4444444-4444-4444-4444-444444444444',
    'a6666666-6666-6666-6666-666666666666',
    'Overflowing community garbage dump near primary school',
    'Commercial waste and plastic have piled up outside the bin for 4 days creating foul smell and stray dog menace right beside the primary school gate.',
    'Sanitation/Waste', 'Sanitation/Waste', 'High', 'High', 'Health hazard near primary school, foul smell',
    'Negative', -0.72, 'd4444444-4444-4444-4444-444444444444', 'd4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444',
    'Overflowing waste dump creating sanitary hazard beside school.',
    'Dispatch compacting compactor truck, clean peripheral ground, spray disinfectant.',
    0.98, '["garbage", "overflowing", "school", "foul smell", "waste"]'::jsonb,
    'Resolved', 28.6080, 77.2020, 'Opposite City Primary School, Ward 12', false,
    NOW() - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- 5. STATUS HISTORY
INSERT INTO grievance_status_history (id, grievance_id, previous_status, new_status, changed_by, remarks, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', NULL, 'Submitted', 'a6666666-6666-6666-6666-666666666666', 'Grievance submitted via web portal with AI auto-triage.', NOW() - INTERVAL '2 hours'),
('e2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', NULL, 'Submitted', 'a6666666-6666-6666-6666-666666666666', 'Grievance submitted.', NOW() - INTERVAL '1 day'),
('e2222222-2222-2222-2222-222222222223', 'c2222222-2222-2222-2222-222222222222', 'Submitted', 'Assigned', 'a1111111-1111-1111-1111-111111111111', 'Assigned to Public Works Department officer Sarah Lin.', NOW() - INTERVAL '20 hours'),
('e3333333-3333-3333-3333-333333333331', 'c3333333-3333-3333-3333-333333333333', NULL, 'Submitted', 'a6666666-6666-6666-6666-666666666666', 'Grievance submitted.', NOW() - INTERVAL '3 days'),
('e3333333-3333-3333-3333-333333333332', 'c3333333-3333-3333-3333-333333333333', 'Submitted', 'Assigned', 'a1111111-1111-1111-1111-111111111111', 'Assigned to Electricity Officer David Kim.', NOW() - INTERVAL '2 days'),
('e3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Assigned', 'In Progress', 'a4444444-4444-4444-4444-444444444444', 'Field inspection conducted; replacement bulbs dispatched.', NOW() - INTERVAL '1 day'),
('e4444444-4444-4444-4444-444444444441', 'c4444444-4444-4444-4444-444444444444', NULL, 'Submitted', 'a6666666-6666-6666-6666-666666666666', 'Grievance submitted.', NOW() - INTERVAL '5 days'),
('e4444444-4444-4444-4444-444444444442', 'c4444444-4444-4444-4444-444444444444', 'Submitted', 'Assigned', 'a1111111-1111-1111-1111-111111111111', 'Assigned to Sanitation Officer Elena Gomez.', NOW() - INTERVAL '4 days'),
('e4444444-4444-4444-4444-444444444443', 'c4444444-4444-4444-4444-444444444444', 'Assigned', 'In Progress', 'a5555555-5555-5555-5555-555555555555', 'Waste truck en-route to clear site.', NOW() - INTERVAL '3 days'),
('e4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'In Progress', 'Resolved', 'a5555555-5555-5555-5555-555555555555', 'Site cleared completely, 2 tons removed, lime powder disinfectant spread.', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 6. RESOLUTION EVIDENCE
INSERT INTO resolution_evidence (id, grievance_id, officer_id, file_url, file_name, remarks, created_at) VALUES
(
    'e4444444-4444-4444-4444-444444444444',
    'c4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555',
    '/uploads/evidence/school_sanitation_resolved.jpg',
    'school_sanitation_resolved.jpg',
    'All accumulated solid waste lifted via hydraulic compactor truck. Performed chemical disinfection around school perimeter.',
    NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- 7. FEEDBACK
INSERT INTO feedback (id, grievance_id, citizen_id, rating, comment, created_at) VALUES
(
    'f4444444-4444-4444-4444-444444444444',
    'c4444444-4444-4444-4444-444444444444',
    'a6666666-6666-6666-6666-666666666666',
    5,
    'Fast response! The area was cleared within 24 hours of assigning. Very grateful.',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 8. NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, link, is_read, created_at) VALUES
('f1111111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666', 'Grievance Submitted', 'Your grievance "Main water supply pipeline leaking heavily" was successfully submitted (Status: Submitted).', '/citizen/grievances/c1111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '2 hours'),
('f2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', 'Grievance Assigned', 'Your grievance regarding pothole on Grand Trunk Road has been assigned to Public Works.', '/citizen/grievances/c2222222-2222-2222-2222-222222222222', false, NOW() - INTERVAL '20 hours'),
('f3333333-3333-3333-3333-333333333333', 'a6666666-6666-6666-6666-666666666666', 'Grievance Resolved!', 'Your complaint regarding waste near primary school has been marked Resolved. Please leave feedback.', '/citizen/grievances/c4444444-4444-4444-4444-444444444444', true, NOW() - INTERVAL '2 days'),
('f4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'New Grievance in Queue', 'High priority water pipeline leak submitted in Sector 4.', '/officer/dashboard', false, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;
