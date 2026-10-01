# Scholar — Student Management

An Angular 20 application for managing students, courses, and enrollments. The default setup runs against JSON Server; an optional Java 21 / Spring Boot backend implements the same API with database validation and transactions.

![Student Management overview](docs/overview.png)

## Run locally with JSON Server

Requirements: Node.js **20.19+** (or 22.12+), npm, and two available ports: **4200** and **3000**. Java is not needed for this mode.

```bash
git clone https://github.com/h0o0bA/student-mgmt.git
cd student-mgmt
npm ci
npm start
```

Open **http://localhost:4200**. This one command starts Angular and JSON Server together; press Ctrl+C to stop both.

- Frontend: http://localhost:4200
- API: http://127.0.0.1:3000/api/students and `/api/courses`
- Health: http://127.0.0.1:3000/api/health
- Eight sample students and six courses are included. All sample names and addresses are fictional.
- The first start copies `mock/seed.json` to `mock/db.json`. Changes persist in the latter, which is intentionally excluded from Git.
- To restore sample data, **stop the server**, run `npm run db:reset`, then `npm start`. This replaces your local mock data.

To start the processes separately, use `npm run api` and `npm run serve` in two terminals. `npm run build` produces the production frontend in `dist/student-management/browser`. A production host must serve `index.html` for client routes and proxy `/api` to the chosen backend.

## Features

- **Student CRUD:** create, list, view, update, and delete profiles; search by name/email and filter by status.
- **Course CRUD:** create, list, view, update, and delete courses; search by code, title, or instructor.
- **Multiple enrollments:** add and remove courses on each student’s enrollment tab, with a credit total.
- **Routing:** lazy-loaded overview, students, courses, edit/new pages, and a 404 page. Record URLs can be opened directly.
- **Tabs and confirmation:** profile/enrollment tabs keep their draft values. Navigating to another page with unsaved changes opens a confirmation modal. Browser reload/close uses the browser’s native warning. Deletes also require confirmation; Cancel and Escape make no changes.
- **Reactive forms:** required fields, email validation, length limits, valid status, and whole-number credits from 1–6. Email addresses and course codes must be unique, ignoring case.
- **Error handling:** loading and empty states, retry after API failures, preserved drafts after failed saves, and success notifications.
- **Component communication:** an RxJS `BehaviorSubject` store updates lists and dashboard counts after successful writes. The enrollment picker uses input/output bindings; the stats component receives inputs; dialogs and notifications use shared services.
- Responsive layouts, labeled form controls, keyboard-operable tabs, and native modal focus handling. Fonts are served locally, with their licenses in `public/fonts`.

Deleting a **student** keeps their courses. Deleting a **course** removes that course from every student and preserves the students. Inactive students retain their records and enrollments; status is a label, not a restriction on enrollment.

## Bonus: Java / Spring backend

Requirements: **JDK 21**. The checked-in Maven wrapper downloads Maven 3.9.11 on first use; a separate Maven installation is unnecessary.

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run`. If Java is not on your path, set `JAVA_HOME` to your JDK installation.

Spring runs at **http://127.0.0.1:8080**. To use it from Angular, stop the default `npm start` process, return to the project root in another terminal, and run:

```bash
npm run start:spring
```

Open http://localhost:4200 again. The proxy now directs `/api` to port 8080. The two backends have **separate data stores**; changing one does not automatically change the other.

### What the bonus includes

- Spring Boot 3.5, Spring MVC REST controllers, Spring Data JPA, and a file-backed H2 database.
- Bean Validation on request DTOs, case-insensitive uniqueness checks, database unique constraints, and enrollment foreign keys.
- Central exception handling with consistent JSON responses and meaningful 400, 404, 409, and 502 statuses. Unexpected failures return a generic 500 message and are logged server-side.
- `@Transactional` service methods for writes. Course deletion removes enrollment links and the course in one database transaction.
- A **RestTemplate** catalog client with connect/read timeouts. The catalog import runs in a transaction, updates matching course codes without changing local IDs, and inserts new courses. If any upstream record is invalid or duplicated, the entire import rolls back.
- JUnit 5 / Mockito unit tests, RestTemplate client tests using `MockRestServiceServer`, and Spring integration tests with H2 and MockMvc. The rollback test has no surrounding test transaction, so it checks the service’s real transaction boundary.

H2 files are stored in `backend/data` when started from `backend`. Sample data is loaded only when both tables are empty. Set `--app.seed=false` to disable seeding. Settings are in `backend/src/main/resources/application.properties`; standard Spring environment variables can override them.

### Try the RestTemplate import

Keep Spring running on port 8080. In another terminal at the project root:

```bash
npm run api
```

Then:

```bash
curl -X POST http://127.0.0.1:8080/api/courses/import
```

This imports the JSON Server course catalog into Spring’s database. It does not import students, delete absent courses, or synchronize continuously. To change the upstream URL, set `APP_CATALOG_URL` before starting Spring. Reload the UI after imports made outside the browser.

## API

Both backends expose this contract under `/api`:

| Method | Endpoint          | Purpose                                             |
| ------ | ----------------- | --------------------------------------------------- |
| GET    | `/students`       | List students                                       |
| GET    | `/students/{id}`  | Read a student                                      |
| POST   | `/students`       | Create a student                                    |
| PUT    | `/students/{id}`  | Replace a student’s editable fields and enrollments |
| DELETE | `/students/{id}`  | Delete a student                                    |
| GET    | `/courses`        | List courses                                        |
| GET    | `/courses/{id}`   | Read a course                                       |
| POST   | `/courses`        | Create a course                                     |
| PUT    | `/courses/{id}`   | Replace a course’s editable fields                  |
| DELETE | `/courses/{id}`   | Delete a course and its enrollment links            |
| GET    | `/health`         | Identify the running backend                        |
| POST   | `/courses/import` | Spring only: import courses using RestTemplate      |

IDs are opaque strings. Send editable fields without `id` in POST/PUT requests. Both backends return the saved record, including its ID.

Student request:

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "status": "Active",
  "courseIds": ["c1", "c2"]
}
```

Course request:

```json
{
  "code": "CS205",
  "title": "Data Structures",
  "instructor": "Dr. Chen",
  "credits": 3,
  "description": "An introduction to organizing data."
}
```

`courseIds` can be empty. Every referenced course must exist; duplicate IDs are deduplicated. JSON Server also supports validated PATCH requests, but the frontend uses PUT, which both backends support. JSON Server returns 200 on student deletion; Spring returns 204. Course deletion returns 204 in both.

## Tests and checks

```bash
npm run build       # Angular production build and strict template checks
npm test            # 10 Angular unit tests; requires Chrome
npm run test:api     # 7 JSON Server tests; isolated in-memory databases
npm run test:e2e     # 9 Playwright scenarios; local Chrome by default
```

The browser suite starts its own Angular/JSON Server instances on **4201/3001**, uses in-memory seed data, and does not touch `mock/db.json`. It covers complete student/course CRUD, multi-course enrollment, deletion cleanup, tab navigation, confirmations, validation, duplicate errors, failed saves, API recovery, direct routes, and mobile layout. If Chrome is elsewhere, configure `CHROME_BIN` for unit tests. In CI, Playwright uses its installed Chromium browser.

```bash
cd backend
./mvnw test          # 18 Java unit/client/integration tests
./mvnw verify        # tests and executable JAR packaging
```

The same browser scenarios can be run against a manually started frontend using `E2E_BASE_URL=http://127.0.0.1:4202 npm run test:e2e`. Use a seeded development database; these tests create and remove temporary records and briefly edit a seed course.

GitHub Actions runs the production build, Angular unit tests, JSON Server tests, browser tests, and backend verification on pushes and pull requests.

## Project layout

```text
src/app/
  core/             Models, RxJS store, HTTP errors, unsaved-changes guard
  shared/           Confirmation dialog, notifications, stats, enrollment picker
  pages/            Routed overview, student/course lists, and reactive forms
mock/               JSON Server, validation middleware, seed data, API tests
e2e/                Browser scenarios and an isolated test API
backend/            Spring Boot app, Maven wrapper, and Java tests
docs/               Application screenshot
```

The frontend uses standalone Angular components, HttpClient, RxJS, and plain CSS. The mock middleware validates writes and keeps course deletions consistent in one synchronous lowdb write. It is a local mock server, not a transactional database; Spring/H2 provides the database transaction implementation. This is a local assessment app with no authentication, authorization, or multi-user conflict resolution.

Reference documentation: [Angular version compatibility](https://angular.dev/reference/versions), [JSON Server 0.17](https://github.com/typicode/json-server/tree/v0.17.4), [Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/index.html).
