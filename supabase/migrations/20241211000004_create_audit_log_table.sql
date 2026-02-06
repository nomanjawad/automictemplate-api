-- ============================================================================
-- Audit Log Table (Simplified)
-- Tracks all INSERT, UPDATE, DELETE operations across important tables
-- Automatic via triggers
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),

  -- Who did it
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,  -- Denormalized for quick access even if user deleted

  -- What changed (simplified - just key fields)
  old_values JSONB,  -- NULL for INSERT
  new_values JSONB,  -- NULL for DELETE
  changed_fields TEXT[],  -- Array of field names that changed

  -- When
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Request context (optional but useful)
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Most common queries: by table and record
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id, created_at DESC);

-- Time-based queries
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- User activity queries
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- Action type queries
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Composite index for common analytics
CREATE INDEX idx_audit_log_analytics ON audit_log(table_name, action, created_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (admins) can view audit logs
CREATE POLICY "Authenticated users can view audit logs"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- No manual INSERT - only triggers can insert
-- No UPDATE or DELETE - audit log is immutable

-- ============================================================================
-- Generic Audit Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_changed_fields TEXT[];
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get current user (if available from context)
  v_user_id := auth.uid();

  -- Try to get user email
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    v_new_values := to_jsonb(NEW);

    INSERT INTO audit_log (
      table_name,
      record_id,
      action,
      user_id,
      user_email,
      new_values
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      v_user_id,
      v_user_email,
      v_new_values
    );

    RETURN NEW;

  -- Handle UPDATE
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);

    -- Find changed fields (simplified - compare JSON keys)
    SELECT ARRAY_AGG(key) INTO v_changed_fields
    FROM jsonb_each(v_new_values) new_data
    WHERE v_old_values->new_data.key IS DISTINCT FROM new_data.value;

    -- Only log if something actually changed
    IF v_changed_fields IS NOT NULL AND array_length(v_changed_fields, 1) > 0 THEN
      INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        user_id,
        user_email,
        old_values,
        new_values,
        changed_fields
      ) VALUES (
        TG_TABLE_NAME,
        OLD.id,
        'UPDATE',
        v_user_id,
        v_user_email,
        v_old_values,
        v_new_values,
        v_changed_fields
      );
    END IF;

    RETURN NEW;

  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' THEN
    v_old_values := to_jsonb(OLD);

    INSERT INTO audit_log (
      table_name,
      record_id,
      action,
      user_id,
      user_email,
      old_values
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      v_user_id,
      v_user_email,
      v_old_values
    );

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_trigger_function IS
  'Generic audit trigger that logs INSERT, UPDATE, DELETE operations.
   Automatically captures user context and changed fields.';

-- ============================================================================
-- Attach Audit Triggers to Tables
-- ============================================================================

-- content_pages audit
CREATE TRIGGER audit_content_pages_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content_pages
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- blog_posts audit
CREATE TRIGGER audit_blog_posts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- content_common audit
CREATE TRIGGER audit_content_common_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content_common
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- users audit (track profile changes)
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- Cleanup Function: Remove old audit logs (Run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(months_to_keep INTEGER DEFAULT 3)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - (months_to_keep || ' months')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audit_logs IS
  'Deletes audit logs older than specified months. Default: 3 months.
   Returns count of deleted records.
   Usage: SELECT cleanup_old_audit_logs(3);

   **Recommended**: Run this quarterly via cron job to prevent table bloat.';

-- ============================================================================
-- Helper Views for Common Audit Queries
-- ============================================================================

-- Recent activity across all tables
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
  al.table_name,
  al.record_id,
  al.action,
  al.user_email,
  u.full_name as user_name,
  al.changed_fields,
  al.created_at
FROM audit_log al
LEFT JOIN public.users u ON al.user_id = u.id
WHERE al.created_at >= NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_audit_activity IS
  'Shows recent audit activity (last 7 days) across all tables';

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  al.user_id,
  al.user_email,
  u.full_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action = 'DELETE') as deletes,
  MAX(al.created_at) as last_activity
FROM audit_log al
LEFT JOIN public.users u ON al.user_id = u.id
WHERE al.created_at >= NOW() - INTERVAL '30 days'
GROUP BY al.user_id, al.user_email, u.full_name
ORDER BY total_actions DESC;

COMMENT ON VIEW user_activity_summary IS
  'User activity summary for the last 30 days';

-- Table activity summary
CREATE OR REPLACE VIEW table_activity_summary AS
SELECT
  table_name,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action = 'DELETE') as deletes,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_modified
FROM audit_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY table_name
ORDER BY total_operations DESC;

COMMENT ON VIEW table_activity_summary IS
  'Table activity summary for the last 30 days';

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get audit trail for a specific record
CREATE OR REPLACE FUNCTION get_audit_trail(
  p_table_name TEXT,
  p_record_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  action TEXT,
  user_email TEXT,
  user_name TEXT,
  changed_fields TEXT[],
  change_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.action,
    al.user_email,
    u.full_name as user_name,
    al.changed_fields,
    al.created_at as change_date
  FROM audit_log al
  LEFT JOIN public.users u ON al.user_id = u.id
  WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_audit_trail IS
  'Get complete audit trail for a specific record.
   Usage: SELECT * FROM get_audit_trail(''content_pages'', ''uuid-here'', 20);';

-- Get user activity log
CREATE OR REPLACE FUNCTION get_user_activity(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  table_name TEXT,
  record_id UUID,
  action TEXT,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.table_name,
    al.record_id,
    al.action,
    al.changed_fields,
    al.created_at
  FROM audit_log al
  WHERE al.user_id = p_user_id
    AND al.created_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_activity IS
  'Get activity log for a specific user.
   Usage: SELECT * FROM get_user_activity(''user-uuid'', 30, 100);';

-- ============================================================================
-- Table Documentation
-- ============================================================================

COMMENT ON TABLE audit_log IS
  'Simplified audit log that automatically tracks all changes to important tables.
   Captures who did what and when, with before/after values.

   **Automatic**: Populated via triggers, no manual intervention needed.
   **Immutable**: Once logged, records cannot be modified or deleted manually.
   **Cleanup**: Run cleanup_old_audit_logs() quarterly to manage size.

   Tables being audited:
   - content_pages
   - blog_posts
   - content_common
   - public.users';

COMMENT ON COLUMN audit_log.table_name IS
  'Name of the table where the change occurred';

COMMENT ON COLUMN audit_log.record_id IS
  'UUID of the record that was changed';

COMMENT ON COLUMN audit_log.action IS
  'Type of operation: INSERT, UPDATE, or DELETE';

COMMENT ON COLUMN audit_log.old_values IS
  'Full record snapshot before change (NULL for INSERT)';

COMMENT ON COLUMN audit_log.new_values IS
  'Full record snapshot after change (NULL for DELETE)';

COMMENT ON COLUMN audit_log.changed_fields IS
  'Array of field names that were modified (UPDATE only)';

COMMENT ON COLUMN audit_log.user_email IS
  'Email of user who made the change (denormalized for performance)';

COMMENT ON COLUMN audit_log.ip_address IS
  'IP address of the request (if available from context)';

COMMENT ON COLUMN audit_log.user_agent IS
  'User agent string of the request (if available from context)';
