CREATE TABLE courses (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL CHECK (credits BETWEEN 1 AND 6),
    description VARCHAR(1000) NOT NULL
);

CREATE TABLE students (
    id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    status VARCHAR(255) NOT NULL CHECK (status IN ('Active', 'Inactive'))
);

CREATE TABLE enrollments (
    student_id VARCHAR(255) NOT NULL REFERENCES students(id),
    course_id VARCHAR(255) NOT NULL REFERENCES courses(id),
    PRIMARY KEY (student_id, course_id)
);

CREATE INDEX enrollments_course_id_idx ON enrollments(course_id);
