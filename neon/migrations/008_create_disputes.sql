CREATE TABLE disputes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES leads(id),
  business_id   UUID NOT NULL REFERENCES businesses(id),

  reason        TEXT NOT NULL,
  notes         TEXT,

  -- Resolution
  status        TEXT NOT NULL DEFAULT 'OPEN',
  admin_notes   TEXT,
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES neon_auth.user(id), -- Admins are neon_auth users

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_lead_id ON disputes(lead_id);
CREATE INDEX idx_disputes_status ON disputes(status);
