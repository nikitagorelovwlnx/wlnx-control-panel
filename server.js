const express = require('express');
const path = require('path');
const serveStatic = require('serve-static');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from current directory
app.use(serveStatic('.', {
  'index': ['index.html']
}));

// Serve CSS files with correct MIME type
app.use('/dist', express.static('dist', {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'wlnx-control-panel' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`WLNX Control Panel server listening on port ${port}`);
});
