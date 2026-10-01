import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { unsavedGuard } from './unsaved.guard';
import { ConfirmService } from '../shared/confirm-dialog';
describe('unsavedGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  function check(dirty: boolean, saving = false) {
    return TestBed.runInInjectionContext(() =>
      unsavedGuard({ hasUnsavedChanges: () => dirty, saving }, route, state, state),
    );
  }
  it('allows navigation from clean forms', () => expect(check(false)).toBeTrue());
  it('prevents navigation while saving', () => expect(check(true, true)).toBeFalse());
  it('keeps changes when confirmation is canceled', async () => {
    const result = check(true);
    TestBed.inject(ConfirmService).close(false);
    expect(await result).toBeFalse();
  });
  it('allows discarding changes after confirmation', async () => {
    const result = check(true);
    TestBed.inject(ConfirmService).close(true);
    expect(await result).toBeTrue();
  });
});
