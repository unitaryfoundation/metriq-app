-- Users: privileged flag
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_privileged boolean NOT NULL DEFAULT false;

-- Submissions: restrict who can append results
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS restricted_append boolean NOT NULL DEFAULT false;

-- Optional: indexes if filtering often by these flags
CREATE INDEX IF NOT EXISTS idx_users_is_privileged ON users (is_privileged);
CREATE INDEX IF NOT EXISTS idx_submissions_restricted_append ON submissions (restricted_append);

