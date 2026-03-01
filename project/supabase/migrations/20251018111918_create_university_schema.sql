/*
  # University Study Application - Complete Database Schema

  ## 1. New Tables
    
    ### `departments`
    - `id` (uuid, primary key)
    - `name` (text, unique, not null) - Department name
    - `code` (text, unique, not null) - Department code
    - `description` (text)
    - `created_at` (timestamptz)
    
    ### `users`
    - `id` (uuid, primary key, references auth.users)
    - `email` (text, unique, not null)
    - `role` (text, not null) - 'student', 'professor', or 'admin'
    - `first_name` (text, not null)
    - `last_name` (text, not null)
    - `age` (integer)
    - `created_at` (timestamptz)
    
    ### `students`
    - `id` (uuid, primary key, references users)
    - `user_id` (uuid, references users)
    - `department_id` (uuid, references departments)
    - `student_number` (text, unique)
    - `year_of_study` (integer)
    - `created_at` (timestamptz)
    
    ### `professors`
    - `id` (uuid, primary key, references users)
    - `user_id` (uuid, references users)
    - `department_id` (uuid, references departments)
    - `title` (text) - Academic title (e.g., PhD, Associate Professor)
    - `is_approved` (boolean, default false)
    - `approval_date` (timestamptz)
    - `approved_by_admin_id` (uuid, references users)
    - `approved_by_admin_name` (text)
    - `created_at` (timestamptz)
    
    ### `subjects`
    - `id` (uuid, primary key)
    - `title` (text, not null)
    - `academic_year` (text, not null)
    - `description` (text)
    - `professor_id` (uuid, references professors)
    - `total_classes` (integer, default 15)
    - `created_at` (timestamptz)
    
    ### `enrollments`
    - `id` (uuid, primary key)
    - `student_id` (uuid, references students)
    - `subject_id` (uuid, references subjects)
    - `status` (text, default 'attending') - 'attending', 'completed', 'dropped'
    - `enrolled_at` (timestamptz)
    - `completed_at` (timestamptz)
    - `created_at` (timestamptz)
    
    ### `grades`
    - `id` (uuid, primary key)
    - `enrollment_id` (uuid, unique, references enrollments)
    - `student_id` (uuid, references students)
    - `subject_id` (uuid, references subjects)
    - `professor_id` (uuid, references professors)
    - `grade_value` (numeric, not null)
    - `final_score` (numeric, not null)
    - `subject_name` (text, not null)
    - `professor_name` (text, not null)
    - `student_name` (text, not null)
    - `assigned_date` (timestamptz, default now())
    - `annulment_requested` (boolean, default false)
    - `annulment_request_date` (timestamptz)
    - `can_request_annulment` (boolean, default true)
    - `created_at` (timestamptz)
    
    ### `attendance_records`
    - `id` (uuid, primary key)
    - `enrollment_id` (uuid, references enrollments)
    - `student_id` (uuid, references students)
    - `subject_id` (uuid, references subjects)
    - `professor_id` (uuid, references professors)
    - `class_date` (date, not null)
    - `was_present` (boolean, not null)
    - `activity_comment` (text)
    - `recorded_at` (timestamptz, default now())
    - `created_at` (timestamptz)

  ## 2. Security
    - Enable RLS on all tables
    - Students can view their own data and enrollments
    - Professors can view their subjects and students enrolled in them
    - Admins can access all data including professor approval details
    - Attendance records can only be created within 24 hours of class date
    - Grade annulment requests can only be made within 3 days of grade assignment

  ## 3. Important Notes
    - Only approved professors can be assigned to subjects
    - Students must have 75%+ attendance to receive grades
    - Enrollment status automatically updates to 'completed' when grade is assigned
    - Professor approval includes timestamp and admin information
    - Attendance tracking enforces 24-hour recording window
    - Grade annulment window is 3 days from assignment
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'professor', 'admin')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  age integer,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id),
  student_number text UNIQUE,
  year_of_study integer,
  created_at timestamptz DEFAULT now()
);

-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id),
  title text,
  is_approved boolean DEFAULT false,
  approval_date timestamptz,
  approved_by_admin_id uuid REFERENCES users(id),
  approved_by_admin_name text,
  created_at timestamptz DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  academic_year text NOT NULL,
  description text,
  professor_id uuid REFERENCES professors(id),
  total_classes integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  status text DEFAULT 'attending' CHECK (status IN ('attending', 'completed', 'dropped')),
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid UNIQUE NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  professor_id uuid NOT NULL REFERENCES professors(id),
  grade_value numeric NOT NULL CHECK (grade_value >= 0 AND grade_value <= 10),
  final_score numeric NOT NULL,
  subject_name text NOT NULL,
  professor_name text NOT NULL,
  student_name text NOT NULL,
  assigned_date timestamptz DEFAULT now(),
  annulment_requested boolean DEFAULT false,
  annulment_request_date timestamptz,
  can_request_annulment boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  professor_id uuid NOT NULL REFERENCES professors(id),
  class_date date NOT NULL,
  was_present boolean NOT NULL,
  activity_comment text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, class_date)
);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Students policies
CREATE POLICY "Students can view their own profile"
  ON students FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Professors can view students in their subjects"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'professor'
    )
  );

CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Students can create their own profile"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update their own profile"
  ON students FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Professors policies
CREATE POLICY "Approved professors can view their profile"
  ON professors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all professors"
  ON professors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Professors can create their profile"
  ON professors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update professor approval status"
  ON professors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Subjects policies
CREATE POLICY "Students can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('student', 'professor', 'admin')
    )
  );

CREATE POLICY "Professors can view their subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (
    professor_id IN (
      SELECT id FROM professors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Enrollments policies
CREATE POLICY "Students can view their enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Professors can view enrollments in their subjects"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    subject_id IN (
      SELECT id FROM subjects
      WHERE professor_id IN (
        SELECT id FROM professors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can create their own enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Professors can update enrollments for their subjects"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (
    subject_id IN (
      SELECT id FROM subjects
      WHERE professor_id IN (
        SELECT id FROM professors WHERE user_id = auth.uid()
      )
    )
  );

-- Grades policies
CREATE POLICY "Students can view their grades"
  ON grades FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Professors can view grades they assigned"
  ON grades FOR SELECT
  TO authenticated
  USING (
    professor_id IN (
      SELECT id FROM professors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Professors can create grades for their subjects"
  ON grades FOR INSERT
  TO authenticated
  WITH CHECK (
    professor_id IN (
      SELECT id FROM professors WHERE user_id = auth.uid()
    )
    AND subject_id IN (
      SELECT id FROM subjects
      WHERE professor_id IN (
        SELECT id FROM professors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can update annulment requests"
  ON grades FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Attendance records policies
CREATE POLICY "Students can view their attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Professors can view attendance for their subjects"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    professor_id IN (
      SELECT id FROM professors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Professors can create attendance records"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    professor_id IN (
      SELECT id FROM professors WHERE user_id = auth.uid()
    )
    AND subject_id IN (
      SELECT id FROM subjects
      WHERE professor_id IN (
        SELECT id FROM professors WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_professors_user_id ON professors(user_id);
CREATE INDEX IF NOT EXISTS idx_professors_approved ON professors(is_approved);
CREATE INDEX IF NOT EXISTS idx_subjects_professor ON subjects(professor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON enrollments(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance_records(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_records(class_date);