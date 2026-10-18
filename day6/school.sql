-- Day 6 Assignment: School Database
PRAGMA foreign_keys = ON;

-- Remove existing tables so the script can be run again.
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. Create students table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 2. Create courses table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    course_code TEXT NOT NULL UNIQUE
);

-- 3. Create enrolments table
-- This join table implements the many-to-many relationship.
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);

-- Insert at least 3 students
INSERT INTO students (student_id, name, email) VALUES
    (1, 'Amina Hassan', 'amina@example.com'),
    (2, 'Brian Otieno', 'brian@example.com'),
    (3, 'Chao Mwangi', 'chao@example.com'),
    (4, 'Diana Wanjiku', 'diana@example.com');

-- Insert at least 3 courses
INSERT INTO courses (course_id, course_name, course_code) VALUES
    (1, 'Database Fundamentals', 'DB101'),
    (2, 'Web Development', 'WEB101'),
    (3, 'Programming Basics', 'PRG101');

-- Insert at least 5 enrolments
INSERT INTO enrolments (enrolment_id, student_id, course_id, grade) VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'B'),
    (4, 2, 3, 'A'),
    (5, 3, 2, 'A'),
    (6, 4, 3, NULL);

-- QUERY 1: All courses taken by one student, searched by name
SELECT
    students.name AS student_name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE students.name = 'Amina Hassan';

-- QUERY 2: All students enrolled on one course
SELECT
    students.name AS student_name,
    students.email,
    courses.course_name
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE courses.course_name = 'Web Development';

-- QUERY 3: Number of students enrolled per course, including courses with zero enrolments
SELECT
    courses.course_name,
    COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name
ORDER BY courses.course_name;

-- QUERY 4: Students who have no enrolments
SELECT
    students.student_id,
    students.name,
    students.email
FROM students
LEFT JOIN enrolments ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;

-- QUERY 5: Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE enrolment_id = 3;

-- Verify the updated grade
SELECT
    students.name AS student_name,
    courses.course_name,
    enrolments.grade
FROM enrolments
JOIN students ON enrolments.student_id = students.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE enrolments.enrolment_id = 3;
