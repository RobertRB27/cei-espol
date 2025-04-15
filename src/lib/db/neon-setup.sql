-- Complete setup script for Neon database

-- Create users schema
CREATE SCHEMA IF NOT EXISTS users;

-- Create applications schema
CREATE SCHEMA IF NOT EXISTS applications;

-- Roles table
CREATE TABLE IF NOT EXISTS users.roles (
    id          integer   not null
        constraint roles_pk
            primary key,
    name        text      not null,
    description text      not null,
    status      boolean   not null DEFAULT true,
    created_at  timestamp not null DEFAULT CURRENT_TIMESTAMP,
    modified_at timestamp
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users.users (
    id            SERIAL PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,
    second_name   VARCHAR(100),
    first_surname VARCHAR(100) NOT NULL,
    second_surname VARCHAR(100),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    role_id       INTEGER REFERENCES users.roles(id),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS users.password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users.users(id),
    token       VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT false,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NextAuth.js required tables
-- See: https://authjs.dev/reference/adapter/pg

-- Sessions table for NextAuth
CREATE TABLE IF NOT EXISTS users.sessions (
    id            VARCHAR(255) PRIMARY KEY,
    user_id       VARCHAR(255) NOT NULL,
    expires       TIMESTAMP NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL
);

-- Accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS users.accounts (
    id                 VARCHAR(255) PRIMARY KEY,
    user_id            VARCHAR(255) NOT NULL,
    provider           VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token      TEXT,
    access_token       TEXT,
    expires_at         BIGINT,
    token_type         VARCHAR(255),
    scope              VARCHAR(255),
    id_token           TEXT,
    session_state      VARCHAR(255),
    UNIQUE(provider, provider_account_id)
);

-- Verification tokens for email verification
CREATE TABLE IF NOT EXISTS users.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires    TIMESTAMP NOT NULL,
    UNIQUE(identifier, token)
);

-- Initial roles setup
INSERT INTO users.roles (id, name, description, status, created_at)
VALUES 
    (1, 'User', 'Regular user with basic access', true, CURRENT_TIMESTAMP),
    (2, 'Admin', 'Administrator with full access', true, CURRENT_TIMESTAMP),
    (3, 'Moderator', 'Content moderator', true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Update role 3 to Reviewer
UPDATE users.roles 
SET name = 'Reviewer', description = 'Application reviewer with content moderation access' 
WHERE id = 3;

-- Add role with ID 2 (Manager) if it doesn't exist
INSERT INTO users.roles (id, name, description, status, created_at) 
VALUES (2, 'Manager', 'Application manager with final approval privileges', true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Create applications table with proper references to users
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
  metadata JSONB
);

-- Create status_history table
CREATE TABLE IF NOT EXISTS applications.status_history (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES applications.applications(id) ON DELETE CASCADE,
  previous_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  changed_by INTEGER NOT NULL REFERENCES users.users(id),
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comments TEXT
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS applications.reviews (
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
DROP TRIGGER IF EXISTS generate_application_codification ON applications.applications;
CREATE TRIGGER generate_application_codification
BEFORE INSERT ON applications.applications
FOR EACH ROW
EXECUTE FUNCTION applications.generate_codification();

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
  -- Admin user for initial setup
  (
    'Admin', 
    '', 
    'CEI', 
    'ESPOL', 
    'admin@cei-espol.com', 
    '$2b$10$hACwQLTAAIX7BxLyGZvsXuJ3NAE/Q1QsCOLd1jT.YAOX4mxXfI.C2', -- Password123
    2
  )
ON CONFLICT (email) DO NOTHING;

-- For ease of initial use, add a known admin user
INSERT INTO users.users (
  first_name, 
  second_name, 
  first_surname, 
  second_surname, 
  email, 
  password, 
  role_id
)
VALUES (
  'Roberto', 
  '', 
  'Ricci', 
  'Bravo', 
  'robertricci27@gmail.com', 
  '$2b$10$hACwQLTAAIX7BxLyGZvsXuJ3NAE/Q1QsCOLd1jT.YAOX4mxXfI.C2', -- Password123
  2
)
ON CONFLICT (email) DO NOTHING;
