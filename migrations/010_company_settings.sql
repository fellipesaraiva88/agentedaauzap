-- Migration: Company Settings Table
-- Description: Creates company_settings table for storing company-specific configuration
-- Author: System
-- Date: 2025-10-21

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL DEFAULT 'Pet Shop',
  agent_name VARCHAR(100) NOT NULL DEFAULT 'Atendente',
  opening_time TIME NOT NULL DEFAULT '08:00:00',
  closing_time TIME NOT NULL DEFAULT '18:00:00',
  max_concurrent_capacity INTEGER NOT NULL DEFAULT 2 CHECK (max_concurrent_capacity BETWEEN 1 AND 20),
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  reminder_d1_active BOOLEAN NOT NULL DEFAULT true,
  reminder_12h_active BOOLEAN NOT NULL DEFAULT true,
  reminder_4h_active BOOLEAN NOT NULL DEFAULT true,
  reminder_1h_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id)
);

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON company_settings(company_id);

-- Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before each update
CREATE TRIGGER trigger_update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

-- Insert default configuration for company_id = 1
INSERT INTO company_settings (
  company_id,
  company_name,
  agent_name,
  opening_time,
  closing_time,
  max_concurrent_capacity,
  timezone,
  reminder_d1_active,
  reminder_12h_active,
  reminder_4h_active,
  reminder_1h_active
) VALUES (
  1,
  'Pet Shop',
  'Atendente',
  '08:00:00',
  '18:00:00',
  2,
  'America/Sao_Paulo',
  true,
  true,
  true,
  true
)
ON CONFLICT (company_id) DO NOTHING;

-- Add comment to table for documentation
COMMENT ON TABLE company_settings IS 'Stores company-specific configuration settings including business hours, capacity, and reminder preferences';
COMMENT ON COLUMN company_settings.company_id IS 'Foreign key reference to companies table';
COMMENT ON COLUMN company_settings.max_concurrent_capacity IS 'Maximum number of concurrent appointments allowed (1-20)';
COMMENT ON COLUMN company_settings.timezone IS 'Timezone for business operations (IANA timezone format)';
COMMENT ON COLUMN company_settings.reminder_d1_active IS 'Enable/disable reminder 1 day before appointment';
COMMENT ON COLUMN company_settings.reminder_12h_active IS 'Enable/disable reminder 12 hours before appointment';
COMMENT ON COLUMN company_settings.reminder_4h_active IS 'Enable/disable reminder 4 hours before appointment';
COMMENT ON COLUMN company_settings.reminder_1h_active IS 'Enable/disable reminder 1 hour before appointment';
