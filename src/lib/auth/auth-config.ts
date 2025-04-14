/**
 * This file is deprecated. Please use auth.ts instead.
 * Keeping this file for reference only.
 */

import { NextAuthOptions } from "next-auth";

// Auth config is now directly defined in auth.ts
// This is kept only for reference
export const authConfig: NextAuthOptions = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
    verifyRequest: "/sign-in",
  },
  session: {
    strategy: "jwt"
  },
  providers: []

};

// This is used in server contexts
export const authOptions = {
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
};
