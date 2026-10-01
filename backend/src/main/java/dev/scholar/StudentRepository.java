package dev.scholar;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, String> {
  Optional<Student> findByEmailIgnoreCase(String email);

  List<Student> findByCourses_Id(String courseId);
}
