CREATE TABLE lead_pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  pin         TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_pins_lead_id ON lead_pins(lead_id);
