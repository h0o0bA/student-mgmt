package dev.scholar;

import static dev.scholar.ApiModels.*;
import static org.assertj.core.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

// Use a dedicated empty test database: these tests remove all application records.
@SpringBootTest
@ActiveProfiles("vercel")
@EnabledIfEnvironmentVariable(named = "TEST_POSTGRES", matches = "true")
class PostgresDeploymentTest {
  @Autowired StudentRepository students;
  @Autowired CourseRepository courses;
  @Autowired StudentService studentService;
  @Autowired CourseService courseService;
  @Autowired JdbcTemplate jdbc;
  @Autowired Environment environment;

  @BeforeEach
  void clean() {
    students.deleteAll();
    courses.deleteAll();
  }

  @Test
  void usesPostgresMigrationsAndTheDeploymentProfile() {
    assertThat(jdbc.queryForObject("select version()", String.class)).contains("PostgreSQL");
    assertThat(
            jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '1' and success",
                Integer.class))
        .isEqualTo(1);
    assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
    assertThat(environment.getProperty("server.address")).isEqualTo("0.0.0.0");
    assertThat(environment.getProperty("app.seed")).isEqualTo("false");
  }

  @Test
  void supportsCrudAndTransactionalEnrollmentCleanupOnPostgres() {
    CourseView first =
        courseService.create(new CourseInput("CS101", "Computing", "Dr. Chen", 3, ""));
    CourseView second =
        courseService.create(new CourseInput("CS102", "Algorithms", "Dr. Chen", 4, ""));
    StudentView student =
        studentService.create(
            new StudentInput(
                "Ada", "Lovelace", "ada@example.com", "Active", List.of(first.id(), second.id())));
    assertThat(studentService.list())
        .singleElement()
        .satisfies(
            saved -> {
              assertThat(saved.id()).isEqualTo(student.id());
              assertThat(saved.courseIds()).containsExactlyInAnyOrder(first.id(), second.id());
            });
    studentService.update(
        student.id(),
        new StudentInput(
            "Ada", "Updated", "ada@example.com", "Inactive", List.of(first.id(), second.id())));
    courseService.delete(first.id());
    assertThat(studentService.get(student.id()).courseIds()).containsExactly(second.id());
    assertThat(studentService.get(student.id()).lastName()).isEqualTo("Updated");
    studentService.delete(student.id());
    assertThat(courses.count()).isEqualTo(1);
  }

  @Test
  void importRollsBackBothAnUpdateAndAnInsertOnPostgres() {
    CourseView existing =
        courseService.create(new CourseInput("CS101", "Original", "Teacher", 3, ""));
    assertThatThrownBy(
            () ->
                courseService.importCatalog(
                    List.of(
                        new CourseView("a", "CS101", "Changed", "Teacher", 3, ""),
                        new CourseView("b", "NEW101", "New", "Teacher", 3, ""),
                        new CourseView("c", "BAD101", "Invalid", "Teacher", 7, ""))))
        .isInstanceOf(ApiException.class);
    assertThat(courses.count()).isEqualTo(1);
    assertThat(courseService.get(existing.id()).title()).isEqualTo("Original");
  }
}
