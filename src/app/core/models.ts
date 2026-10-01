export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'Active' | 'Inactive';
  courseIds: string[];
}
export interface Course {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  description: string;
}
export type StudentInput = Omit<Student, 'id'>;
export type CourseInput = Omit<Course, 'id'>;
