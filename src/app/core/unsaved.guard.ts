import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../shared/confirm-dialog';
export interface UnsavedForm {
  hasUnsavedChanges(): boolean;
  saving: boolean;
}
export const unsavedGuard: CanDeactivateFn<UnsavedForm> = (component) => {
  if (component.saving) return false;
  return (
    !component.hasUnsavedChanges() ||
    inject(ConfirmService).ask({
      title: 'Leave without saving?',
      message:
        'Your changes have not been saved. Stay here to finish, or discard your changes and continue.',
      action: 'Discard changes',
      danger: true,
    })
  );
};
