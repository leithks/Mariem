# Implementation Plan: Migrating to Supabase

The goal is to transition the application from using local/mock data to a production-ready Supabase backend with authentication and PostgreSQL.

## 1. Setup & Auth
- Install `@supabase/supabase-js`.
- Create a centralized Supabase client in `src/lib/supabase.ts`.
- Implement an `AuthProvider` in `src/components/auth/AuthProvider.tsx` to manage the authenticated state and persistence.
- Create a `LoginPage` in `src/components/auth/LoginPage.tsx` for email/password authentication.
- Protect the main application in `App.tsx` by checking the auth session.

## 2. Database Schema (PostgreSQL)
- Define SQL migration scripts for the necessary tables (e.g., `profiles`, `lessons`).
- Implement Row Level Security (RLS) to restrict access to the authenticated user.

## 3. Data Integration
- Create a service layer in `src/services/` (e.g., `lessonService.ts`, `profileService.ts`) to interact with Supabase tables.
- Replace mock data usage in `App.tsx` and other components with calls to the new service layer.

## 4. Final Polish
- Add loading/error states for auth and data fetching.
- Update `package.json` and `.env.example` with Supabase configuration variables.
- Prepare deployment instructions for Vercel.
