# School Database Design

## Overview

This database stores students, courses, and enrolments. The three main entities are a **student**, a **course**, and the fact that a student is **enrolled on a course**, including the student's grade.

## Tables

### Students

The `students` table stores each student's ID, name, and email address. The student ID is the primary key, and the email is required and unique so that two students cannot share the same email address.

### Courses

The `courses` table stores each course's ID, name, and code. The course ID is the primary key, and the course code is unique to identify each course.

### Enrolments

The `enrolments` table records which student takes which course and the grade received. Its primary key is `enrolment_id`. The `student_id` and `course_id` columns are foreign keys referencing the `students` and `courses` tables. The grade belongs here because it can differ for each student-course combination.

## Relationships

- **One-to-many:** One student can have many enrolment records, but each enrolment belongs to one student.
- **One-to-many:** One course can have many enrolment records, but each enrolment refers to one course.
- **Many-to-many:** Students can take many courses, and each course can have many students.

The many-to-many relationship is implemented with the `enrolments` join table. A direct relationship between students and courses would not conveniently represent multiple courses per student and multiple students per course. The join table also stores the grade for each specific enrolment. A `UNIQUE (student_id, course_id)` constraint prevents duplicate enrolments.

## Index

I would add an index on `enrolments(course_id)` to speed up queries that list students on a particular course and count enrolments by course. The unique constraint on `(student_id, course_id)` already creates an index in SQLite that helps searches using the leading `student_id` column.

Example:

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
```

## SQL or NoSQL?

I would choose a relational SQL database for this school system. Students, courses, and enrolments have clear relationships, and enrolments must reference valid students and courses. SQL provides foreign keys, uniqueness constraints, joins, and transactions to protect data integrity. Queries such as listing courses per student or counting students per course are also natural to express with SQL. A NoSQL database could work, but it would require more application-level handling of these relationships and constraints.
