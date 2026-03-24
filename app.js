const express = require('express');
const mongoose = require('mongoose');
const Todo = require('./models/Todo');

const app = express();
app.use(express.json());

// ── Existing routes ────────────────────────────
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
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    environment: process.env.APP_ENV || 'development',
    database: dbState === 1 ? 'connected' : 'disconnected'
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

// ── Todo routes ────────────────────────────────
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json({ success: true, count: todos.length, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/todos', async (req, res) => {
  try {
    const todo = await Todo.create({ title: req.body.title });
    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title, completed: req.body.completed },
      { new: true, runValidators: true }
    );
    if (!todo) return res.status(404).json({ success: false, error: 'Todo not found' });
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ success: false, error: 'Todo not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = app;
