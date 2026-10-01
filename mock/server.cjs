const jsonServer = require('json-server');
const { randomUUID } = require('node:crypto');
const { existsSync, copyFileSync } = require('node:fs');
const path = require('node:path');

function createServer(database = path.join(__dirname, 'db.json')) {
  if (typeof database === 'string' && !existsSync(database))
    copyFileSync(path.join(__dirname, 'seed.json'), database);
  const server = jsonServer.create();
  const router = jsonServer.router(database);
  server.use(
    jsonServer.defaults({
      logger: process.env.NODE_ENV !== 'test',
      static: path.join(__dirname, '../public'),
    }),
  );
  server.use(jsonServer.bodyParser);
  server.get('/api/health', (_req, res) => res.json({ status: 'UP', backend: 'JSON Server' }));
  server.use(
    '/api',
    (req, res, next) => {
      const match = req.path.match(/^\/(students|courses)(?:\/([^/]+))?\/?$/);
      if (!match) return res.status(404).json({ message: 'Endpoint not found.' });
      const [, resource, id] = match;
      const db = router.db;
      const rows = db.get(resource).value();
      const existing = id && rows.find((row) => row.id === id);
      if (id && !existing)
        return res.status(404).json({ message: 'This record could not be found.' });
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method))
        return res.status(405).json({ message: 'Method not allowed.' });
      if (['PUT', 'PATCH', 'DELETE'].includes(req.method) && !id)
        return res.status(405).json({ message: 'A record ID is required.' });
      if (req.method === 'POST' && id)
        return res.status(405).json({ message: 'Create records at the collection endpoint.' });
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const value = req.method === 'PATCH' ? { ...existing, ...req.body } : { ...req.body };
        const fail = (message, status = 400) => res.status(status).json({ message });
        const validText = (key, max) =>
          typeof value[key] === 'string' &&
          value[key].trim().length > 0 &&
          value[key].length <= max;
        if (resource === 'students') {
          if (!validText('firstName', 60) || !validText('lastName', 60))
            return fail('First and last name are required (up to 60 characters).');
          if (!validText('email', 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))
            return fail('Enter a valid email address.');
          if (!['Active', 'Inactive'].includes(value.status))
            return fail('Status must be Active or Inactive.');
          if (
            !Array.isArray(value.courseIds) ||
            value.courseIds.some(
              (courseId) =>
                typeof courseId !== 'string' || !db.get('courses').find({ id: courseId }).value(),
            )
          )
            return fail(
              'One or more selected courses no longer exist. Refresh the catalog and try again.',
            );
          value.firstName = value.firstName.trim();
          value.lastName = value.lastName.trim();
          value.email = value.email.trim().toLowerCase();
          if (rows.some((row) => row.id !== id && row.email.toLowerCase() === value.email))
            return fail('A student with this email already exists.', 409);
          req.body = {
            firstName: value.firstName,
            lastName: value.lastName,
            email: value.email,
            status: value.status,
            courseIds: [...new Set(value.courseIds)],
          };
        } else {
          if (!validText('code', 20) || !/^[A-Za-z0-9-]+$/.test(value.code))
            return fail('Course code must contain 1–20 letters, numbers, or hyphens.');
          if (!validText('title', 120) || !validText('instructor', 100))
            return fail(
              'Course title and instructor are required (maximum 120 and 100 characters).',
            );
          if (!Number.isInteger(value.credits) || value.credits < 1 || value.credits > 6)
            return fail('Credits must be a whole number from 1 to 6.');
          if (
            value.description != null &&
            (typeof value.description !== 'string' || value.description.length > 1000)
          )
            return fail('Description must be at most 1000 characters.');
          value.code = value.code.trim().toUpperCase();
          if (rows.some((row) => row.id !== id && row.code.toUpperCase() === value.code))
            return fail('A course with this code already exists.', 409);
          req.body = {
            code: value.code,
            title: value.title.trim(),
            instructor: value.instructor.trim(),
            credits: value.credits,
            description: (value.description ?? '').trim(),
          };
        }
        req.body.id = id ?? randomUUID();
      }
      // One synchronous lowdb write keeps the mock catalog and its enrollments consistent.
      if (req.method === 'DELETE' && resource === 'courses') {
        const state = db.getState();
        db.setState({
          ...state,
          courses: state.courses.filter((course) => course.id !== id),
          students: state.students.map((student) => ({
            ...student,
            courseIds: student.courseIds.filter((courseId) => courseId !== id),
          })),
        }).write();
        return res.status(204).end();
      }
      next();
    },
    router,
  );
  server.use((error, _req, res, _next) =>
    res.status(error.status || 500).json({
      message:
        error.status === 400
          ? 'Invalid JSON request.'
          : 'The server could not complete this request.',
    }),
  );
  return server;
}
if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer(process.env.DB_FILE).listen(port, '127.0.0.1', () =>
    console.log(`JSON Server ready at http://127.0.0.1:${port}/api`),
  );
}
module.exports = { createServer };
