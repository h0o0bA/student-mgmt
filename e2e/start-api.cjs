const { createServer } = require('../mock/server.cjs');
process.env.NODE_ENV = 'test';
createServer(structuredClone(require('../mock/seed.json'))).listen(3001, '127.0.0.1');
