-- Apply both schema and seed data in one transaction

-- Create the applications schema and tables
\echo 'Applying applications schema...'
\include_relative applications-schema.sql

-- Apply seed data
\echo 'Applying seed data...'
\include_relative seed-data.sql

