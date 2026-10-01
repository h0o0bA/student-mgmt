package dev.scholar;

import static dev.scholar.ApiModels.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {
  @Mock StudentRepository students;
  @Mock CourseRepository courses;
  @InjectMocks StudentService service;

  StudentInput input(List<String> ids) {
    return new StudentInput(" Ada ", " Lovelace ", "ADA@example.com", "Active", ids);
  }

  @Test
  void normalizesValuesAndEnrollsInMultipleCourses() {
    Course first = new Course();
    first.id = "c1";
    Course second = new Course();
    second.id = "c2";
    when(courses.findAllById(any())).thenReturn(List.of(first, second));
    when(students.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    StudentView result = service.create(input(List.of("c1", "c2", "c1")));
    assertThat(result.firstName()).isEqualTo("Ada");
    assertThat(result.email()).isEqualTo("ada@example.com");
    assertThat(result.courseIds()).containsExactly("c1", "c2");
    assertThat(result.id()).isNotBlank();
  }

  @Test
  void rejectsDuplicateEmailBeforeWriting() {
    Student existing = new Student();
    existing.id = "other";
    when(students.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existing));
    assertThatThrownBy(() -> service.create(input(List.of())))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("email already exists");
    verify(students, never()).save(any());
  }

  @Test
  void rejectsMissingCoursesWithoutSaving() {
    when(courses.findAllById(any())).thenReturn(List.of());
    assertThatThrownBy(() -> service.create(input(List.of("missing"))))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("no longer exist");
    verify(students, never()).save(any());
  }

  @Test
  void reportsMissingStudent() {
    assertThatThrownBy(() -> service.get("missing"))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("could not be found");
  }

  @Test
  void updatesOwnEmailAndReplacesEnrollments() {
    Student student = new Student();
    student.id = "s1";
    student.email = "ada@example.com";
    Course old = new Course();
    old.id = "c1";
    student.courses.add(old);
    when(students.findById("s1")).thenReturn(Optional.of(student));
    when(students.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(student));
    when(students.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    assertThat(service.update("s1", input(List.of())).courseIds()).isEmpty();
  }
}
