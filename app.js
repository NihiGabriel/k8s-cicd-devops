const express = require('express');
const mongoose = require('mongoose');
const Todo = require('./models/Todo');

const app = express();
app.use(express.json());

// ── Database connection ────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/k8s-cicd-devops';

let dbConnected = false;

mongoose.connect(MONGO_URI)
  .then(() => {
    dbConnected = true;
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

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
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    environment: process.env.APP_ENV || 'development',
    database: dbConnected ? 'connected' : 'disconnected'
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

// GET /todos — list all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json({ success: true, count: todos.length, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /todos — create a todo
app.post('/todos', async (req, res) => {
  try {
    const todo = await Todo.create({ title: req.body.title });
    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /todos/:id — update a todo
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

// DELETE /todos/:id — delete a todo
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
