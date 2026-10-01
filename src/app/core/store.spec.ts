import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Store } from './store';
import { apiErrorInterceptor } from './api-error';
import { firstValueFrom } from 'rxjs';

const student = {
  id: 's1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  status: 'Active' as const,
  courseIds: ['c1'],
};
const course = {
  id: 'c1',
  code: 'CS101',
  title: 'Computing',
  instructor: 'Dr. Chen',
  credits: 3,
  description: '',
};
describe('Store', () => {
  let store: Store;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    store = TestBed.inject(Store);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function load() {
    store.load();
    http.expectOne('/api/students').flush([student]);
    http.expectOne('/api/courses').flush([course]);
  }
  it('loads students and courses together', async () => {
    load();
    const state = await firstValueFrom(store.state$);
    expect(state.students).toEqual([student]);
    expect(state.courses).toEqual([course]);
    expect(state.loading).toBeFalse();
  });
  it('updates subscribers only after a successful save', async () => {
    load();
    store.saveStudent({ ...student, firstName: 'Grace' }, 's1').subscribe();
    expect((await firstValueFrom(store.state$)).students[0].firstName).toBe('Ada');
    const request = http.expectOne('/api/students/s1');
    expect(request.request.method).toBe('PUT');
    request.flush({ ...student, firstName: 'Grace' });
    expect((await firstValueFrom(store.state$)).students[0].firstName).toBe('Grace');
  });
  it('removes course references from every student after course deletion', async () => {
    load();
    store.deleteCourse('c1').subscribe();
    http.expectOne('/api/courses/c1').flush(null, { status: 204, statusText: 'No Content' });
    const state = await firstValueFrom(store.state$);
    expect(state.courses).toEqual([]);
    expect(state.students[0].courseIds).toEqual([]);
  });
  it('preserves state on a failed deletion', async () => {
    load();
    let message = '';
    store.deleteStudent('s1').subscribe({ error: (error) => (message = error.message) });
    http
      .expectOne('/api/students/s1')
      .flush({ message: 'Please retry.' }, { status: 500, statusText: 'Error' });
    expect(message).toBe('Please retry.');
    expect((await firstValueFrom(store.state$)).students).toEqual([student]);
  });
  it('shows an error and supports retry after a loading failure', async () => {
    store.load();
    const students = http.expectOne('/api/students');
    const courses = http.expectOne('/api/courses');
    courses.flush([course]);
    students.error(new ProgressEvent('error'));
    expect((await firstValueFrom(store.state$)).error).toContain('Cannot reach the server');
    load();
    expect((await firstValueFrom(store.state$)).error).toBe('');
  });
});
