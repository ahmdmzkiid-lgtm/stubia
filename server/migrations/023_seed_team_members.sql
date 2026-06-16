-- Seed initial team members
INSERT INTO team_members (name, role, display_order)
VALUES 
  ('Kak Z', 'Founder & Lead Mentor', 1),
  ('Barih', 'Lead Developer', 2),
  ('Eduzet Team', 'Support Specialist', 3)
ON CONFLICT DO NOTHING;
