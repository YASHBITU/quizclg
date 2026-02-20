# DOWNLOADABLE – THE PSYCHOLOGY OF MARKETING QUIZ (SUPABASE VERSION)

## Deployment Instructions

This project has been completely refactored to use a Supabase (PostgreSQL) backend, replacing the old Google Sheets approach. It now includes:
- Realtime Live Leaderboard (Top 5)
- Strict One-Time Attempt Enforcement via Roll Number (no retakes!)
- Automatic Database Saving on Quiz Completion
- Automated High-Resolution Certificate Generation
- Premium Dark Theme UI with Purple/Gold Accents

### 1. Supabase Backend Setup
1. Create a new project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor**, and run the entire script found in `supabase-setup.sql` in this repo.
   This script will:
   - Create the `quiz_results` table.
   - Setup Row Level Security (RLS) policies.
   - Enable realtime features for the `quiz_results` table.

### 2. Frontend Environment Setup
1. In the root directory, create a `.env` file containing your Supabase URL and Anon Key.
```
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```
*(You can find these in your Supabase project settings under API).*

### 3. Local Development
1. Run `npm install` to install all necessary dependencies (including `@supabase/supabase-js`, `tailwindcss`, `lucide-react`, `motion`, `html2canvas`).
2. Run `npm run dev` to start the local Vite development server.

### 4. Production Deployment (Vercel, Netlify, etc.)
1. Link your GitHub repository to Vercel/Netlify.
2. In the deployment settings, add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. The build command is `npm run build` and output directory is `dist`.
4. Deploy the application! It will now function completely with realtime leaderboards, preventing duplicate roll numbers via PostgreSQL UNIQUE constraints and checking before attempts.
