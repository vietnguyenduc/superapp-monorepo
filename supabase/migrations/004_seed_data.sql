-- Migration: 004_seed_data.sql
-- Description: Seed data for debt repayment application
-- Date: 2024-01-01

-- Insert sample branches
INSERT INTO public.branches (name, code, address, phone, email) VALUES
('Main Branch', 'MB001', '123 Main Street, Downtown, City', '+1-555-0101', 'main@company.com'),
('North Branch', 'NB001', '456 North Avenue, North District, City', '+1-555-0102', 'north@company.com'),
('South Branch', 'SB001', '789 South Boulevard, South District, City', '+1-555-0103', 'south@company.com'),
('East Branch', 'EB001', '321 East Road, East District, City', '+1-555-0104', 'east@company.com'),
('West Branch', 'WB001', '654 West Street, West District, City', '+1-555-0105', 'west@company.com');

-- Insert sample bank accounts
INSERT INTO public.bank_accounts (account_number, account_name, bank_name, branch_id) VALUES
('1234567890', 'Main Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'MB001')),
('0987654321', 'North Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'NB001')),
('1122334455', 'South Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'SB001')),
('5566778899', 'East Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'EB001')),
('9988776655', 'West Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'WB001'));

-- Insert sample customers
INSERT INTO public.customers (customer_code, full_name, phone, email, address, branch_id) VALUES
('CUST20240001', 'John Smith', '+1-555-1001', 'john.smith@email.com', '123 Oak Street, City', (SELECT id FROM public.branches WHERE code = 'MB001')),
('CUST20240002', 'Jane Doe', '+1-555-1002', 'jane.doe@email.com', '456 Pine Avenue, City', (SELECT id FROM public.branches WHERE code = 'MB001')),
('CUST20240003', 'Bob Johnson', '+1-555-1003', 'bob.johnson@email.com', '789 Elm Road, City', (SELECT id FROM public.branches WHERE code = 'NB001')),
('CUST20240004', 'Alice Brown', '+1-555-1004', 'alice.brown@email.com', '321 Maple Drive, City', (SELECT id FROM public.branches WHERE code = 'NB001')),
('CUST20240005', 'Charlie Wilson', '+1-555-1005', 'charlie.wilson@email.com', '654 Cedar Lane, City', (SELECT id FROM public.branches WHERE code = 'SB001')),
('CUST20240006', 'Diana Davis', '+1-555-1006', 'diana.davis@email.com', '987 Birch Way, City', (SELECT id FROM public.branches WHERE code = 'SB001')),
('CUST20240007', 'Edward Miller', '+1-555-1007', 'edward.miller@email.com', '147 Spruce Court, City', (SELECT id FROM public.branches WHERE code = 'EB001')),
('CUST20240008', 'Fiona Garcia', '+1-555-1008', 'fiona.garcia@email.com', '258 Willow Place, City', (SELECT id FROM public.branches WHERE code = 'EB001')),
('CUST20240009', 'George Martinez', '+1-555-1009', 'george.martinez@email.com', '369 Aspen Circle, City', (SELECT id FROM public.branches WHERE code = 'WB001')),
('CUST20240010', 'Helen Rodriguez', '+1-555-1010', 'helen.rodriguez@email.com', '741 Poplar Square, City', (SELECT id FROM public.branches WHERE code = 'WB001'));

-- Note: Users will be created through the authentication system
-- Sample transactions will be created when users interact with the system 