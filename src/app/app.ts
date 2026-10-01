import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from './core/store';
import { ConfirmDialog, ConfirmService } from './shared/confirm-dialog';
import { Notice } from './shared/notice';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog, Notice],
  templateUrl: './app.html',
})
export class App {
  readonly confirm = inject(ConfirmService);
  constructor() {
    inject(Store).load();
  }
}
