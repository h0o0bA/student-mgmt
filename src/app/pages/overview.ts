import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '../core/store';
import { Stats } from '../shared/stats';
@Component({
  imports: [AsyncPipe, RouterLink, Stats],
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">YOUR ACADEMIC WORKSPACE</span>
        <h1>A clearer view of campus.</h1>
        <p>Good things start with a little organization.</p>
      </div>
      <a class="button" routerLink="/students/new"><span>＋</span> Add student</a>
    </div>
    @if (store.state$ | async; as state) {
      @if (state.loading) {
        <div class="panel empty" role="status">Loading your workspace…</div>
      } @else if (state.error) {
        <div class="error-banner" role="alert">
          {{ state.error }}
          <button class="button secondary" (click)="store.load()">Try again</button>
        </div>
      } @else {
        <app-stats [students]="state.students" [courses]="state.courses" />
        <section class="welcome-panel">
          <div>
            <span class="eyebrow">EVERY STUDENT. EVERY NEXT STEP.</span>
            <h2>Keep learning moving.</h2>
            <p>
              From a first enrollment to a full course load,<br />manage it all in one thoughtful
              space.
            </p>
            <a class="text-link" routerLink="/students">Explore your students <span>→</span></a>
          </div>
          <div class="book-art" aria-hidden="true">
            <span class="spark one">✧</span><span class="spark two">✦</span>
            <div class="book book-one">THE NEXT<br /><b>CHAPTER</b><span>↗</span></div>
            <div class="book book-two"></div>
            <div class="book book-three"></div>
          </div>
        </section>
        <div class="overview-grid">
          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>Student directory</h2>
                <p>A few familiar faces in your workspace.</p>
              </div>
              <a class="text-link" routerLink="/students">View all →</a>
            </div>
            @for (student of state.students.slice(0, 5); track student.id) {
              <a class="person-row" [routerLink]="['/students', student.id]"
                ><span class="avatar">{{ student.firstName[0] }}{{ student.lastName[0] }}</span>
                <div>
                  <strong>{{ student.firstName }} {{ student.lastName }}</strong
                  ><small>{{ student.email }}</small>
                </div>
                <span class="badge" [class.inactive]="student.status === 'Inactive'">{{
                  student.status
                }}</span
                ><span class="muted">↗</span></a
              >
            } @empty {
              <div class="empty">
                <p>No students yet.</p>
                <a routerLink="/students/new">Add your first student</a>
              </div>
            }
          </section>
          <section class="panel">
            <div class="panel-heading">
              <div>
                <h2>Course spotlight</h2>
                <p>More ways to keep curiosity growing.</p>
              </div>
              <a class="text-link" routerLink="/courses">View all →</a>
            </div>
            @for (course of state.courses.slice(0, 3); track course.id) {
              <a class="spotlight" [routerLink]="['/courses', course.id]"
                ><span class="course-symbol">▤</span>
                <div>
                  <span class="course-code">{{ course.code }}</span
                  ><strong>{{ course.title }}</strong
                  ><small>{{ course.credits }} credits · {{ course.instructor }}</small>
                </div>
                <span>→</span></a
              >
            } @empty {
              <div class="empty">
                <p>Your catalog is ready for its first course.</p>
                <a routerLink="/courses/new">Create a course</a>
              </div>
            }
          </section>
        </div>
      }
    }
  `,
})
export class Overview {
  readonly store = inject(Store);
}
