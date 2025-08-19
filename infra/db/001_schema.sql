-- ============================================
-- Post-UTME Portal — PostgreSQL Schema
-- ============================================

-- Extensions (UUIDs + cryptographic functions)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Enums ----------

DO $$ BEGIN
    CREATE TYPE payment_purpose AS ENUM ('post_utme', 'acceptance', 'school_fee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('remita', 'flutterwave', 'paystack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('initiated', 'pending', 'processing', 'success', 'failed', 'cancelled', 'disputed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE decision_status AS ENUM ('pending', 'admitted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE migration_status AS ENUM ('pending', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE upload_type AS ENUM ('passport', 'ssce', 'alevel', 'transcript', 'utme_result', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE scan_status AS ENUM ('pending', 'clean', 'infected', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Utility: updated_at trigger ----------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Reference / Preload ----------

CREATE TABLE IF NOT EXISTS jamb_prelist (
  jamb_reg_no          varchar(20) PRIMARY KEY,
  surname              varchar(100) NOT NULL,
  firstname            varchar(100) NOT NULL,
  othernames           varchar(100),
  gender               varchar(10),
  programme_code       varchar(32),
  department_code      varchar(32),
  faculty              varchar(64),
  state_of_origin      varchar(64),
  lga_of_origin        varchar(64),
  email                varchar(160),
  phone                varchar(32),
  utme_score           integer,
  session              varchar(16) NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Core Identity ----------

CREATE TABLE IF NOT EXISTS candidates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jamb_reg_no          varchar(20) NOT NULL UNIQUE,
  username             varchar(50) NOT NULL UNIQUE,  -- equals jamb_reg_no
  email                varchar(160) NOT NULL,
  phone                varchar(32) NOT NULL,
  password_hash        text,
  temp_password_flag   boolean NOT NULL DEFAULT true,
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER candidates_set_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS profiles (
  candidate_id         uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  surname              varchar(100),
  firstname            varchar(100),
  othernames           varchar(100),
  gender               varchar(10),
  dob                  date,
  address              text,
  state                varchar(64),
  lga                  varchar(64),
  city                 varchar(64),
  nationality          varchar(64),
  marital_status       varchar(32),
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS next_of_kin (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name                 varchar(160) NOT NULL,
  relation             varchar(64),
  phone                varchar(32),
  email                varchar(160),
  address              text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nok_candidate ON next_of_kin(candidate_id);

CREATE TABLE IF NOT EXISTS sponsors (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name                 varchar(160) NOT NULL,
  phone                varchar(32),
  email                varchar(160),
  address              text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sponsors_candidate ON sponsors(candidate_id);

-- ---------- Academic Records & Uploads ----------

CREATE TABLE IF NOT EXISTS education_records (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  level_type           varchar(32) NOT NULL,     -- 'ssce' | 'alevel' | 'undergrad' etc.
  exam_type            varchar(32),              -- 'waec' | 'neco' | 'gce' etc.
  year                 varchar(10),
  school_name          varchar(160),
  certificate_no       varchar(64),
  grade_summary        text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_edu_candidate ON education_records(candidate_id);

CREATE TABLE IF NOT EXISTS uploads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  type                 upload_type NOT NULL,
  s3_url               text NOT NULL,
  checksum_sha256      varchar(64),
  size_bytes           bigint,
  mime_type            varchar(128),
  scan_status          scan_status NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uploads_candidate ON uploads(candidate_id);
CREATE INDEX IF NOT EXISTS idx_uploads_type ON uploads(type);

-- ---------- Application & Admission ----------

CREATE TABLE IF NOT EXISTS applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  session              varchar(16) NOT NULL,
  programme_code       varchar(32),
  department_code      varchar(32),
  status               decision_status NOT NULL DEFAULT 'pending',
  submitted_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS admissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  decision             decision_status NOT NULL DEFAULT 'pending',
  decided_at           timestamptz,
  decided_by           uuid,                      -- admin user id (if you add admin_users table)
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER admissions_set_updated_at
BEFORE UPDATE ON admissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Payments & Receipts ----------

CREATE TABLE IF NOT EXISTS payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  purpose              payment_purpose NOT NULL,
  provider             payment_provider,
  provider_ref         varchar(128),    -- e.g., Remita RRR or transaction ref
  amount               numeric(14,2) NOT NULL,
  currency             varchar(8) NOT NULL DEFAULT 'NGN',
  status               payment_status NOT NULL DEFAULT 'initiated',
  idempotency_key      varchar(128) NOT NULL,    -- (candidate_id + purpose + session)
  request_hash         varchar(64) NOT NULL,     -- SHA-256 hash of canonicalized request
  response_snapshot    jsonb,                    -- Stored response for idempotency
  status_code          integer NOT NULL DEFAULT 201, -- HTTP status code for idempotency
  first_request_at     timestamptz NOT NULL DEFAULT NOW(),
  last_request_at      timestamptz NOT NULL DEFAULT NOW(),
  replay_count         integer NOT NULL DEFAULT 1,
  external_reference   varchar(128),    -- Provider's external reference
  metadata             jsonb,           -- Provider-specific data
  webhook_received_at  timestamptz,     -- When webhook was received
  verified_at          timestamptz,     -- When payment was verified
  receipt_url          text,            -- URL to generated receipt
  expires_at           timestamptz,     -- When payment expires
  raw_payload          jsonb,           -- Raw provider response
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_idempotency_key ON payments(idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_provider_ref ON payments(provider_ref) WHERE provider_ref IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_external_reference ON payments(external_reference) WHERE external_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_candidate ON payments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_purpose ON payments(purpose);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);
CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Payment events for audit trail
CREATE TABLE IF NOT EXISTS payment_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  event_type           varchar(64) NOT NULL,     -- 'initiated', 'webhook_received', 'verified', 'status_changed'
  from_status          payment_status,
  to_status            payment_status,
  provider_event_id    varchar(128),             -- Provider's event identifier for deduplication
  signature_hash       varchar(64),              -- Hash of webhook signature for verification
  provider_data        jsonb,                    -- Provider-specific event data
  metadata             jsonb,                    -- Additional event metadata
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_events_provider_event ON payment_events(provider_event_id) WHERE provider_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS receipts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           uuid NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  serial               varchar(32) NOT NULL,
  qr_token             varchar(64) NOT NULL,
  pdf_url              text NOT NULL,
  content_hash         varchar(64),              -- SHA-256 hash of receipt content for tamper detection
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_receipts_serial ON receipts(serial);
CREATE UNIQUE INDEX IF NOT EXISTS ux_receipts_qr_token ON receipts(qr_token);

-- ---------- Matriculation & Students ----------

CREATE TABLE IF NOT EXISTS matric_counters (
  session              varchar(16) NOT NULL,
  dept_code            varchar(32) NOT NULL,
  last_seq             integer NOT NULL DEFAULT 0,
  PRIMARY KEY (session, dept_code)
);

CREATE TABLE IF NOT EXISTS students (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  matric_no            varchar(32) NOT NULL UNIQUE,
  dept_code            varchar(32),
  session              varchar(16),
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Migration to Main Portal ----------

CREATE TABLE IF NOT EXISTS migrations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           uuid NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  status               migration_status NOT NULL DEFAULT 'pending',
  attempts             integer NOT NULL DEFAULT 0,
  last_error           text,
  pushed_at            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER migrations_set_updated_at
BEFORE UPDATE ON migrations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Audit Logs ----------

CREATE TABLE IF NOT EXISTS audit_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id             uuid,                   -- candidate or admin id
  actor_role           varchar(32),
  action               varchar(64) NOT NULL,
  entity               varchar(64),
  entity_id            uuid,
  data                 jsonb,
  ip                   inet,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ---------- Helpful Views (optional) ----------

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  c.id AS candidate_id,
  c.jamb_reg_no,
  c.username,
  a.decision AS admission_status,
  s.matric_no,
  ap.programme_code,
  ap.department_code
FROM candidates c
LEFT JOIN admissions a ON a.candidate_id = c.id
LEFT JOIN students  s ON s.candidate_id = c.id
LEFT JOIN applications ap ON ap.candidate_id = c.id;

-- Payment summary view for candidates
CREATE OR REPLACE VIEW v_payment_summary AS
SELECT
  p.id AS payment_id,
  p.candidate_id,
  c.jamb_reg_no,
  p.purpose,
  p.provider,
  p.amount,
  p.currency,
  p.status,
  p.provider_ref,
  p.created_at,
  p.verified_at,
  p.receipt_url,
  r.serial AS receipt_serial
FROM payments p
JOIN candidates c ON c.id = p.candidate_id
LEFT JOIN receipts r ON r.payment_id = p.id
ORDER BY p.created_at DESC;

-- ---------- Minimal seed (optional) ----------
-- INSERT INTO matric_counters(session, dept_code, last_seq) VALUES ('2025', 'CSC', 0) ON CONFLICT DO NOTHING;

