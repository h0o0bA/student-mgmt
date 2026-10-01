package dev.scholar;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class CatalogClientTest {
  MockRestServiceServer server;
  CatalogClient client;

  @BeforeEach
  void setup() {
    RestTemplate template = new RestTemplate();
    server = MockRestServiceServer.bindTo(template).build();
    client = new CatalogClient(template, "http://catalog.test/api/courses");
  }

  @Test
  void readsCoursesWithRestTemplate() {
    server
        .expect(requestTo("http://catalog.test/api/courses"))
        .andRespond(
            withSuccess(
                """
                [{"id":"c1","code":"CS101","title":"Computing","instructor":"Dr. Chen","credits":3,"description":"Intro"}]
                """,
                MediaType.APPLICATION_JSON));
    assertThat(client.fetchCourses())
        .hasSize(1)
        .first()
        .extracting(ApiModels.CourseView::code)
        .isEqualTo("CS101");
    server.verify();
  }

  @Test
  void convertsUpstreamFailureToBadGateway() {
    server.expect(requestTo("http://catalog.test/api/courses")).andRespond(withServerError());
    assertThatThrownBy(client::fetchCourses)
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("Cannot reach the course catalog");
    server.verify();
  }

  @Test
  void reportsUnconfiguredDeploymentCatalogWithoutMakingAnHttpRequest() {
    CatalogClient unconfigured = new CatalogClient(new RestTemplate(), "");
    assertThatThrownBy(unconfigured::fetchCourses)
        .isInstanceOfSatisfying(
            ApiException.class, error -> assertThat(error.status.value()).isEqualTo(503))
        .hasMessageContaining("CATALOG_API_URL");
  }

  @Test
  void rejectsMalformedUpstreamJson() {
    server
        .expect(requestTo("http://catalog.test/api/courses"))
        .andRespond(withSuccess("not-json", MediaType.APPLICATION_JSON));
    assertThatThrownBy(client::fetchCourses).isInstanceOf(ApiException.class);
    server.verify();
  }
}
