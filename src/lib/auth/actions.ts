'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import pool from '../db';
import { signIn } from './auth';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

// Import the schemas from the schemas.ts file
import {
  SignUpSchema,
  SignInSchema,
  ResetPasswordSchema,
  NewPasswordSchema,
  SignUpFormData,
  SignInFormData,
  ResetPasswordFormData,
  NewPasswordFormData
} from './schemas';

// Define AuthError class for type safety
class AuthError extends Error {
  type: string;
  
  constructor(message: string, type: string) {
    super(message);
    this.type = type;
    this.name = 'AuthError';
  }
}

// Sign up action
export async function signUp(formData: SignUpFormData) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(formData.password, 10);
    
    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users.users (
        first_name, 
        second_name, 
        first_surname, 
        second_surname, 
        email, 
        password, 
        role_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        formData.firstName,
        formData.secondName || '',
        formData.firstSurname,
        formData.secondSurname || '',
        formData.email.toLowerCase(),
        hashedPassword,
        1 // Default role ID
      ]
    );
    
    // Return success
    return { success: true, userId: result.rows[0].id };
  } catch (error: any) {
    // Check for duplicate email
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return { 
        success: false, 
        error: 'A user with this email already exists' 
      };
    }
    
    console.error('Sign-up error:', error);
    return { 
      success: false, 
      error: 'An error occurred during sign-up. Please try again.' 
    };
  }
}

// Authentication action
export async function authenticate(formData: SignInFormData) {
  try {
    // Validate credentials format
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .safeParse(formData);

    if (!parsedCredentials.success) {
      return { success: false, error: 'Invalid email or password format' };
    }

    const { email, password } = parsedCredentials.data;

    // Query the database for the user
    const res = await pool.query(
      "SELECT * FROM users.users WHERE email = $1",
      [email]
    );
    const user = res.rows[0];

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Authentication successful
    return { 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.first_surname}`,
        role_id: user.role_id || 1
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Request password reset
export async function requestPasswordReset(formData: ResetPasswordFormData) {
  try {
    const email = formData.email.toLowerCase();
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users.users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Don't reveal that the user doesn't exist for security reasons
      return { success: true };
    }
    
    // Generate a reset token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store the token in the database
    await pool.query(
      `INSERT INTO users.password_reset_tokens (
        user_id, 
        token, 
        expires_at
      ) VALUES ($1, $2, $3)`,
      [userResult.rows[0].id, token, expires]
    );
    
    // In a real application, you would send an email with the reset link
    // For now, we'll just console log it
    console.log(`Password reset link: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`);
    
    return { success: true };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { 
      success: false, 
      error: 'An error occurred. Please try again.' 
    };
  }
}

// Set new password
export async function setNewPassword(formData: NewPasswordFormData) {
  try {
    // Verify token is valid and not expired
    const tokenResult = await pool.query(
      `SELECT user_id FROM users.password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW() AND used = false`,
      [formData.token]
    );
    
    if (tokenResult.rows.length === 0) {
      return { 
        success: false, 
        error: 'Invalid or expired token. Please request a new password reset.' 
      };
    }
    
    const userId = tokenResult.rows[0].user_id;
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(formData.password, 10);
    
    // Update user's password
    await pool.query(
      'UPDATE users.users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    // Mark token as used
    await pool.query(
      'UPDATE users.password_reset_tokens SET used = true WHERE token = $1',
      [formData.token]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: 'An error occurred. Please try again.' 
    };
  }
}

// Redirect to dashboard after successful login
export async function loginRedirect() {
  redirect('/dashboard');
}
