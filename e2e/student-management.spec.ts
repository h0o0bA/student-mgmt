import { test, expect } from '@playwright/test';

test('student and course CRUD, multiple enrollments, confirmation, and persistence', async ({
  page,
}) => {
  const suffix = Date.now();
  const code = `QA${suffix}`;
  await page.goto('/courses');
  await page.getByRole('link', { name: 'Add course' }).first().click();
  await page.getByLabel('Course code').fill(code);
  await page.getByLabel('Course title').fill('Quality Assurance');
  await page.getByLabel('Instructor').fill('Dr. Test');
  await page.getByLabel('Description').fill('Testing a complete course lifecycle.');
  await page.getByRole('button', { name: 'Create course' }).click();
  await expect(page).toHaveURL(/\/courses$/);
  await page.getByRole('link', { name: `Edit ${code}`, exact: true }).click();
  await page.getByLabel('Course title').fill('Quality Assurance II');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Quality Assurance II' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Students' }).click();
  await page.getByRole('link', { name: 'Add student' }).first().click();
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill(`Student${suffix}`);
  await page.getByLabel('Email address').fill(`test${suffix}@example.com`);
  await page.getByRole('tab', { name: /Course enrollments/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await page.getByRole('checkbox', { name: /Quality Assurance II/ }).check();
  await page.getByRole('checkbox', { name: /Introduction to Computer Science/ }).check();
  await page.getByRole('tab', { name: /Profile details/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await expect(page.getByLabel('First name')).toHaveValue('Test');
  await page.getByRole('button', { name: 'Create student' }).click();
  await expect(page).toHaveURL(/\/students$/);
  await page.reload();
  await page.getByLabel('Search students').fill(`test${suffix}@example.com`);
  const row = page.getByRole('row').filter({ hasText: `Student${suffix}` });
  await expect(row).toContainText(code);
  await expect(row).toContainText('CS101');
  await row.getByRole('link', { name: /Edit Test/ }).click();
  await page.getByLabel('First name').fill('Updated');
  await page.getByRole('tab', { name: /Course enrollments/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await page.getByRole('checkbox', { name: /Introduction to Computer Science/ }).uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\/students$/);
  await page.getByLabel('Search students').fill(`test${suffix}@example.com`);
  await expect(row).toContainText('Updated');
  await expect(row).not.toContainText('CS101');
  await page.getByRole('navigation').getByRole('link', { name: 'Courses' }).click();
  await page.getByRole('button', { name: `Delete ${code}`, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('1 student enrollment');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quality Assurance II' })).toBeVisible();
  await page.getByRole('button', { name: `Delete ${code}`, exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete course', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Quality Assurance II' })).toHaveCount(0);
  await page.getByRole('navigation').getByRole('link', { name: 'Students' }).click();
  await page.getByLabel('Search students').fill(`test${suffix}@example.com`);
  await expect(row).toContainText('No courses yet');
  await row.getByRole('button', { name: /Delete Updated/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete student', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'No matching students' })).toBeVisible();
});

test('unsaved changes require confirmation and Cancel preserves the draft', async ({ page }) => {
  await page.goto('/students/new');
  await page.getByLabel('First name').fill('Draft');
  await page.getByRole('navigation').getByRole('link', { name: 'Courses' }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Leave without saving?');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('First name')).toHaveValue('Draft');
  await page.getByRole('navigation').getByRole('link', { name: 'Courses' }).click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page).toHaveURL(/\/courses$/);
});

test('required fields and invalid email block saving', async ({ page }) => {
  await page.goto('/students/new');
  await page.getByRole('button', { name: 'Create student' }).click();
  await expect(page.getByRole('alert')).toHaveCount(3);
  await page.getByLabel('First name').fill('Ada');
  await page.getByLabel('Last name').fill('Test');
  await page.getByLabel('Email address').fill('invalid');
  await page.getByRole('button', { name: 'Create student' }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page).toHaveURL(/\/students\/new$/);
});

test('server duplicate validation keeps form values for correction', async ({ page }) => {
  await page.goto('/students/new');
  await page.getByLabel('First name').fill('Olivia');
  await page.getByLabel('Last name').fill('Duplicate');
  await page.getByLabel('Email address').fill('olivia.bennett@example.com');
  await page.getByRole('button', { name: 'Create student' }).click();
  await expect(page.getByRole('alert')).toContainText('email already exists');
  await expect(page.getByLabel('Last name')).toHaveValue('Duplicate');
});

test('API failure shows retry, then recovers', async ({ page }) => {
  await page.route('**/api/students', (route) => route.abort());
  await page.goto('/students');
  await expect(page.getByRole('alert')).toContainText('Cannot reach the server');
  await page.unroute('**/api/students');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('table')).toBeVisible();
});

test('failed saves preserve changes and allow retry', async ({ page }) => {
  await page.goto('/courses/c1');
  await expect(page.getByLabel('Course title')).toHaveValue('Introduction to Computer Science');
  await page.getByLabel('Course title').fill('Draft course title');
  await page.route('**/api/courses/c1', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Temporary failure. Please retry.' }),
        })
      : route.continue(),
  );
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('alert')).toContainText('Temporary failure');
  await expect(page.getByLabel('Course title')).toHaveValue('Draft course title');
  await page.unroute('**/api/courses/c1');
  await page.getByLabel('Course title').fill('Introduction to Computer Science');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\/courses$/);
});

test('student tabs work with keyboard and keep profile values', async ({ page }) => {
  await page.goto('/students/new');
  await page.getByLabel('First name').fill('Ada');
  await page.getByRole('tab', { name: /Profile details/ }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Course enrollments/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('Home');
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await expect(page.getByLabel('First name')).toHaveValue('Ada');
});

test('tab confirmation supports Cancel and Escape and preserves both tab drafts', async ({
  page,
}) => {
  let writes = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/') && ['POST', 'PUT', 'PATCH'].includes(request.method()))
      writes++;
  });
  await page.goto('/students/new');
  await page.getByLabel('First name').fill('Unsaved draft');
  const profile = page.getByRole('tab', { name: /Profile details/ });
  const enrollments = page.getByRole('tab', { name: /Course enrollments/ });
  await enrollments.click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Switch tabs with unsaved changes?');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('First name')).toHaveValue('Unsaved draft');
  await enrollments.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await enrollments.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await page.getByRole('checkbox', { name: /Introduction to Computer Science/ }).check();
  await profile.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await expect(page.getByLabel('First name')).toHaveValue('Unsaved draft');
  await enrollments.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Switch tab', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: /Introduction to Computer Science/ }),
  ).toBeChecked();
  expect(writes).toBe(0);
});

test('clean forms switch tabs without asking to confirm', async ({ page }) => {
  await page.goto('/students/new');
  await page.getByRole('tab', { name: /Course enrollments/ }).click();
  await expect(page.getByRole('tab', { name: /Course enrollments/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('filters, empty states, and unknown routes', async ({ page }) => {
  await page.goto('/students');
  await page.getByLabel('Filter by status').selectOption('Inactive');
  await expect(page.getByRole('row')).toHaveCount(3);
  await page.getByLabel('Search students').fill('nobody-matches-this');
  await expect(page.getByRole('heading', { name: 'No matching students' })).toBeVisible();
  await page.goto('/not-a-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('/students/not-a-student');
  await expect(page.getByRole('alert')).toContainText('could not be found');
});

test('mobile layout fits and navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: 'A clearer view of campus.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('navigation').getByRole('link', { name: 'Courses' }).click();
  await expect(page.getByRole('heading', { name: 'Course catalog' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
