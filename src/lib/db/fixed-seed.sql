-- Fixed seed data for CEI-ESPOL database

-- First check if the tables already exist to avoid errors
DO $$
BEGIN
  -- Only run if the applications schema exists but applications table doesn't
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'applications') AND 
     NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'applications' AND tablename = 'applications') THEN
    
    -- Create applications table with proper references to users
    CREATE TABLE applications.applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
      project_title VARCHAR(255) NOT NULL,
      investigation_type VARCHAR(2) NOT NULL CHECK (investigation_type IN ('EO', 'EI')),
      category_type VARCHAR(2) NOT NULL CHECK (category_type IN ('GE', 'SH', 'AN')),
      sequential_number INT NOT NULL,
      codification VARCHAR(50) NOT NULL UNIQUE,
      date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      date_submitted TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) NOT NULL CHECK (status IN (
        'NOT_SUBMITTED', 
        'UNDER_REVIEW', 
        'SECOND_REVIEW', 
        'ACCEPTED', 
        'REJECTED', 
        'DELETED',
        'NOT_COMPLETED'
      )) DEFAULT 'NOT_SUBMITTED',
      metadata JSONB
    );

    -- Create status_history table
    CREATE TABLE applications.status_history (
      id SERIAL PRIMARY KEY,
      application_id INT NOT NULL REFERENCES applications.applications(id) ON DELETE CASCADE,
      previous_status VARCHAR(20) NOT NULL,
      new_status VARCHAR(20) NOT NULL,
      changed_by INTEGER NOT NULL REFERENCES users.users(id),
      change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      comments TEXT
    );

    -- Create reviews table
    CREATE TABLE applications.reviews (
      id SERIAL PRIMARY KEY,
      application_id INT NOT NULL REFERENCES applications.applications(id) ON DELETE CASCADE,
      reviewer_id INTEGER NOT NULL REFERENCES users.users(id),
      status VARCHAR(20) NOT NULL,
      comments TEXT,
      date_assigned TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      date_reviewed TIMESTAMP WITH TIME ZONE
    );

    -- Create function for generating codification
    CREATE OR REPLACE FUNCTION applications.generate_codification()
    RETURNS TRIGGER AS $$
    DECLARE
        year_part VARCHAR(2);
        month_part VARCHAR(2);
        sequential_part VARCHAR(3);
    BEGIN
        -- Get the last two digits of the current year
        year_part := TO_CHAR(CURRENT_DATE, 'YY');
        
        -- Get the current month
        month_part := TO_CHAR(CURRENT_DATE, 'MM');
        
        -- Get the sequential number for this year/month/type combination
        SELECT COALESCE(MAX(sequential_number), 0) + 1 INTO NEW.sequential_number
        FROM applications.applications
        WHERE EXTRACT(YEAR FROM date_created) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM date_created) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND investigation_type = NEW.investigation_type
        AND category_type = NEW.category_type;
        
        -- Format the sequential number with leading zeros
        sequential_part := LPAD(NEW.sequential_number::TEXT, 3, '0');
        
        -- Build the codification
        NEW.codification := 'CEISH-ESPOL-' || year_part || '-' || month_part || '-' || 
                            NEW.investigation_type || '-' || NEW.category_type || '-' || sequential_part;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger
    CREATE TRIGGER generate_application_codification
    BEFORE INSERT ON applications.applications
    FOR EACH ROW
    EXECUTE FUNCTION applications.generate_codification();
  END IF;
END $$;

-- Add role with ID 2 (Manager) if it doesn't exist
INSERT INTO users.roles (id, name, description) 
VALUES (2, 'Manager', 'Application manager with final approval privileges')
ON CONFLICT (id) DO NOTHING;

-- Update role 3 description if it exists
UPDATE users.roles 
SET description = 'Application reviewer with initial review privileges'
WHERE id = 3;

-- Create test users if they don't exist
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

-- Function to create sample application data (using existing user IDs)
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
  
  -- Check if users exist
  IF user1_id IS NULL OR user2_id IS NULL OR reviewer1_id IS NULL OR reviewer2_id IS NULL THEN
    RAISE NOTICE 'Missing user accounts. Skipping application creation.';
    RETURN;
  END IF;
  
  -- Sample applications for User 1 (Juan)
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user1_id, 'Study of Water Quality in Guayas River', 'EO', 'GE',
      1, 'CEISH-ESPOL-23-01-EO-GE-001', '2023-01-15 10:00:00+00', '2023-01-20 14:30:00+00',
      'ACCEPTED', '{"department": "Civil Engineering", "funding": "University Grant", "duration_months": 12}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app1_id;
  
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user1_id, 'Impact of Climate Change on Local Ecosystems', 'EO', 'AN',
      2, 'CEISH-ESPOL-23-02-EO-AN-002', '2023-02-03 09:15:00+00', '2023-02-10 16:45:00+00',
      'UNDER_REVIEW', '{"department": "Environmental Science", "funding": "External Grant", "duration_months": 24}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app2_id;
  
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user1_id, 'New Algorithms for Image Recognition', 'EI', 'GE',
      3, 'CEISH-ESPOL-23-03-EI-GE-003', '2023-03-12 11:30:00+00', NULL,
      'NOT_SUBMITTED', '{"department": "Computer Science", "funding": "Corporate Sponsor", "duration_months": 18}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app3_id;
  
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user1_id, 'Marine Biodiversity Assessment', 'EO', 'AN',
      4, 'CEISH-ESPOL-23-04-EO-AN-004', '2023-04-05 14:20:00+00', '2023-04-12 09:30:00+00',
      'REJECTED', '{"department": "Marine Biology", "funding": "Government Grant", "duration_months": 36}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app4_id;
  
  -- Sample applications for User 2 (María)
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user2_id, 'Survey of Mental Health in University Students', 'EO', 'SH',
      5, 'CEISH-ESPOL-23-05-EO-SH-005', '2023-05-01 10:45:00+00', '2023-05-10 11:15:00+00',
      'SECOND_REVIEW', '{"department": "Psychology", "funding": "University Grant", "duration_months": 9}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app5_id;
  
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user2_id, 'Prototype of Low-Cost Prosthetic Limbs', 'EI', 'SH',
      6, 'CEISH-ESPOL-23-06-EI-SH-006', '2023-06-15 08:30:00+00', '2023-06-20 13:45:00+00',
      'ACCEPTED', '{"department": "Biomedical Engineering", "funding": "International NGO", "duration_months": 24}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app6_id;
  
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user2_id, 'Effectiveness of New Teaching Methodologies', 'EI', 'SH',
      7, 'CEISH-ESPOL-23-07-EI-SH-007', '2023-07-03 09:00:00+00', NULL,
      'NOT_SUBMITTED', '{"department": "Education", "funding": "Internal Research Fund", "duration_months": 12}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app7_id;
  
  INSERT INTO applications.applications (
    user_id, project_title, investigation_type, category_type, 
    sequential_number, codification, date_created, date_submitted, status, metadata
  ) VALUES
    (
      user2_id, 'Sustainable Urban Planning Model', 'EO', 'GE',
      8, 'CEISH-ESPOL-23-08-EO-GE-008', '2023-08-22 15:10:00+00', '2023-08-30 10:20:00+00',
      'UNDER_REVIEW', '{"department": "Urban Planning", "funding": "Municipal Government", "duration_months": 18}'::jsonb
    )
  ON CONFLICT (codification) DO NOTHING
  RETURNING id INTO app8_id;
  
  -- Check if applications were created successfully
  IF app1_id IS NULL AND app2_id IS NULL AND app5_id IS NULL AND app8_id IS NULL THEN
    RAISE NOTICE 'No applications were created (likely due to conflicts). Skipping remaining seed data.';
    RETURN;
  END IF;
  
  -- Application reviews
  -- We'll safely insert these by checking for null values
  IF app2_id IS NOT NULL THEN
    INSERT INTO applications.reviews (
      application_id, reviewer_id, status, comments, date_assigned, date_reviewed
    ) VALUES (
      app2_id, reviewer1_id, 'UNDER_REVIEW', 
      'Initial assessment pending. Need to verify methodology.',
      '2023-02-11 09:00:00+00', NULL
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF app5_id IS NOT NULL THEN
    INSERT INTO applications.reviews (
      application_id, reviewer_id, status, comments, date_assigned, date_reviewed
    ) VALUES (
      app5_id, reviewer1_id, 'UNDER_REVIEW', 
      'First review complete. Some ethical concerns need addressing.',
      '2023-05-11 10:00:00+00', '2023-05-20 14:30:00+00'
    ) ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.reviews (
      application_id, reviewer_id, status, comments, date_assigned, date_reviewed
    ) VALUES (
      app5_id, reviewer2_id, 'UNDER_REVIEW', 
      'Additional review required for sensitive population study.',
      '2023-05-21 09:15:00+00', NULL
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF app8_id IS NOT NULL THEN
    INSERT INTO applications.reviews (
      application_id, reviewer_id, status, comments, date_assigned, date_reviewed
    ) VALUES (
      app8_id, reviewer2_id, 'UNDER_REVIEW', 
      'Reviewing implementation feasibility and community impact.',
      '2023-08-31 13:45:00+00', NULL
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Status history for first application
  IF app1_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app1_id, 'NOT_SUBMITTED', 'UNDER_REVIEW', user1_id, '2023-01-20 14:30:00+00', 'Initial submission'
    ) ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app1_id, 'UNDER_REVIEW', 'ACCEPTED', reviewer1_id, '2023-02-05 11:20:00+00', 
      'All requirements met. Methodology is sound.'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Add remaining status history entries only if they don't conflict
  IF app2_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app2_id, 'NOT_SUBMITTED', 'UNDER_REVIEW', user1_id, '2023-02-10 16:45:00+00', 'Initial submission'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF app4_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app4_id, 'NOT_SUBMITTED', 'UNDER_REVIEW', user1_id, '2023-04-12 09:30:00+00', 'Initial submission'
    ) ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app4_id, 'UNDER_REVIEW', 'REJECTED', reviewer2_id, '2023-04-25 14:15:00+00', 
      'Insufficient protection measures for endangered species'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF app5_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app5_id, 'NOT_SUBMITTED', 'UNDER_REVIEW', user2_id, '2023-05-10 11:15:00+00', 'Initial submission'
    ) ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app5_id, 'UNDER_REVIEW', 'SECOND_REVIEW', reviewer1_id, '2023-05-20 14:30:00+00', 
      'Need additional review due to sensitive population'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF app6_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app6_id, 'NOT_SUBMITTED', 'UNDER_REVIEW', user2_id, '2023-06-20 13:45:00+00', 'Initial submission'
    ) ON CONFLICT DO NOTHING;
    
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app6_id, 'UNDER_REVIEW', 'ACCEPTED', reviewer1_id, '2023-07-05 10:30:00+00', 
      'Innovative approach with clear benefits'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  IF app8_id IS NOT NULL THEN
    INSERT INTO applications.status_history (
      application_id, previous_status, new_status, changed_by, change_date, comments
    ) VALUES (
      app8_id, 'NOT_SUBMITTED', 'UNDER_REVIEW', user2_id, '2023-08-30 10:20:00+00', 'Initial submission'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Successfully added sample application data!';
END $$;
