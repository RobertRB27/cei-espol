-- Seed data for testing the applications system

-- Create roles if they don't exist already
INSERT INTO users.roles (id, name, description) 
VALUES 
  (1, 'User', 'Regular user with basic privileges'),
  (2, 'Manager', 'Application manager with final approval privileges'),
  (3, 'Reviewer', 'Application reviewer with initial review privileges')
ON CONFLICT (id) DO NOTHING;

-- Create test users (bcrypt hashed password = 'Password123')
INSERT INTO users.users (
  first_name, 
  second_name, 
  first_surname, 
  second_surname, 
  email, 
  password, 
  role_id
)
VALUES 
  -- Regular users (role_id = 1)
  (
    'Juan', 
    'Carlos', 
    'Pérez', 
    'Gómez', 
    'juanperez@example.com', 
    '$2b$10$hACwQLTAAIX7BxLyGZvsXuJ3NAE/Q1QsCOLd1jT.YAOX4mxXfI.C2', -- Password123
    1
  ),
  (
    'María', 
    'Luisa', 
    'García', 
    'López', 
    'mariagarcia@example.com', 
    '$2b$10$hACwQLTAAIX7BxLyGZvsXuJ3NAE/Q1QsCOLd1jT.YAOX4mxXfI.C2', -- Password123
    1
  ),
  -- Managers (role_id = 2)
  (
    'Carlos', 
    'Eduardo', 
    'Morales', 
    'Figueroa', 
    'manager@example.com', 
    '$2b$10$hACwQLTAAIX7BxLyGZvsXuJ3NAE/Q1QsCOLd1jT.YAOX4mxXfI.C2', -- Password123
    2
  ),
  -- Reviewers (role_id = 3)
  (
    'Roberto', 
    'Alejandro', 
    'Martínez', 
    'Sánchez', 
    'reviewer1@example.com', 
    '$2b$10$hACwQLTAAIX7BxLyGZvsXuJ3NAE/Q1QsCOLd1jT.YAOX4mxXfI.C2', -- Password123
    3
  ),
  (
    'Ana', 
    'María', 
    'Rodríguez', 
    'Vega', 
    'reviewer2@example.com', 
    '$2b$10$hACwQLTAAIX7BxLyGZvsXuJ3NAE/Q1QsCOLd1jT.YAOX4mxXfI.C2', -- Password123
    3
  )
ON CONFLICT (email) DO NOTHING;

-- Store the user IDs in variables for later use
DO $$
DECLARE
  user1_id INTEGER;
  user2_id INTEGER;
  reviewer1_id INTEGER;
  reviewer2_id INTEGER;
  manager_id INTEGER;
BEGIN
  -- Get user IDs based on email addresses
  SELECT id INTO user1_id FROM users.users WHERE email = 'juanperez@example.com';
  SELECT id INTO user2_id FROM users.users WHERE email = 'mariagarcia@example.com';
  SELECT id INTO reviewer1_id FROM users.users WHERE email = 'reviewer1@example.com';
  SELECT id INTO reviewer2_id FROM users.users WHERE email = 'reviewer2@example.com';
  SELECT id INTO manager_id FROM users.users WHERE email = 'manager@example.com';

-- Function to get the last day of the specified month
CREATE OR REPLACE FUNCTION get_last_day_of_month(month INT, year INT) RETURNS DATE AS $$
BEGIN
  RETURN (DATE_TRUNC('MONTH', MAKE_DATE(year, month, 1)) + INTERVAL '1 MONTH - 1 day')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample applications for Juan (Regular user 1)
INSERT INTO applications.applications (
  user_id,
  project_title,
  investigation_type,
  category_type,
  sequential_number,
  codification,
  date_created,
  date_submitted,
  status,
  metadata
)
VALUES
  (
    user1_id,
    'Study of Water Quality in Guayas River',
    'EO',
    'GE',
    1,
    'CEISH-ESPOL-23-01-EO-GE-001',
    '2023-01-15 10:00:00+00',
    '2023-01-20 14:30:00+00',
    'ACCEPTED',
    '{"department": "Civil Engineering", "funding": "University Grant", "duration_months": 12}'
  ),
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    'Impact of Climate Change on Local Ecosystems',
    'EO',
    'AN',
    2,
    'CEISH-ESPOL-23-02-EO-AN-002',
    '2023-02-03 09:15:00+00',
    '2023-02-10 16:45:00+00',
    'UNDER_REVIEW',
    '{"department": "Environmental Science", "funding": "External Grant", "duration_months": 24}'
  ),
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    'New Algorithms for Image Recognition',
    'EI',
    'GE',
    3,
    'CEISH-ESPOL-23-03-EI-GE-003',
    '2023-03-12 11:30:00+00',
    NULL,
    'NOT_SUBMITTED',
    '{"department": "Computer Science", "funding": "Corporate Sponsor", "duration_months": 18}'
  ),
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    'Marine Biodiversity Assessment',
    'EO',
    'AN',
    4,
    'CEISH-ESPOL-23-04-EO-AN-004',
    '2023-04-05 14:20:00+00',
    '2023-04-12 09:30:00+00',
    'REJECTED',
    '{"department": "Marine Biology", "funding": "Government Grant", "duration_months": 36}'
  );

-- Insert sample applications for María (Regular user 2)
INSERT INTO applications.applications (
  user_id,
  project_title,
  investigation_type,
  category_type,
  sequential_number,
  codification,
  date_created,
  date_submitted,
  status,
  metadata
)
VALUES
  (
    'bbbbbbbb-2222-2222-2222-222222222222',
    'Survey of Mental Health in University Students',
    'EO',
    'SH',
    5,
    'CEISH-ESPOL-23-05-EO-SH-005',
    '2023-05-01 10:45:00+00',
    '2023-05-10 11:15:00+00',
    'SECOND_REVIEW',
    '{"department": "Psychology", "funding": "University Grant", "duration_months": 9}'
  ),
  (
    'bbbbbbbb-2222-2222-2222-222222222222',
    'Prototype of Low-Cost Prosthetic Limbs',
    'EI',
    'SH',
    6,
    'CEISH-ESPOL-23-06-EI-SH-006',
    '2023-06-15 08:30:00+00',
    '2023-06-20 13:45:00+00',
    'ACCEPTED',
    '{"department": "Biomedical Engineering", "funding": "International NGO", "duration_months": 24}'
  ),
  (
    'bbbbbbbb-2222-2222-2222-222222222222',
    'Effectiveness of New Teaching Methodologies',
    'EI',
    'SH',
    7,
    'CEISH-ESPOL-23-07-EI-SH-007',
    '2023-07-03 09:00:00+00',
    NULL,
    'NOT_SUBMITTED',
    '{"department": "Education", "funding": "Internal Research Fund", "duration_months": 12}'
  ),
  (
    'bbbbbbbb-2222-2222-2222-222222222222',
    'Sustainable Urban Planning Model',
    'EO',
    'GE',
    8,
    'CEISH-ESPOL-23-08-EO-GE-008',
    '2023-08-22 15:10:00+00',
    '2023-08-30 10:20:00+00',
    'UNDER_REVIEW',
    '{"department": "Urban Planning", "funding": "Municipal Government", "duration_months": 18}'
  );

-- Insert application reviews
INSERT INTO applications.reviews (
  application_id,
  reviewer_id,
  status,
  comments,
  date_assigned,
  date_reviewed
)
VALUES
  (
    2, -- Juan's Climate Change application (UNDER_REVIEW)
    reviewer1_id, -- Roberto (Reviewer)
    'UNDER_REVIEW',
    'Initial assessment pending. Need to verify methodology.',
    '2023-02-11 09:00:00+00',
    NULL
  ),
  (
    5, -- María's Mental Health Survey (SECOND_REVIEW)
    reviewer1_id, -- Roberto (Reviewer)
    'UNDER_REVIEW',
    'First review complete. Some ethical concerns need addressing.',
    '2023-05-11 10:00:00+00',
    '2023-05-20 14:30:00+00'
  ),
  (
    5, -- María's Mental Health Survey (SECOND_REVIEW - second reviewer)
    reviewer2_id, -- Ana (Reviewer)
    'UNDER_REVIEW',
    'Additional review required for sensitive population study.',
    '2023-05-21 09:15:00+00',
    NULL
  ),
  (
    8, -- María's Urban Planning application (UNDER_REVIEW)
    reviewer2_id, -- Ana (Reviewer)
    'UNDER_REVIEW',
    'Reviewing implementation feasibility and community impact.',
    '2023-08-31 13:45:00+00',
    NULL
  );

-- Insert status history
INSERT INTO applications.status_history (
  application_id,
  previous_status,
  new_status,
  changed_by,
  change_date,
  comments
)
VALUES
  -- History for Juan's applications
  (
    1, -- Water Quality study
    'NOT_SUBMITTED',
    'UNDER_REVIEW',
    user1_id, -- Juan (self-submitted)
    '2023-01-20 14:30:00+00',
    'Initial submission'
  ),
  (
    1, -- Water Quality study
    'UNDER_REVIEW',
    'ACCEPTED',
    reviewer1_id, -- Roberto (Reviewer)
    '2023-02-05 11:20:00+00',
    'All requirements met. Methodology is sound.'
  ),
  (
    2, -- Climate Change study
    'NOT_SUBMITTED',
    'UNDER_REVIEW',
    user1_id, -- Juan (self-submitted)
    '2023-02-10 16:45:00+00',
    'Initial submission'
  ),
  (
    4, -- Marine Biodiversity
    'NOT_SUBMITTED',
    'UNDER_REVIEW',
    user1_id, -- Juan (self-submitted)
    '2023-04-12 09:30:00+00',
    'Initial submission'
  ),
  (
    4, -- Marine Biodiversity
    'UNDER_REVIEW',
    'REJECTED',
    reviewer2_id, -- Ana (Reviewer)
    '2023-04-25 14:15:00+00',
    'Insufficient protection measures for endangered species'
  ),
  
  -- History for María's applications
  (
    5, -- Mental Health Survey
    'NOT_SUBMITTED',
    'UNDER_REVIEW',
    user2_id, -- María (self-submitted)
    '2023-05-10 11:15:00+00',
    'Initial submission'
  ),
  (
    5, -- Mental Health Survey
    'UNDER_REVIEW',
    'SECOND_REVIEW',
    reviewer1_id, -- Roberto (Reviewer)
    '2023-05-20 14:30:00+00',
    'Need additional review due to sensitive population'
  ),
  (
    6, -- Prosthetic Limbs
    'NOT_SUBMITTED',
    'UNDER_REVIEW',
    user2_id, -- María (self-submitted)
    '2023-06-20 13:45:00+00',
    'Initial submission'
  ),
  (
    6, -- Prosthetic Limbs
    'UNDER_REVIEW',
    'ACCEPTED',
    reviewer1_id, -- Roberto (Reviewer)
    '2023-07-05 10:30:00+00',
    'Innovative approach with clear benefits'
  ),
  (
    8, -- Urban Planning
    'NOT_SUBMITTED',
    'UNDER_REVIEW',
    user2_id, -- María (self-submitted)
    '2023-08-30 10:20:00+00',
    'Initial submission'
  );
END $$;
