-- Database Schema for CEI-ESPOL project

-- Create users schema
CREATE SCHEMA IF NOT EXISTS users;

-- Roles table (as provided by user)
CREATE TABLE IF NOT EXISTS users.roles (
    id          integer   not null
        constraint roles_pk
            primary key,
    name        text      not null,
    description text      not null,
    status      boolean   not null,
    created_at  timestamp not null,
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
