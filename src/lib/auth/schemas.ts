import { z } from 'zod';

// Schema for sign-up validation
export const SignUpSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  secondName: z.string().optional(),
  firstSurname: z.string().min(2, 'First surname is required'),
  secondSurname: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Schema for sign-in validation
export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Schema for password reset request
export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for setting a new password
export const NewPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
  token: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Types based on the schemas
export type SignUpFormData = z.infer<typeof SignUpSchema>;
export type SignInFormData = z.infer<typeof SignInSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
export type NewPasswordFormData = z.infer<typeof NewPasswordSchema>;
