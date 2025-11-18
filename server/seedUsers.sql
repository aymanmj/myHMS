-- Seed test users with predefined roles for RBAC testing
-- Run this once to create test users in development database

INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at) VALUES
('admin-test-001', 'admin@hospital.test', 'Admin', 'User', 'admin', NOW(), NOW()),
('doctor-test-001', 'doctor@hospital.test', 'Doctor', 'User', 'doctor', NOW(), NOW()),
('nurse-test-001', 'nurse@hospital.test', 'Nurse', 'User', 'nurse', NOW(), NOW()),
('pharmacist-test-001', 'pharmacist@hospital.test', 'Pharmacist', 'User', 'pharmacist', NOW(), NOW()),
('lab-test-001', 'lab@hospital.test', 'Lab', 'Technician', 'lab_tech', NOW(), NOW()),
('radiology-test-001', 'radiology@hospital.test', 'Radiology', 'Technician', 'radiology_tech', NOW(), NOW()),
('receptionist-test-001', 'receptionist@hospital.test', 'Receptionist', 'User', 'receptionist', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = NOW();
