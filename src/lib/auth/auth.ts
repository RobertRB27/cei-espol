import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import bcrypt from "bcrypt";
import { z } from "zod";
import NextAuth from "next-auth";

// Importar la conexión centralizada a la base de datos
import pool from "@/lib/db";

// Extend the Session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role_id?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role_id?: number;
  }
}

// Usamos la instancia de Pool compartida y centralizada importada desde @/lib/db

// Auth options configuration
export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
    verifyRequest: "/sign-in"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role_id = (user as any).role_id || 1;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role_id = token.role_id as number;
      }
      return session;
    }
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const parsedCredentials = z
            .object({
              email: z.string().email(),
              password: z.string().min(6)
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            return null;
          }

          const { email, password } = parsedCredentials.data;

          // Query the database for the user
          const res = await pool.query(
            "SELECT * FROM users.users WHERE email = $1",
            [email]
          );
          const user = res.rows[0];

          if (!user) {
            return null;
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.first_surname}`,
            role_id: user.role_id || 1, // Default to role ID 1 if not set
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
};

// Create NextAuth handler
const handler = NextAuth(authOptions);

// Export auth for server-side auth checks
export const { auth } = handler;

// For API routes
export { handler as GET, handler as POST };

// Re-export for client usage - these should be imported in client components
export { signIn, signOut } from "next-auth/react";
