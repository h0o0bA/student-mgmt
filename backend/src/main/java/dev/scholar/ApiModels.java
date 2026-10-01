package dev.scholar;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class ApiModels {
  private ApiModels() {}

  public record StudentInput(
      @NotBlank @Size(max = 60) String firstName,
      @NotBlank @Size(max = 60) String lastName,
      @NotBlank @Email @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") @Size(max = 254)
          String email,
      @NotNull @Pattern(regexp = "Active|Inactive") String status,
      @NotNull List<@NotBlank String> courseIds) {}

  public record CourseInput(
      @NotBlank @Size(max = 20) @Pattern(regexp = "[A-Za-z0-9-]+") String code,
      @NotBlank @Size(max = 120) String title,
      @NotBlank @Size(max = 100) String instructor,
      @NotNull @Min(1) @Max(6) Integer credits,
      @Size(max = 1000) String description) {}

  public record StudentView(
      String id,
      String firstName,
      String lastName,
      String email,
      String status,
      List<String> courseIds) {
    static StudentView from(Student student) {
      return new StudentView(
          student.id,
          student.firstName,
          student.lastName,
          student.email,
          student.status,
          student.courses.stream().map(course -> course.id).sorted().toList());
    }
  }

  public record CourseView(
      String id,
      String code,
      String title,
      String instructor,
      Integer credits,
      String description) {
    static CourseView from(Course course) {
      return new CourseView(
          course.id,
          course.code,
          course.title,
          course.instructor,
          course.credits,
          course.description);
    }

    CourseInput input() {
      return new CourseInput(code, title, instructor, credits, description);
    }
  }

  public record ApiError(
      int status, String message, Map<String, String> fieldErrors, Instant timestamp) {}

  public record ImportResult(int imported) {}
}
