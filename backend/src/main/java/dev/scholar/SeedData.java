package dev.scholar;

import static dev.scholar.ApiModels.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.seed", havingValue = "true")
public class SeedData implements CommandLineRunner {
  private final StudentRepository students;
  private final CourseRepository courses;
  private final ObjectMapper mapper;

  public SeedData(StudentRepository students, CourseRepository courses, ObjectMapper mapper) {
    this.students = students;
    this.courses = courses;
    this.mapper = mapper;
  }

  record Seed(List<StudentView> students, List<CourseView> courses) {}

  @Override
  @Transactional
  public void run(String... args) throws Exception {
    if (students.count() != 0 || courses.count() != 0) return;
    try (var input = new ClassPathResource("seed.json").getInputStream()) {
      Seed seed = mapper.readValue(input, Seed.class);
      for (CourseView row : seed.courses()) {
        Course course = new Course();
        course.id = row.id();
        course.code = row.code();
        course.title = row.title();
        course.instructor = row.instructor();
        course.credits = row.credits();
        course.description = row.description();
        courses.save(course);
      }
      for (StudentView row : seed.students()) {
        Student student = new Student();
        student.id = row.id();
        student.firstName = row.firstName();
        student.lastName = row.lastName();
        student.email = row.email();
        student.status = row.status();
        student.courses.addAll(courses.findAllById(row.courseIds()));
        students.save(student);
      }
    }
  }
}
