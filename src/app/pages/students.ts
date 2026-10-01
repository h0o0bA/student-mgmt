import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Store } from '../core/store';
import { Course, Student } from '../core/models';
import { ConfirmService } from '../shared/confirm-dialog';
import { NoticeService } from '../shared/notice';
import { Stats } from '../shared/stats';
@Component({ imports: [AsyncPipe, FormsModule, RouterLink, Stats], templateUrl: './students.html' })
export class Students {
  readonly store = inject(Store);
  private confirm = inject(ConfirmService);
  private notice = inject(NoticeService);
  query = '';
  status = 'All statuses';
  error = '';
  deleting = '';
  filtered(students: Student[]) {
    const query = this.query.trim().toLowerCase();
    return students
      .filter(
        (s) =>
          `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(query) &&
          (this.status === 'All statuses' || s.status === this.status),
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }
  enrolled(student: Student, courses: Course[]) {
    return courses.filter((course) => student.courseIds.includes(course.id));
  }
  async remove(student: Student) {
    if (this.deleting) return;
    if (
      !(await this.confirm.ask({
        title: 'Delete student?',
        message: `This will permanently delete ${student.firstName} ${student.lastName} and their course enrollments.`,
        action: 'Delete student',
        danger: true,
      }))
    )
      return;
    this.deleting = student.id;
    this.error = '';
    this.store
      .deleteStudent(student.id)
      .pipe(finalize(() => (this.deleting = '')))
      .subscribe({
        next: () => this.notice.show('Student deleted.'),
        error: (error: Error) => (this.error = error.message),
      });
  }
}
