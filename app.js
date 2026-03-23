const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Kubernetes!',
    app: process.env.APP_NAME || 'k8s-cicd-devops',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.APP_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    environment: process.env.APP_ENV || 'development'
  });
});

app.get('/info', (req, res) => {
  res.json({
    app: process.env.APP_NAME || 'k8s-cicd-devops',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.APP_ENV || 'development',
    node_version: process.version,
    platform: process.platform
  });
});

module.exports = app;
