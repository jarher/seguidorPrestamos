import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, LenderUser } from '../testSetup.js';
import bcrypt from 'bcryptjs';

describe('POST /api/auth/login (RF-002)', () => {
  const timestamp = Date.now();
  const testUser = {
    userEmail: `login_${timestamp}@test.com`,
    userPassword: 'password123',
    userFirstName: 'Login',
    userLastName: 'Test'
  };

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testUser.userPassword, 12);
    await LenderUser.create({
      userEmail: testUser.userEmail,
      userPassword: hashedPassword,
      userFirstName: testUser.userFirstName,
      userLastName: testUser.userLastName
    });
  });

  afterAll(async () => {
    await LenderUser.destroy({ where: { userEmail: testUser.userEmail }, force: true });
  });

  it('login con credenciales correctas → 200 + JWT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userEmail: testUser.userEmail,
        userPassword: testUser.userPassword
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.userEmail).toBe(testUser.userEmail);
  });

  it('login con email inexistente → 401 (mensaje genérico)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userEmail: 'nonexistent@example.com',
        userPassword: 'password123'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credenciales inválidas');
  });

  it('login con password incorrecto → 401 (mensaje genérico)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userEmail: testUser.userEmail,
        userPassword: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credenciales inválidas');
  });

  it('login sin email → 400', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userPassword: 'password123'
      });

    expect(response.status).toBe(400);
  });

  it('login sin password → 400', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userEmail: testUser.userEmail
      });

    expect(response.status).toBe(400);
  });

  it('login con email mal formado → 400', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userEmail: 'invalid-email',
        userPassword: 'password123'
      });

    expect(response.status).toBe(400);
  });
});