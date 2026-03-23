const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Kubernetes!',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/info', (req, res) => {
  res.json({
    app: 'k8s-cicd-devops',
    node_version: process.version,
    platform: process.platform
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
