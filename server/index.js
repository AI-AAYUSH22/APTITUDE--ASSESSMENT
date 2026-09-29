const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const adminApiRoutes = require('./routes/adminApi');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-inspection / Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// API routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminApiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static build if present
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Assessment API Server is running. Client Vite dev server runs on port 5173.');
    }
  });
});

if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Assessment Platform Server running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`🛡️ Restricted server-side mode active`);
    console.log(`====================================================`);
  });
}

module.exports = app;
