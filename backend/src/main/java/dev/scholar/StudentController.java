package dev.scholar;

import static dev.scholar.ApiModels.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
public class StudentController {
  private final StudentService service;

  public StudentController(StudentService service) {
    this.service = service;
  }

  @GetMapping
  public List<StudentView> list() {
    return service.list();
  }

  @GetMapping("/{id}")
  public StudentView get(@PathVariable String id) {
    return service.get(id);
  }

  @PostMapping
  public ResponseEntity<StudentView> create(@Valid @RequestBody StudentInput input) {
    StudentView result = service.create(input);
    return ResponseEntity.created(URI.create("/api/students/" + result.id())).body(result);
  }

  @PutMapping("/{id}")
  public StudentView update(@PathVariable String id, @Valid @RequestBody StudentInput input) {
    return service.update(id, input);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    service.delete(id);
  }
}
