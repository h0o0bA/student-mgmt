import { Component, HostListener, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Store } from '../core/store';
import { NoticeService } from '../shared/notice';
import { EnrollmentPicker } from '../shared/enrollment-picker';
import { FieldError } from '../shared/field-error';
@Component({
  imports: [ReactiveFormsModule, AsyncPipe, RouterLink, EnrollmentPicker, FieldError],
  templateUrl: './student-form.html',
})
export class StudentForm {
  readonly store = inject(Store);
  private router = inject(Router);
  private notice = inject(NoticeService);
  private fb = inject(FormBuilder).nonNullable;
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? undefined;
  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    status: this.fb.control<'Active' | 'Inactive'>('Active', Validators.required),
    courseIds: this.fb.control<string[]>([]),
  });
  tab: 'profile' | 'enrollments' = 'profile';
  loading = !!this.id;
  loadError = '';
  error = '';
  saving = false;
  constructor() {
    if (this.id)
      this.store
        .student(this.id)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (student) => {
            this.form.patchValue(student);
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
  setEnrollments(ids: string[]) {
    this.form.controls.courseIds.setValue(ids);
    this.form.markAsDirty();
  }
  tabKey(event: KeyboardEvent) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.tab =
        event.key === 'Home'
          ? 'profile'
          : event.key === 'End'
            ? 'enrollments'
            : this.tab === 'profile'
              ? 'enrollments'
              : 'profile';
      document.getElementById(`${this.tab}-tab`)?.focus();
    }
  }
  save() {
    if (this.saving) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.tab = 'profile';
      return;
    }
    this.saving = true;
    this.error = '';
    const value = this.form.getRawValue();
    this.store
      .saveStudent(
        {
          ...value,
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: value.email.trim().toLowerCase(),
        },
        this.id,
      )
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.saving = false;
          this.notice.show(this.id ? 'Student updated.' : 'Student added.');
          void this.router.navigate(['/students']);
        },
        error: (error: Error) => (this.error = error.message),
      });
  }
}
