import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Course } from '../core/models';
@Component({
  selector: 'app-enrollment-picker',
  template: `
    <div class="section-intro">
      <h2>Make their next connection.</h2>
      <p>Select the courses this student is enrolled in. Changes are saved with the profile.</p>
    </div>
    <div class="enrollment-summary">
      <strong>{{ selected.length }} courses selected</strong
      ><span>{{ credits }} total credits</span>
    </div>
    <div class="enrollment-list">
      @for (course of courses; track course.id) {
        <label class="enrollment-option" [class.selected]="selected.includes(course.id)"
          ><input
            type="checkbox"
            [checked]="selected.includes(course.id)"
            (change)="toggle(course.id)"
          /><span class="course-symbol">▤</span
          ><span
            ><strong>{{ course.title }}</strong
            ><small>{{ course.code }} · {{ course.instructor }}</small></span
          ><span class="credit-pill">{{ course.credits }} credits</span></label
        >
      } @empty {
        <div class="empty">
          <p>No courses available. Create a course in the catalog, then enroll this student.</p>
        </div>
      }
    </div>
  `,
})
export class EnrollmentPicker {
  @Input({ required: true }) courses: Course[] = [];
  @Input({ required: true }) selected: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();
  get credits() {
    return this.courses
      .filter((course) => this.selected.includes(course.id))
      .reduce((sum, course) => sum + course.credits, 0);
  }
  toggle(id: string) {
    this.selectedChange.emit(
      this.selected.includes(id)
        ? this.selected.filter((value) => value !== id)
        : [...this.selected, id],
    );
  }
}
