const { onRequest } = require('firebase-functions/v2/https');
const app = require('../server/index');

exports.api = onRequest({
  cors: true,
  memory: '512MiB',
  timeoutSeconds: 60,
  maxInstances: 100
}, app);
