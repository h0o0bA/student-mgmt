import {
  AfterViewInit,
  Component,
  ElementRef,
  Injectable,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
interface Confirmation {
  title: string;
  message: string;
  action: string;
  danger?: boolean;
}
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<Confirmation | null>(null);
  private resolve?: (result: boolean) => void;
  ask(request: Confirmation): Promise<boolean> {
    if (this.resolve) return Promise.resolve(false);
    this.request.set(request);
    return new Promise((resolve) => (this.resolve = resolve));
  }
  close(result: boolean) {
    this.resolve?.(result);
    this.resolve = undefined;
    this.request.set(null);
  }
}
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <dialog
      #dialog
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      (cancel)="cancel($event)"
    >
      @if (confirm.request(); as request) {
        <div class="dialog-icon" [class.danger]="request.danger">
          {{ request.danger ? '!' : '↗' }}
        </div>
        <h2 id="dialog-title">{{ request.title }}</h2>
        <p id="dialog-description">{{ request.message }}</p>
        <div class="dialog-actions">
          <button class="button secondary" autofocus (click)="close(false)">Cancel</button>
          <button class="button" [class.destructive]="request.danger" (click)="close(true)">
            {{ request.action }}
          </button>
        </div>
      }
    </dialog>
  `,
})
export class ConfirmDialog implements AfterViewInit {
  readonly confirm = inject(ConfirmService);
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  ngAfterViewInit() {
    this.dialog.nativeElement.showModal();
  }
  close(result: boolean) {
    this.dialog.nativeElement.close();
    this.confirm.close(result);
  }
  cancel(event: Event) {
    event.preventDefault();
    this.close(false);
  }
}
