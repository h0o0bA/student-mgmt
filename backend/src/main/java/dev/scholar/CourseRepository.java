package dev.scholar;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, String> {
  Optional<Course> findByCodeIgnoreCase(String code);
}
