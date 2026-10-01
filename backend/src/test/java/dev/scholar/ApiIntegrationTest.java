package dev.scholar;

import static dev.scholar.ApiModels.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired StudentRepository students;
  @Autowired CourseRepository courses;
  @Autowired StudentService studentService;
  @Autowired CourseService courseService;
  @Autowired RestTemplate restTemplate;
  MockRestServiceServer upstream;

  @BeforeEach
  void clean() {
    students.deleteAll();
    courses.deleteAll();
    upstream = MockRestServiceServer.bindTo(restTemplate).build();
  }

  CourseInput courseInput(String code) {
    return new CourseInput(code, "Computing", "Dr. Chen", 3, "Intro");
  }

  StudentInput studentInput(List<String> ids) {
    return new StudentInput("Ada", "Lovelace", "ada@example.com", "Active", ids);
  }

  @Test
  void studentCrudReturnsExpectedStatusesAndPersists() throws Exception {
    String created =
        mvc.perform(
                post("/api/students")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(studentInput(List.of()))))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String id = mapper.readTree(created).get("id").asText();
    mvc.perform(get("/api/students/" + id))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.firstName").value("Ada"));
    StudentInput update =
        new StudentInput("Grace", "Hopper", "grace@example.com", "Inactive", List.of());
    mvc.perform(
            put("/api/students/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("Inactive"));
    assertThat(studentService.get(id).firstName()).isEqualTo("Grace");
    mvc.perform(delete("/api/students/" + id)).andExpect(status().isNoContent());
    mvc.perform(get("/api/students/" + id)).andExpect(status().isNotFound());
  }

  @Test
  void courseCrudNormalizesCodeAndRejectsDuplicates() throws Exception {
    String created =
        mvc.perform(
                post("/api/courses")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(courseInput("cs101"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.code").value("CS101"))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String id = mapper.readTree(created).get("id").asText();
    mvc.perform(
            post("/api/courses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(courseInput("CS101"))))
        .andExpect(status().isConflict());
    mvc.perform(
            put("/api/courses/" + id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(courseInput("CS102"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("CS102"));
    mvc.perform(get("/api/courses/" + id)).andExpect(status().isOk());
    mvc.perform(delete("/api/courses/" + id)).andExpect(status().isNoContent());
    assertThat(courses.count()).isZero();
  }

  @Test
  void validationAndMalformedBodiesReturn400() throws Exception {
    mvc.perform(
            post("/api/students")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"\",\"email\":\"bad\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fieldErrors.firstName").exists())
        .andExpect(jsonPath("$.fieldErrors.email").exists());
    mvc.perform(
            post("/api/courses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"code\":\"CS1\",\"title\":\"Test\",\"instructor\":\"Test\",\"credits\":2.5}"))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/students").contentType(MediaType.APPLICATION_JSON).content("not-json"))
        .andExpect(status().isBadRequest());
    assertThat(students.count()).isZero();
    assertThat(courses.count()).isZero();
  }

  @Test
  void duplicateEmailAndMissingCoursesAreRejected() throws Exception {
    studentService.create(studentInput(List.of()));
    StudentInput duplicate =
        new StudentInput("Ada", "Test", "ADA@EXAMPLE.COM", "Active", List.of());
    mvc.perform(
            post("/api/students")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(duplicate)))
        .andExpect(status().isConflict());
    StudentInput invalid =
        new StudentInput("Ada", "Test", "other@example.com", "Active", List.of("missing"));
    mvc.perform(
            post("/api/students")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(invalid)))
        .andExpect(status().isBadRequest());
    assertThat(students.count()).isEqualTo(1);
  }

  @Test
  void courseDeletionCleansEnrollmentsAndKeepsStudents() {
    CourseView first = courseService.create(courseInput("CS101"));
    CourseView second = courseService.create(courseInput("CS102"));
    StudentView student = studentService.create(studentInput(List.of(first.id(), second.id())));
    courseService.delete(first.id());
    assertThat(studentService.get(student.id()).courseIds()).containsExactly(second.id());
    assertThat(students.count()).isEqualTo(1);
    assertThat(courses.count()).isEqualTo(1);
  }

  @Test
  void studentDeletionKeepsEnrolledCourses() {
    CourseView course = courseService.create(courseInput("CS101"));
    StudentView student = studentService.create(studentInput(List.of(course.id())));
    studentService.delete(student.id());
    assertThat(courses.count()).isEqualTo(1);
    assertThat(students.count()).isZero();
  }

  @Test
  void failedEnrollmentUpdatePreservesOriginalStudent() {
    CourseView course = courseService.create(courseInput("CS101"));
    StudentView student = studentService.create(studentInput(List.of(course.id())));
    assertThatThrownBy(
            () ->
                studentService.update(
                    student.id(),
                    new StudentInput(
                        "Changed", "Name", "changed@example.com", "Inactive", List.of("missing"))))
        .isInstanceOf(ApiException.class);
    assertThat(studentService.get(student.id())).isEqualTo(student);
  }

  @Test
  void importRollsBackEarlierWritesIfALaterCourseIsInvalid() {
    // No test-level transaction: the service proxy must roll back its own database transaction.
    CourseView original = courseService.create(courseInput("EXISTING"));
    List<CourseView> catalog =
        List.of(
            new CourseView("remote1", "EXISTING", "Changed title", "Teacher", 3, ""),
            new CourseView("remote2", "NEW101", "New course", "Teacher", 3, ""),
            new CourseView("remote3", "BAD101", "Invalid course", "Teacher", 9, ""));
    assertThatThrownBy(() -> courseService.importCatalog(catalog)).isInstanceOf(ApiException.class);
    assertThat(courses.count()).isEqualTo(1);
    assertThat(courseService.get(original.id()).title()).isEqualTo("Computing");
    assertThat(courses.findByCodeIgnoreCase("NEW101")).isEmpty();
  }

  @Test
  void importThroughRestTemplateUpsertsWithoutBreakingEnrollments() throws Exception {
    CourseView existing = courseService.create(courseInput("CS101"));
    StudentView student = studentService.create(studentInput(List.of(existing.id())));
    upstream
        .expect(requestTo("http://catalog.test/api/courses"))
        .andRespond(
            withSuccess(
                """
                [{"id":"remote","code":"CS101","title":"Updated from catalog","instructor":"Dr. Test","credits":4,"description":"Updated"}]
                """,
                MediaType.APPLICATION_JSON));
    mvc.perform(post("/api/courses/import"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.imported").value(1));
    assertThat(courseService.get(existing.id()).title()).isEqualTo("Updated from catalog");
    assertThat(studentService.get(student.id()).courseIds()).containsExactly(existing.id());
    upstream.verify();
  }

  @Test
  void missingResourcesReturn404AndHealthIsAvailable() throws Exception {
    mvc.perform(get("/api/students/missing")).andExpect(status().isNotFound());
    mvc.perform(delete("/api/courses/missing")).andExpect(status().isNotFound());
    mvc.perform(get("/api/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
  }
}
