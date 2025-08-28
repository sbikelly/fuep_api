-- ============================================
-- Phase 10: Admin Portal Schema Extensions
-- ============================================

-- ---------- Admin Users & RBAC ----------

-- Admin roles enumeration
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'admissions_officer', 'finance_officer', 'registrar', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username             varchar(50) NOT NULL UNIQUE,
  email                varchar(160) NOT NULL UNIQUE,
  password_hash        text NOT NULL,
  role                 admin_role NOT NULL DEFAULT 'viewer',
  is_active            boolean NOT NULL DEFAULT true,
  last_login_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);

-- Admin permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role                 admin_role NOT NULL,
  resource             varchar(64) NOT NULL,
  action               varchar(32) NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- ---------- Enhanced Audit Logging ----------

-- Admin action audit logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id        uuid NOT NULL REFERENCES admin_users(id),
  action               varchar(64) NOT NULL,
  resource             varchar(64) NOT NULL,
  resource_id          uuid,
  details              jsonb,
  ip_address           inet,
  user_agent           text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Prelist Management ----------

-- Prelist upload batches
CREATE TABLE IF NOT EXISTS prelist_upload_batches (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename             varchar(255) NOT NULL,
  total_records        integer NOT NULL,
  processed_records    integer NOT NULL DEFAULT 0,
  failed_records       integer NOT NULL DEFAULT 0,
  status               varchar(32) NOT NULL DEFAULT 'processing',
  uploaded_by          uuid NOT NULL REFERENCES admin_users(id),
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  error_log            text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- Prelist upload errors
CREATE TABLE IF NOT EXISTS prelist_upload_errors (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id             uuid NOT NULL REFERENCES prelist_upload_batches(id) ON DELETE CASCADE,
  row_number           integer NOT NULL,
  jamb_reg_no          varchar(20),
  error_message        text NOT NULL,
  raw_data             jsonb,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Enhanced Candidate Management ----------

-- Candidate notes/comments
CREATE TABLE IF NOT EXISTS candidate_notes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  admin_user_id        uuid NOT NULL REFERENCES admin_users(id),
  note_type            varchar(32) NOT NULL DEFAULT 'general',
  content              text NOT NULL,
  is_private           boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- Candidate status changes
CREATE TABLE IF NOT EXISTS candidate_status_changes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  admin_user_id        uuid NOT NULL REFERENCES admin_users(id),
  from_status          varchar(32),
  to_status            varchar(32) NOT NULL,
  reason               text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Admission Management ----------

-- Admission decision templates
CREATE TABLE IF NOT EXISTS admission_decision_templates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 varchar(100) NOT NULL,
  template_type        varchar(32) NOT NULL,
  subject              varchar(200),
  content              text NOT NULL,
  variables            jsonb,
  is_active            boolean NOT NULL DEFAULT true,
  created_by           uuid REFERENCES admin_users(id),
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);

-- Batch admission operations
CREATE TABLE IF NOT EXISTS batch_admission_operations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type       varchar(32) NOT NULL,
  status               varchar(32) NOT NULL DEFAULT 'pending',
  total_candidates     integer NOT NULL,
  processed_candidates integer NOT NULL DEFAULT 0,
  failed_candidates    integer NOT NULL DEFAULT 0,
  parameters           jsonb,
  results              jsonb,
  error_log            text,
  initiated_by         uuid NOT NULL REFERENCES admin_users(id),
  started_at           timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Payment Disputes ----------

-- Payment dispute tracking
CREATE TABLE IF NOT EXISTS payment_disputes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  dispute_type         varchar(32) NOT NULL,
  status               varchar(32) NOT NULL DEFAULT 'open',
  description          text NOT NULL,
  resolution           text,
  resolved_by          uuid REFERENCES admin_users(id),
  resolved_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Report Generation ----------

-- Asynchronous report generation jobs
CREATE TABLE IF NOT EXISTS report_generation_jobs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type          varchar(64) NOT NULL,
  status               varchar(32) NOT NULL DEFAULT 'pending',
  parameters           jsonb,
  file_path            text,
  file_size            bigint,
  error_message        text,
  progress             integer DEFAULT 0,
  initiated_by         uuid NOT NULL REFERENCES admin_users(id),
  started_at           timestamptz,
  completed_at         timestamptz,
  expires_at           timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Indexes for Performance ----------

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_prelist_upload_batches_status ON prelist_upload_batches(status);
CREATE INDEX IF NOT EXISTS idx_prelist_upload_batches_uploaded_by ON prelist_upload_batches(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_candidate_notes_candidate ON candidate_notes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_admin ON candidate_notes(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_type ON candidate_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment ON payment_disputes(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);

CREATE INDEX IF NOT EXISTS idx_batch_admission_operations_type ON batch_admission_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_batch_admission_operations_status ON batch_admission_operations(status);

CREATE INDEX IF NOT EXISTS idx_report_generation_jobs_type ON report_generation_jobs(report_type);
CREATE INDEX IF NOT EXISTS idx_report_generation_jobs_status ON report_generation_jobs(status);

-- ---------- Triggers for Updated At ----------

CREATE TRIGGER admin_users_set_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_notes_set_updated_at
BEFORE UPDATE ON candidate_notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER payment_disputes_set_updated_at
BEFORE UPDATE ON payment_disputes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER admission_decision_templates_set_updated_at
BEFORE UPDATE ON admission_decision_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER report_generation_jobs_set_updated_at
BEFORE UPDATE ON report_generation_jobs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Seed Data for Admin Portal ----------

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, email, password_hash, role) VALUES 
('admin', 'admin@fuep.edu.ng', crypt('admin123', gen_salt('bf')), 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default admin permissions
INSERT INTO admin_permissions (role, resource, action) VALUES
-- Super Admin - Full access
('super_admin', '*', '*'),
-- Admissions Officer
('admissions_officer', 'candidates', 'read'),
('admissions_officer', 'candidates', 'update'),
('admissions_officer', 'admissions', 'read'),
('admissions_officer', 'admissions', 'update'),
('admissions_officer', 'prelist', 'read'),
('admissions_officer', 'prelist', 'upload'),
('admissions_officer', 'reports', 'read'),
-- Finance Officer
('finance_officer', 'payments', 'read'),
('finance_officer', 'payments', 'update'),
('finance_officer', 'disputes', 'read'),
('finance_officer', 'disputes', 'update'),
('finance_officer', 'reconciliation', 'read'),
('finance_officer', 'reconciliation', 'update'),
('finance_officer', 'reports', 'read'),
-- Registrar
('registrar', 'candidates', 'read'),
('registrar', 'admissions', 'read'),
('registrar', 'admissions', 'update'),
('registrar', 'matriculation', 'read'),
('registrar', 'matriculation', 'update'),
('registrar', 'reports', 'read'),
-- Viewer
('viewer', 'candidates', 'read'),
('viewer', 'admissions', 'read'),
('viewer', 'payments', 'read'),
('viewer', 'reports', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- ---------- Views for Admin Portal ----------

-- Admin dashboard summary view
CREATE OR REPLACE VIEW v_admin_dashboard_summary AS
SELECT
  -- Candidate counts
  (SELECT COUNT(*) FROM candidates WHERE is_active = true) as total_candidates,
  (SELECT COUNT(*) FROM candidates WHERE is_active = true AND temp_password_flag = true) as pending_password_change,
  (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'admitted') as admitted_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'rejected') as rejected_applications,
  
  -- Payment counts
  (SELECT COUNT(*) FROM payments WHERE status = 'success') as successful_payments,
  (SELECT COUNT(*) FROM payments WHERE status = 'pending') as pending_payments,
  (SELECT COUNT(*) FROM payments WHERE status = 'failed') as failed_payments,
  (SELECT COUNT(*) FROM payment_disputes WHERE status = 'open') as open_disputes,
  
  -- Financial summary
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success' AND purpose = 'post_utme') as post_utme_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success' AND purpose = 'acceptance') as acceptance_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success' AND purpose = 'school_fee') as school_fee_revenue,
  
  -- Recent activity
  (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as admin_actions_24h,
  (SELECT COUNT(*) FROM candidates WHERE created_at >= NOW() - INTERVAL '24 hours') as new_candidates_24h,
  (SELECT COUNT(*) FROM payments WHERE created_at >= NOW() - INTERVAL '24 hours') as new_payments_24h;

-- Payment reconciliation view
CREATE OR REPLACE VIEW v_payment_reconciliation AS
SELECT
  p.id as payment_id,
  p.provider,
  p.provider_ref,
  p.amount,
  p.currency,
  p.status,
  p.created_at,
  c.jamb_reg_no,
  c.email,
  c.phone,
  pd.status as dispute_status,
  pd.description as dispute_description
FROM payments p
JOIN candidates c ON p.candidate_id = c.id
LEFT JOIN payment_disputes pd ON p.id = pd.payment_id
ORDER BY p.created_at DESC;

-- Candidate management view
CREATE OR REPLACE VIEW v_candidate_management AS
SELECT
  c.id,
  c.jamb_reg_no,
  c.username,
  c.email,
  c.phone,
  c.is_active,
  c.temp_password_flag,
  c.created_at,
  p.surname,
  p.firstname,
  p.othernames,
  p.gender,
  p.state,
  p.lga,
  a.status as application_status,
  a.session,
  a.programme_code,
  a.department_code,
  ad.decision as admission_decision,
  s.matric_no,
  (SELECT COUNT(*) FROM uploads u WHERE u.candidate_id = c.id) as document_count,
  (SELECT COUNT(*) FROM payments py WHERE py.candidate_id = c.id AND py.status = 'success') as successful_payments_count
FROM candidates c
LEFT JOIN profiles p ON c.id = p.candidate_id
LEFT JOIN applications a ON c.id = a.candidate_id
LEFT JOIN admissions ad ON c.id = ad.candidate_id
LEFT JOIN students s ON c.id = s.candidate_id
ORDER BY c.created_at DESC;

-- ---------- Comments for Documentation ----------

COMMENT ON TABLE admin_users IS 'Administrative users with role-based access control';
COMMENT ON TABLE admin_permissions IS 'Permissions matrix for different admin roles';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all administrative actions';
COMMENT ON TABLE prelist_upload_batches IS 'Bulk JAMB prelist upload processing';
COMMENT ON TABLE candidate_notes IS 'Internal notes and comments about candidates';
COMMENT ON TABLE payment_disputes IS 'Payment dispute tracking and resolution';
COMMENT ON TABLE admission_decision_templates IS 'Templates for admission letters and communications';
COMMENT ON TABLE batch_admission_operations IS 'Bulk admission processing operations';
COMMENT ON TABLE report_generation_jobs IS 'Asynchronous report generation and processing';

COMMENT ON VIEW v_admin_dashboard_summary IS 'Comprehensive admin dashboard metrics and summaries';
COMMENT ON VIEW v_payment_reconciliation IS 'Payment reconciliation data for finance officers';
COMMENT ON VIEW v_candidate_management IS 'Candidate management interface data for admissions officers';
