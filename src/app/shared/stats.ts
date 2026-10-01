import { Component, Input } from '@angular/core';
import { Course, Student } from '../core/models';
@Component({
  selector: 'app-stats',
  template: `
    <section class="stats" aria-label="Student management statistics">
      <article class="stat">
        <span class="stat-label">Total students <span class="stat-symbol purple">♙</span></span
        ><strong>{{ students.length }}</strong
        ><span class="stat-note">{{ active }} active students</span>
      </article>
      <article class="stat">
        <span class="stat-label">Available courses <span class="stat-symbol blue">▤</span></span
        ><strong>{{ courses.length }}</strong
        ><span class="stat-note">Across the course catalog</span>
      </article>
      <article class="stat">
        <span class="stat-label">Course enrollments <span class="stat-symbol green">↗</span></span
        ><strong>{{ enrollments }}</strong
        ><span class="stat-note">Learning, one course at a time</span>
      </article>
    </section>
  `,
})
export class Stats {
  @Input({ required: true }) students: Student[] = [];
  @Input({ required: true }) courses: Course[] = [];
  get active() {
    return this.students.filter((student) => student.status === 'Active').length;
  }
  get enrollments() {
    return this.students.reduce((sum, student) => sum + student.courseIds.length, 0);
  }
}
