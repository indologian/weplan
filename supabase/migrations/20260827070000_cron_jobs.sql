-- Supabase Cron jobs for weplan
-- Run these after deployment via Supabase Dashboard or SQL Editor

-- Dispatch outbox events + lifecycle expiry: every 5 minutes
SELECT cron.schedule(
  'weplan-dispatch-and-expiry',
  '*/5 * * * *',
  $$
    SELECT net.http_get(
      url := current_setting('app.settings.app_url') || '/api/cron/dispatch',
      headers := '{"Authorization": "Bearer " || current_setting('app.settings.cron_secret')}'
    );
  $$
);

-- Lifecycle jobs (retention cleanup, stale media, reconciliation): every hour
SELECT cron.schedule(
  'weplan-lifecycle-jobs',
  '0 * * * *',
  $$
    SELECT net.http_get(
      url := current_setting('app.settings.app_url') || '/api/cron/lifecycle',
      headers := '{"Authorization": "Bearer " || current_setting('app.settings.cron_secret')}'
    );
  $$
);
