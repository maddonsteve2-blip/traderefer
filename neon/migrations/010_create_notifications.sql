CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who it was sent to
  recipient_type TEXT NOT NULL,
  recipient_id   UUID,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- What was sent
  channel     TEXT NOT NULL,
  type        TEXT NOT NULL,
  body        TEXT NOT NULL,

  -- Delivery
  provider_ref TEXT,
  status       TEXT NOT NULL DEFAULT 'sent',

  -- Context
  lead_id     UUID REFERENCES leads(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);
CREATE INDEX idx_notifications_recipient_type ON notifications(recipient_type, recipient_id);
