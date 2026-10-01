package dev.scholar;

import jakarta.persistence.*;

@Entity
@Table(name = "courses", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
public class Course {
  @Id String id;

  @Column(nullable = false, length = 20)
  String code;

  @Column(nullable = false, length = 120)
  String title;

  @Column(nullable = false, length = 100)
  String instructor;

  @Column(nullable = false)
  int credits;

  @Column(nullable = false, length = 1000)
  String description;

  public Course() {}
}
