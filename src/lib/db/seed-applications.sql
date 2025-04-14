-- Seed data for applications module

-- Make sure role 2 (Manager) exists
INSERT INTO users.roles (id, name, description)
VALUES (2, 'Manager', 'Application manager with final approval privileges')
ON CONFLICT (id) DO NOTHING;

-- Update role descriptions
UPDATE users.roles 
SET description = 'Regular user with basic privileges'
WHERE id = 1;

UPDATE users.roles 
SET description = 'Application reviewer with initial review privileges'
WHERE id = 3;

-- Create test users with different roles
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
  -- Manager (role_id = 2)
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

-- Get user IDs for inserting applications
DO $$
DECLARE
  user1_id INTEGER;
  user2_id INTEGER;
  reviewer1_id INTEGER;
  reviewer2_id INTEGER;
  app1_id INTEGER;
  app2_id INTEGER;
  app3_id INTEGER;
  app4_id INTEGER;
  app5_id INTEGER;
  app6_id INTEGER;
  app7_id INTEGER;
  app8_id INTEGER;
BEGIN
  -- Get user IDs based on email addresses
  SELECT id INTO user1_id FROM users.users WHERE email = 'juanperez@example.com';
  SELECT id INTO user2_id FROM users.users WHERE email = 'mariagarcia@example.com';
  SELECT id INTO reviewer1_id FROM users.users WHERE email = 'reviewer1@example.com';
  SELECT id INTO reviewer2_id FROM users.users WHERE email = 'reviewer2@example.com';
  
  -- Applications for User 1 (Juan)
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
      '{"department": "Civil Engineering", "funding": "University Grant", "duration_months": 12}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app1_id;
  
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
      'Impact of Climate Change on Local Ecosystems',
      'EO',
      'AN',
      2,
      'CEISH-ESPOL-23-02-EO-AN-002',
      '2023-02-03 09:15:00+00',
      '2023-02-10 16:45:00+00',
      'UNDER_REVIEW',
      '{"department": "Environmental Science", "funding": "External Grant", "duration_months": 24}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app2_id;
  
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
      'New Algorithms for Image Recognition',
      'EI',
      'GE',
      3,
      'CEISH-ESPOL-23-03-EI-GE-003',
      '2023-03-12 11:30:00+00',
      NULL,
      'NOT_SUBMITTED',
      '{"department": "Computer Science", "funding": "Corporate Sponsor", "duration_months": 18}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app3_id;
  
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
      'Marine Biodiversity Assessment',
      'EO',
      'AN',
      4,
      'CEISH-ESPOL-23-04-EO-AN-004',
      '2023-04-05 14:20:00+00',
      '2023-04-12 09:30:00+00',
      'REJECTED',
      '{"department": "Marine Biology", "funding": "Government Grant", "duration_months": 36}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app4_id;
  
  -- Applications for User 2 (María)
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
      user2_id,
      'Survey of Mental Health in University Students',
      'EO',
      'SH',
      5,
      'CEISH-ESPOL-23-05-EO-SH-005',
      '2023-05-01 10:45:00+00',
      '2023-05-10 11:15:00+00',
      'SECOND_REVIEW',
      '{"department": "Psychology", "funding": "University Grant", "duration_months": 9}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app5_id;
  
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
      user2_id,
      'Prototype of Low-Cost Prosthetic Limbs',
      'EI',
      'SH',
      6,
      'CEISH-ESPOL-23-06-EI-SH-006',
      '2023-06-15 08:30:00+00',
      '2023-06-20 13:45:00+00',
      'ACCEPTED',
      '{"department": "Biomedical Engineering", "funding": "International NGO", "duration_months": 24}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app6_id;
  
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
      user2_id,
      'Effectiveness of New Teaching Methodologies',
      'EI',
      'SH',
      7,
      'CEISH-ESPOL-23-07-EI-SH-007',
      '2023-07-03 09:00:00+00',
      NULL,
      'NOT_SUBMITTED',
      '{"department": "Education", "funding": "Internal Research Fund", "duration_months": 12}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app7_id;
  
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
      user2_id,
      'Sustainable Urban Planning Model',
      'EO',
      'GE',
      8,
      'CEISH-ESPOL-23-08-EO-GE-008',
      '2023-08-22 15:10:00+00',
      '2023-08-30 10:20:00+00',
      'UNDER_REVIEW',
      '{"department": "Urban Planning", "funding": "Municipal Government", "duration_months": 18}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app8_id;
  
  -- Add application_reviews records for appropriate applications
  IF app2_id IS NOT NULL THEN
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
        app2_id,
        reviewer1_id,
        'UNDER_REVIEW',
        'Initial assessment pending. Need to verify methodology.',
        '2023-02-11 09:00:00+00',
        NULL
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF app5_id IS NOT NULL THEN
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
        app5_id,
        reviewer1_id,
        'UNDER_REVIEW',
        'First review complete. Some ethical concerns need addressing.',
        '2023-05-11 10:00:00+00',
        '2023-05-20 14:30:00+00'
      )
    ON CONFLICT DO NOTHING;
    
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
        app5_id,
        reviewer2_id,
        'UNDER_REVIEW',
        'Additional review required for sensitive population study.',
        '2023-05-21 09:15:00+00',
        NULL
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF app8_id IS NOT NULL THEN
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
        app8_id,
        reviewer2_id,
        'UNDER_REVIEW',
        'Reviewing implementation feasibility and community impact.',
        '2023-08-31 13:45:00+00',
        NULL
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Add status_history records
  -- For application 1
  IF app1_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app1_id,
        'NOT_SUBMITTED',
        'UNDER_REVIEW',
        user1_id,
        '2023-01-20 14:30:00+00',
        'Initial submission'
      )
    ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app1_id,
        'UNDER_REVIEW',
        'ACCEPTED',
        reviewer1_id,
        '2023-02-05 11:20:00+00',
        'All requirements met. Methodology is sound.'
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For application 2
  IF app2_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app2_id,
        'NOT_SUBMITTED',
        'UNDER_REVIEW',
        user1_id,
        '2023-02-10 16:45:00+00',
        'Initial submission'
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For application 4
  IF app4_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app4_id,
        'NOT_SUBMITTED',
        'UNDER_REVIEW',
        user1_id,
        '2023-04-12 09:30:00+00',
        'Initial submission'
      )
    ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app4_id,
        'UNDER_REVIEW',
        'REJECTED',
        reviewer2_id,
        '2023-04-25 14:15:00+00',
        'Insufficient protection measures for endangered species'
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For application 5
  IF app5_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app5_id,
        'NOT_SUBMITTED',
        'UNDER_REVIEW',
        user2_id,
        '2023-05-10 11:15:00+00',
        'Initial submission'
      )
    ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app5_id,
        'UNDER_REVIEW',
        'SECOND_REVIEW',
        reviewer1_id,
        '2023-05-20 14:30:00+00',
        'Need additional review due to sensitive population'
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For application 6
  IF app6_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app6_id,
        'NOT_SUBMITTED',
        'UNDER_REVIEW',
        user2_id,
        '2023-06-20 13:45:00+00',
        'Initial submission'
      )
    ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app6_id,
        'UNDER_REVIEW',
        'ACCEPTED',
        reviewer1_id,
        '2023-07-05 10:30:00+00',
        'Innovative approach with clear benefits'
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- For application 8
  IF app8_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id,
      previous_status,
      new_status,
      changed_by,
      change_date,
      comments
    )
    VALUES
      (
        app8_id,
        'NOT_SUBMITTED',
        'UNDER_REVIEW',
        user2_id,
        '2023-08-30 10:20:00+00',
        'Initial submission'
      )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Successfully added sample application data!';
END $$;
