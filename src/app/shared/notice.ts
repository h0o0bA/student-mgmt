import { Component, Injectable, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class NoticeService {
  readonly message = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  show(message: string) {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(''), 5000);
  }
}
@Component({
  selector: 'app-notice',
  template: `
    <div role="status" aria-live="polite">
      @if (notice.message()) {
        <div class="toast">
          <span>✓</span> {{ notice.message() }}
          <button aria-label="Dismiss notification" (click)="notice.message.set('')">×</button>
        </div>
      }
    </div>
  `,
})
export class Notice {
  readonly notice = inject(NoticeService);
}
