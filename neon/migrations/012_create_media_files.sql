-- Media files stored directly in Neon (used when S3 is not configured)
CREATE TABLE media_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder        TEXT NOT NULL DEFAULT 'general',
  filename      TEXT NOT NULL,
  content_type  TEXT NOT NULL,
  data          BYTEA NOT NULL,
  uploaded_by   TEXT NOT NULL,  -- Clerk user ID
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_folder ON media_files(folder);

