-- Tracks earned badges; UNIQUE prevents re-firing
CREATE TABLE IF NOT EXISTS user_badges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,          -- Clerk user_id
    user_type   TEXT NOT NULL,          -- 'referrer' or 'business'
    badge_id    TEXT NOT NULL,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_email BOOLEAN NOT NULL DEFAULT FALSE,
    notified_sms   BOOLEAN NOT NULL DEFAULT FALSE,
    seen_in_app    BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_unseen ON user_badges(user_id) WHERE seen_in_app = FALSE;

-- Prevents re-engagement spam (tracks last nudge per user)
CREATE TABLE IF NOT EXISTS engagement_nudges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    user_type   TEXT NOT NULL,
    channel     TEXT NOT NULL,         -- 'email' or 'sms'
    nudge_type  TEXT NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_nudges_user ON engagement_nudges(user_id, sent_at DESC);
