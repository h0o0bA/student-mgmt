import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin, tap } from 'rxjs';
import { Course, CourseInput, Student, StudentInput } from './models';

@Injectable({ providedIn: 'root' })
export class Store {
  private http = inject(HttpClient);
  private state = new BehaviorSubject({
    students: [] as Student[],
    courses: [] as Course[],
    loading: true,
    error: '',
  });
  readonly state$ = this.state.asObservable();

  load() {
    this.state.next({ ...this.state.value, loading: true, error: '' });
    forkJoin({
      students: this.http.get<Student[]>('/api/students'),
      courses: this.http.get<Course[]>('/api/courses'),
    }).subscribe({
      next: (data) => this.state.next({ ...data, loading: false, error: '' }),
      error: (error: Error) =>
        this.state.next({ ...this.state.value, loading: false, error: error.message }),
    });
  }
  student(id: string) {
    return this.http.get<Student>(`/api/students/${encodeURIComponent(id)}`);
  }
  course(id: string) {
    return this.http.get<Course>(`/api/courses/${encodeURIComponent(id)}`);
  }
  saveStudent(value: StudentInput, id?: string) {
    const request = id
      ? this.http.put<Student>(`/api/students/${encodeURIComponent(id)}`, value)
      : this.http.post<Student>('/api/students', value);
    return request.pipe(
      tap((student) => {
        const students = [
          ...this.state.value.students.filter((item) => item.id !== student.id),
          student,
        ];
        this.state.next({ ...this.state.value, students });
      }),
    );
  }
  saveCourse(value: CourseInput, id?: string) {
    const request = id
      ? this.http.put<Course>(`/api/courses/${encodeURIComponent(id)}`, value)
      : this.http.post<Course>('/api/courses', value);
    return request.pipe(
      tap((course) => {
        const courses = [
          ...this.state.value.courses.filter((item) => item.id !== course.id),
          course,
        ];
        this.state.next({ ...this.state.value, courses });
      }),
    );
  }
  deleteStudent(id: string) {
    return this.http.delete(`/api/students/${encodeURIComponent(id)}`).pipe(
      tap(() => {
        this.state.next({
          ...this.state.value,
          students: this.state.value.students.filter((item) => item.id !== id),
        });
      }),
    );
  }
  deleteCourse(id: string) {
    return this.http.delete(`/api/courses/${encodeURIComponent(id)}`).pipe(
      tap(() => {
        this.state.next({
          ...this.state.value,
          courses: this.state.value.courses.filter((item) => item.id !== id),
          students: this.state.value.students.map((student) => ({
            ...student,
            courseIds: student.courseIds.filter((courseId) => courseId !== id),
          })),
        });
      }),
    );
  }
}
