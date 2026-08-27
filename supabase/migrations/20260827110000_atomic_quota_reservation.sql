CREATE OR REPLACE FUNCTION reserve_upload_quota(
  p_user_id UUID,
  p_invitation_id UUID,
  p_kind TEXT,
  p_purpose TEXT,
  p_byte_size BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_total_bytes BIGINT;
  v_reservation_id UUID;
  v_max_bytes BIGINT := 536870912; -- 500MB overall limit per invitation
BEGIN
  -- 1. Lock the invitation row to prevent concurrent race conditions
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVITATION_NOT_FOUND');
  END IF;

  -- 2. Aggregate current usage
  SELECT COALESCE(SUM(reserved_bytes), 0) INTO v_total_bytes
  FROM upload_reservations
  WHERE invitation_id = p_invitation_id AND status = 'active';

  v_total_bytes := v_total_bytes + (
    SELECT COALESCE(SUM(byte_size), 0)
    FROM media_assets
    WHERE invitation_id = p_invitation_id AND status IN ('pending_upload', 'uploaded', 'ready')
  );

  -- 3. Enforce quota
  IF (v_total_bytes + p_byte_size) > v_max_bytes THEN
    RETURN jsonb_build_object('success', false, 'error', 'QUOTA_EXCEEDED');
  END IF;

  -- 4. Create reservation
  v_reservation_id := gen_random_uuid();

  INSERT INTO upload_reservations (
    id, invitation_id, owner_id, kind, purpose, reserved_count, reserved_bytes, status, expires_at
  )
  VALUES (
    v_reservation_id, p_invitation_id, p_user_id, p_kind, p_purpose, 1, p_byte_size, 'active', NOW() + INTERVAL '1 hour'
  );

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id
  );
END;
$$;
