package dev.scholar;

import static dev.scholar.ApiModels.*;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StudentService {
  private final StudentRepository students;
  private final CourseRepository courses;

  public StudentService(StudentRepository students, CourseRepository courses) {
    this.students = students;
    this.courses = courses;
  }

  public List<StudentView> list() {
    return students.findAll().stream().map(StudentView::from).toList();
  }

  public StudentView get(String id) {
    return StudentView.from(require(id));
  }

  @Transactional
  public StudentView create(StudentInput input) {
    Student student = new Student();
    student.id = UUID.randomUUID().toString();
    return save(student, input);
  }

  @Transactional
  public StudentView update(String id, StudentInput input) {
    return save(require(id), input);
  }

  @Transactional
  public void delete(String id) {
    students.delete(require(id));
  }

  private StudentView save(Student student, StudentInput input) {
    String email = input.email().trim().toLowerCase(Locale.ROOT);
    students
        .findByEmailIgnoreCase(email)
        .filter(existing -> !existing.id.equals(student.id))
        .ifPresent(
            existing -> {
              throw new ApiException(
                  HttpStatus.CONFLICT, "A student with this email already exists.");
            });
    Set<String> ids = new LinkedHashSet<>(input.courseIds());
    List<Course> enrolled = courses.findAllById(ids);
    if (enrolled.size() != ids.size())
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "One or more selected courses no longer exist. Refresh the catalog and try again.");
    student.firstName = input.firstName().trim();
    student.lastName = input.lastName().trim();
    student.email = email;
    student.status = input.status();
    student.courses.clear();
    student.courses.addAll(enrolled);
    return StudentView.from(students.save(student));
  }

  private Student require(String id) {
    return students
        .findById(id)
        .orElseThrow(
            () -> new ApiException(HttpStatus.NOT_FOUND, "This student could not be found."));
  }
}
