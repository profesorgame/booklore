ALTER TABLE shelf
    ADD COLUMN auto_email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN auto_email_provider_id BIGINT,
    ADD COLUMN auto_email_recipient_id BIGINT;
