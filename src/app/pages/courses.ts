import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Store } from '../core/store';
import { Course, Student } from '../core/models';
import { ConfirmService } from '../shared/confirm-dialog';
import { NoticeService } from '../shared/notice';
@Component({
  imports: [AsyncPipe, FormsModule, RouterLink],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">MAKE ROOM FOR CURIOSITY</span>
        <h1>Courses<span class="heading-dot">.</span></h1>
        <p>Build a catalog that opens doors.</p>
      </div>
      <a class="button" routerLink="/courses/new"><span>＋</span> Add course</a>
    </div>
    @if (store.state$ | async; as state) {
      @if (state.loading) {
        <div class="panel empty" role="status">Loading courses…</div>
      } @else if (state.error) {
        <div class="error-banner" role="alert">
          {{ state.error }}
          <button class="button secondary" (click)="store.load()">Try again</button>
        </div>
      } @else {
        @if (error) {
          <div class="error-banner" role="alert">{{ error }}</div>
        }
        <div class="catalog-bar">
          <h2>
            Course catalog <span class="count">{{ state.courses.length }}</span>
          </h2>
          <label class="search"
            ><span aria-hidden="true">⌕</span
            ><input
              aria-label="Search courses"
              type="search"
              placeholder="Search courses or instructors…"
              [(ngModel)]="query"
          /></label>
        </div>
        <section class="course-grid" aria-label="Course catalog">
          @for (course of filtered(state.courses); track course.id; let index = $index) {
            <article class="course-card">
              <div
                class="course-card-top"
                [class.mint]="index % 3 === 1"
                [class.peach]="index % 3 === 2"
              >
                <span class="course-symbol">▤</span
                ><span class="course-code">{{ course.code }}</span
                ><span class="credit-pill">{{ course.credits }} credits</span>
              </div>
              <div class="course-card-body">
                <a [routerLink]="['/courses', course.id]"
                  ><h2>{{ course.title }}</h2></a
                >
                <p>{{ course.description || 'A new opportunity to learn, explore, and grow.' }}</p>
                <div class="course-meta">
                  <span>Instructor</span><strong>{{ course.instructor }}</strong>
                </div>
                <div class="course-card-footer">
                  <span>{{ enrollmentCount(course.id, state.students) }} enrolled</span>
                  <div class="row-actions">
                    <a
                      class="icon-button"
                      [routerLink]="['/courses', course.id]"
                      [attr.aria-label]="'Edit ' + course.code"
                      >Edit</a
                    ><button
                      class="icon-button danger-text"
                      (click)="remove(course, state.students)"
                      [disabled]="!!deleting"
                      [attr.aria-label]="'Delete ' + course.code"
                    >
                      {{ deleting === course.id ? 'Deleting…' : 'Delete' }}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          } @empty {
            <div class="panel empty full-width">
              <span class="empty-icon">▤</span>
              <h2>
                {{ state.courses.length ? 'No matching courses' : 'Something new starts here' }}
              </h2>
              <p>
                {{
                  state.courses.length
                    ? 'Try another course name, code, or instructor.'
                    : 'Add a course and give your students a new possibility.'
                }}
              </p>
              @if (!state.courses.length) {
                <a class="button" routerLink="/courses/new">Add course</a>
              }
            </div>
          }
        </section>
      }
    }
  `,
})
export class Courses {
  readonly store = inject(Store);
  private confirm = inject(ConfirmService);
  private notice = inject(NoticeService);
  query = '';
  error = '';
  deleting = '';
  filtered(courses: Course[]) {
    const query = this.query.trim().toLowerCase();
    return courses
      .filter((c) => `${c.code} ${c.title} ${c.instructor}`.toLowerCase().includes(query))
      .sort((a, b) => a.code.localeCompare(b.code));
  }
  enrollmentCount(id: string, students: Student[]) {
    return students.filter((s) => s.courseIds.includes(id)).length;
  }
  async remove(course: Course, students: Student[]) {
    if (this.deleting) return;
    const count = this.enrollmentCount(course.id, students);
    if (
      !(await this.confirm.ask({
        title: 'Delete course?',
        message: `Permanently delete ${course.code}: ${course.title}? This also removes ${count} student enrollment${count === 1 ? '' : 's'}. Student profiles will be kept.`,
        action: 'Delete course',
        danger: true,
      }))
    )
      return;
    this.deleting = course.id;
    this.error = '';
    this.store
      .deleteCourse(course.id)
      .pipe(finalize(() => (this.deleting = '')))
      .subscribe({
        next: () => this.notice.show('Course and associated enrollments deleted.'),
        error: (error: Error) => (this.error = error.message),
      });
  }
}
