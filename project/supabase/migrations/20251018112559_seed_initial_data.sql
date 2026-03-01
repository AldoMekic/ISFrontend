/*
  # Seed Initial Data

  ## Creates sample data for testing:
    - Departments (Computer Science, Mathematics, Physics)
    - Admin user account
*/

-- Insert departments
INSERT INTO departments (name, code, description)
VALUES
  ('Computer Science', 'CS', 'Department of Computer Science and Software Engineering'),
  ('Mathematics', 'MATH', 'Department of Mathematics and Statistics'),
  ('Physics', 'PHYS', 'Department of Physics and Astronomy'),
  ('Engineering', 'ENG', 'Department of Engineering')
ON CONFLICT (code) DO NOTHING;
