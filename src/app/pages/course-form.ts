import { Component, HostListener, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Store } from '../core/store';
import { NoticeService } from '../shared/notice';
import { FieldError } from '../shared/field-error';
@Component({
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './course-form.html',
})
export class CourseForm {
  private store = inject(Store);
  private router = inject(Router);
  private notice = inject(NoticeService);
  private fb = inject(FormBuilder).nonNullable;
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? undefined;
  readonly form = this.fb.group({
    code: [
      '',
      [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/), Validators.maxLength(20)],
    ],
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    instructor: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    credits: [
      3,
      [Validators.required, Validators.min(1), Validators.max(6), Validators.pattern(/^[1-6]$/)],
    ],
    description: ['', Validators.maxLength(1000)],
  });
  loading = !!this.id;
  loadError = '';
  error = '';
  saving = false;
  constructor() {
    if (this.id)
      this.store
        .course(this.id)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (course) => {
            this.form.patchValue(course);
            this.loading = false;
          },
          error: (error: Error) => {
            this.loadError = error.message;
            this.loading = false;
          },
        });
  }
  hasUnsavedChanges() {
    return this.form.dirty;
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  save() {
    if (this.saving) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    const value = this.form.getRawValue();
    this.store
      .saveCourse(
        {
          ...value,
          code: value.code.trim().toUpperCase(),
          title: value.title.trim(),
          instructor: value.instructor.trim(),
          description: value.description.trim(),
        },
        this.id,
      )
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.saving = false;
          this.notice.show(this.id ? 'Course updated.' : 'Course added.');
          void this.router.navigate(['/courses']);
        },
        error: (error: Error) => (this.error = error.message),
      });
  }
}
