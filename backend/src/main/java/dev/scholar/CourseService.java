package dev.scholar;

import static dev.scholar.ApiModels.*;

import jakarta.validation.Validator;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CourseService {
  private final CourseRepository courses;
  private final StudentRepository students;
  private final Validator validator;

  public CourseService(CourseRepository courses, StudentRepository students, Validator validator) {
    this.courses = courses;
    this.students = students;
    this.validator = validator;
  }

  public List<CourseView> list() {
    return courses.findAll().stream().map(CourseView::from).toList();
  }

  public CourseView get(String id) {
    return CourseView.from(require(id));
  }

  @Transactional
  public CourseView create(CourseInput input) {
    Course course = new Course();
    course.id = UUID.randomUUID().toString();
    return save(course, input);
  }

  @Transactional
  public CourseView update(String id, CourseInput input) {
    return save(require(id), input);
  }

  @Transactional
  public void delete(String id) {
    Course course = require(id);
    students
        .findByCourses_Id(id)
        .forEach(student -> student.courses.removeIf(enrolled -> enrolled.id.equals(id)));
    // Flush owning-side join-table removals before deleting the referenced course.
    students.flush();
    courses.delete(course);
  }

  @Transactional
  public ImportResult importCatalog(List<CourseView> catalog) {
    Set<String> seen = new HashSet<>();
    for (CourseView remote : catalog) {
      if (remote == null || !validator.validate(remote.input()).isEmpty())
        throw new ApiException(
            HttpStatus.BAD_GATEWAY,
            "The course catalog contains invalid data. No changes were imported.");
      CourseInput input = remote.input();
      String code = input.code().toUpperCase(Locale.ROOT);
      if (!seen.add(code))
        throw new ApiException(
            HttpStatus.BAD_GATEWAY,
            "The course catalog contains duplicate codes. No changes were imported.");
      Course course =
          courses
              .findByCodeIgnoreCase(code)
              .orElseGet(
                  () -> {
                    Course created = new Course();
                    created.id = UUID.randomUUID().toString();
                    return created;
                  });
      save(course, input);
    }
    return new ImportResult(catalog.size());
  }

  private CourseView save(Course course, CourseInput input) {
    String code = input.code().trim().toUpperCase(Locale.ROOT);
    courses
        .findByCodeIgnoreCase(code)
        .filter(existing -> !existing.id.equals(course.id))
        .ifPresent(
            existing -> {
              throw new ApiException(
                  HttpStatus.CONFLICT, "A course with this code already exists.");
            });
    course.code = code;
    course.title = input.title().trim();
    course.instructor = input.instructor().trim();
    course.credits = input.credits();
    course.description = input.description() == null ? "" : input.description().trim();
    return CourseView.from(courses.save(course));
  }

  private Course require(String id) {
    return courses
        .findById(id)
        .orElseThrow(
            () -> new ApiException(HttpStatus.NOT_FOUND, "This course could not be found."));
  }
}
