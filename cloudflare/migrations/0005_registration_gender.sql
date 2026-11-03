-- Preserve existing applications; new registration forms require gender.
ALTER TABLE elite_registrations ADD COLUMN gender TEXT NOT NULL DEFAULT '';
