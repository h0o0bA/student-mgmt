const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
const { createServer } = require('./server.cjs');
const seed = require('./seed.json');
let server, base;
beforeEach(async () => {
  server = createServer(structuredClone(seed)).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});
const request = (url, method = 'GET', body) =>
  fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
const student = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  status: 'Active',
  courseIds: ['c1', 'c2'],
};
const course = {
  code: 'TEST101',
  title: 'Testing',
  instructor: 'Prof. Test',
  credits: 3,
  description: '',
};
test('student CRUD persists updates and deletions', async () => {
  const created = await request('/students', 'POST', student);
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(typeof body.id, 'string');
  const updated = await request(`/students/${body.id}`, 'PUT', {
    ...student,
    firstName: 'Grace',
    courseIds: ['c2'],
  });
  assert.equal(updated.status, 200);
  assert.equal((await (await request(`/students/${body.id}`)).json()).firstName, 'Grace');
  assert.equal((await request(`/students/${body.id}`, 'DELETE')).status, 200);
  assert.equal((await request(`/students/${body.id}`)).status, 404);
});
test('course CRUD and deletion remove all enrollment references', async () => {
  const created = await request('/courses', 'POST', course);
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(
    (await request(`/courses/${body.id}`, 'PUT', { ...course, title: 'Updated title' })).status,
    200,
  );
  assert.equal((await (await request(`/courses/${body.id}`)).json()).title, 'Updated title');
  assert.equal((await request('/courses/c1', 'DELETE')).status, 204);
  const students = await (await request('/students')).json();
  assert.ok(students.every((s) => !s.courseIds.includes('c1')));
  assert.equal(students.length, 8);
});
test('rejects invalid fields and missing course references', async () => {
  assert.equal((await request('/students', 'POST', { ...student, email: 'invalid' })).status, 400);
  assert.equal((await request('/students', 'POST', { ...student, firstName: '  ' })).status, 400);
  assert.equal(
    (await request('/students', 'POST', { ...student, courseIds: ['missing'] })).status,
    400,
  );
  assert.equal((await request('/courses', 'POST', { ...course, credits: 2.5 })).status, 400);
  assert.equal((await request('/courses', 'POST', { ...course, credits: 9 })).status, 400);
});
test('enforces case-insensitive uniqueness', async () => {
  assert.equal(
    (
      await request('/students', 'POST', {
        ...student,
        email: seed.students[0].email.toUpperCase(),
      })
    ).status,
    409,
  );
  assert.equal((await request('/courses', 'POST', { ...course, code: 'cs101' })).status, 409);
});
test('PATCH cannot bypass validation or change IDs', async () => {
  assert.equal((await request('/courses/c1', 'PATCH', { credits: 0 })).status, 400);
  const updated = await (
    await request('/courses/c1', 'PATCH', { id: 'changed', title: 'Updated' })
  ).json();
  assert.equal(updated.id, 'c1');
  assert.equal(updated.title, 'Updated');
});
test('deduplicates enrollments and reports nonexistent records', async () => {
  const created = await (
    await request('/students', 'POST', { ...student, courseIds: ['c1', 'c1'] })
  ).json();
  assert.deepEqual(created.courseIds, ['c1']);
  assert.equal((await request('/students/missing', 'DELETE')).status, 404);
  assert.equal((await request('/courses/missing', 'PUT', course)).status, 404);
});
test('failed updates leave the previous record unchanged', async () => {
  const before = await (await request('/students/s1')).json();
  assert.equal(
    (await request('/students/s1', 'PUT', { ...student, courseIds: ['missing'] })).status,
    400,
  );
  assert.deepEqual(await (await request('/students/s1')).json(), before);
});
