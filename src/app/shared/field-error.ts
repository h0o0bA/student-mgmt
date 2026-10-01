import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
@Component({
  selector: 'app-field-error',
  template: `@if (control.invalid && control.touched) {
    <small class="field-error" role="alert">{{ message }}</small>
  }`,
})
export class FieldError {
  @Input({ required: true }) control!: AbstractControl;
  get message() {
    if (this.control.hasError('required') || this.control.hasError('pattern'))
      return 'Enter a valid value for this field.';
    if (this.control.hasError('email')) return 'Enter a valid email address.';
    if (this.control.hasError('maxlength'))
      return `Use no more than ${this.control.errors?.['maxlength'].requiredLength} characters.`;
    return 'Enter a whole number from 1 to 6.';
  }
}
