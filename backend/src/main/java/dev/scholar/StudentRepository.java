package dev.scholar;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, String> {
  @Override
  @EntityGraph(attributePaths = "courses")
  List<Student> findAll();

  @Override
  @EntityGraph(attributePaths = "courses")
  Optional<Student> findById(String id);

  Optional<Student> findByEmailIgnoreCase(String email);

  List<Student> findByCourses_Id(String courseId);
}
