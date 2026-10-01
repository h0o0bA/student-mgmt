package dev.scholar;

import static dev.scholar.ApiModels.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
  private final CourseService service;
  private final CatalogClient catalog;

  public CourseController(CourseService service, CatalogClient catalog) {
    this.service = service;
    this.catalog = catalog;
  }

  @GetMapping
  public List<CourseView> list() {
    return service.list();
  }

  @GetMapping("/{id}")
  public CourseView get(@PathVariable String id) {
    return service.get(id);
  }

  @PostMapping
  public ResponseEntity<CourseView> create(@Valid @RequestBody CourseInput input) {
    CourseView result = service.create(input);
    return ResponseEntity.created(URI.create("/api/courses/" + result.id())).body(result);
  }

  @PutMapping("/{id}")
  public CourseView update(@PathVariable String id, @Valid @RequestBody CourseInput input) {
    return service.update(id, input);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    service.delete(id);
  }

  @PostMapping("/import")
  public ImportResult importCatalog() {
    return service.importCatalog(catalog.fetchCourses());
  }
}
