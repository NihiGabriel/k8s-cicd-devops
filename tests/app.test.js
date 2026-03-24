const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/k8s-cicd-devops-test'
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('GET /', () => {
  it('returns welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Hello from Kubernetes!');
    expect(res.body).toHaveProperty('environment');
  });
});

describe('GET /health', () => {
  it('returns healthy status with db field', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('database');
  });
});

describe('GET /info', () => {
  it('returns app info', async () => {
    const res = await request(app).get('/info');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('app');
    expect(res.body).toHaveProperty('version');
  });
});

describe('Todo API', () => {
  let todoId;

  it('POST /todos — creates a todo', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Learn Kubernetes' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Learn Kubernetes');
    expect(res.body.data.completed).toBe(false);
    todoId = res.body.data._id;
  });

  it('GET /todos — returns list of todos', async () => {
    const res = await request(app).get('/todos');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /todos/:id — updates a todo', async () => {
    const res = await request(app)
      .put(`/todos/${todoId}`)
      .send({ completed: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.completed).toBe(true);
  });

  it('DELETE /todos/:id — deletes a todo', async () => {
    const res = await request(app)
      .delete(`/todos/${todoId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /todos/:id — returns 404 for missing todo', async () => {
    const res = await request(app)
      .put(`/todos/000000000000000000000000`)
      .send({ completed: true });
    expect(res.statusCode).toBe(404);
  });
});
