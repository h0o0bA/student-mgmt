// Run only against a local/CI test backend. Creates temporary records and removes them.
const assert = require('node:assert/strict');
const { mkdirSync, readFileSync, writeFileSync, unlinkSync } = require('node:fs');

const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:18080';
const stateFile = 'test-results/deployment-records.json';
const phase = process.argv[2];

async function request(path, method = 'GET', body, expected = 200) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(response.status, expected, `${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  assert.ok(
    ['write', 'verify'].includes(phase),
    'Use: node scripts/check-deployment.cjs write|verify',
  );
  for (let attempt = 0; ; attempt++) {
    try {
      assert.equal((await request('/health')).backend, 'Spring Boot');
      break;
    } catch (error) {
      if (attempt >= 59) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (phase === 'write') {
    const suffix = Date.now();
    const course = await request(
      '/courses',
      'POST',
      {
        code: `SMOKE${suffix}`,
        title: 'Deployment smoke test',
        instructor: 'Test instructor',
        credits: 3,
        description: '',
      },
      201,
    );
    const student = await request(
      '/students',
      'POST',
      {
        firstName: 'Deployment',
        lastName: 'Test',
        email: `smoke${suffix}@example.com`,
        status: 'Active',
        courseIds: [course.id],
      },
      201,
    );
    await request(
      '/courses',
      'POST',
      { code: 'BAD', title: 'Invalid', instructor: 'Test', credits: 9 },
      400,
    );
    mkdirSync('test-results', { recursive: true });
    writeFileSync(stateFile, JSON.stringify({ course, student }));
    console.log('CRUD and validation passed. Restart the backend, then run the verify phase.');
  } else {
    const { course, student } = JSON.parse(readFileSync(stateFile, 'utf8'));
    assert.equal((await request(`/courses/${course.id}`)).title, course.title);
    assert.deepEqual((await request(`/students/${student.id}`)).courseIds, [course.id]);
    const { id, ...input } = student;
    await request(`/students/${id}`, 'PUT', { ...input, lastName: 'Updated' });
    await request(`/courses/${course.id}`, 'DELETE', undefined, 204);
    assert.deepEqual((await request(`/students/${id}`)).courseIds, []);
    await request(`/students/${id}`, 'DELETE', undefined, 204);
    await request(`/students/${id}`, 'GET', undefined, 404);
    unlinkSync(stateFile);
    console.log('Restart persistence, updates, enrollment cleanup, and deletion passed.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
