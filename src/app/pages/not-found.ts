import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  imports: [RouterLink],
  template: `<section class="empty panel">
    <span class="eyebrow">404</span>
    <h1>Page not found</h1>
    <p>We couldn’t find that page. Let’s get you back to your workspace.</p>
    <a class="button" routerLink="/overview">Go to overview</a>
  </section>`,
})
export class NotFound {}
