-- SQL table creation script & RLS policy configuration

-- 1. Create the quiz_results table
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email_id TEXT NOT NULL,
    roll_number TEXT NOT NULL UNIQUE,
    score INTEGER,
    percentage NUMERIC,
    badge TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Policy: Allow anyone to read (SELECT) for leaderboard visibility
CREATE POLICY "Allow public read access to quiz_results" ON quiz_results
    FOR SELECT
    TO public
    USING (true);

-- Policy: Allow inserts only if the roll_number does not already exist
-- (The UNIQUE constraint already enforces this at the DB level, 
-- but we can add a basic insert policy allowing authenticated/anon inserts to the table)
CREATE POLICY "Allow anon inserts for quiz_results" ON quiz_results
    FOR INSERT
    TO public
    WITH CHECK (true);

-- 4. Enable real-time for quiz_results table
-- For realtime subscription to work, the table must be included in the supabase_realtime publication
alter publication supabase_realtime add table quiz_results;
