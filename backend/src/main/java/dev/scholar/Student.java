package dev.scholar;

import jakarta.persistence.*;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "students", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class Student {
  @Id String id;

  @Column(nullable = false, length = 60)
  String firstName;

  @Column(nullable = false, length = 60)
  String lastName;

  @Column(nullable = false, length = 254)
  String email;

  @Column(nullable = false)
  String status;

  @ManyToMany
  @JoinTable(
      name = "enrollments",
      joinColumns = @JoinColumn(name = "student_id"),
      inverseJoinColumns = @JoinColumn(name = "course_id"),
      uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"}))
  Set<Course> courses = new LinkedHashSet<>();

  public Student() {}
}
