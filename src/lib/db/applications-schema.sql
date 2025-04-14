-- Create applications schema
CREATE SCHEMA IF NOT EXISTS applications;

-- Create applications table
CREATE TABLE IF NOT EXISTS applications.applications (
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
  metadata JSONB,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users.users(id)
);

-- Create application_status_history table to track status changes
CREATE TABLE IF NOT EXISTS applications.status_history (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES applications.applications(id) ON DELETE CASCADE,
  previous_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES users.users(id),
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comments TEXT
);

-- Create application_reviews table
CREATE TABLE IF NOT EXISTS applications.reviews (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES applications.applications(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users.users(id),
  status VARCHAR(20) NOT NULL,
  comments TEXT,
  date_assigned TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_reviewed TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_application FOREIGN KEY (application_id) REFERENCES applications.applications(id),
  CONSTRAINT fk_reviewer FOREIGN KEY (reviewer_id) REFERENCES users.users(id)
);

-- Function to generate application codification
CREATE OR REPLACE FUNCTION applications.generate_codification()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(2);
    month_part VARCHAR(2);
    investigation_type_part VARCHAR(2);
    category_type_part VARCHAR(2);
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

-- Trigger to automatically generate codification on insert
CREATE TRIGGER generate_application_codification
BEFORE INSERT ON applications.applications
FOR EACH ROW
EXECUTE FUNCTION applications.generate_codification();
