package dev.scholar;

import static dev.scholar.ApiModels.*;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class CatalogClient {
  private final RestTemplate restTemplate;
  private final String url;

  public CatalogClient(RestTemplate restTemplate, @Value("${app.catalog-url}") String url) {
    this.restTemplate = restTemplate;
    this.url = url;
  }

  public List<CourseView> fetchCourses() {
    if (url == null || url.isBlank()) {
      throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "The course catalog import is not configured. Set CATALOG_API_URL to a JSON Server"
              + " catalog endpoint.");
    }
    try {
      CourseView[] courses = restTemplate.getForObject(url, CourseView[].class);
      if (courses == null)
        throw new ApiException(
            HttpStatus.BAD_GATEWAY, "The course catalog returned an empty response.");
      return Arrays.asList(courses);
    } catch (RestClientException error) {
      throw new ApiException(
          HttpStatus.BAD_GATEWAY,
          "Cannot reach the course catalog. Check the JSON Server catalog URL and try again.");
    }
  }
}
