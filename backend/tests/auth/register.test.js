import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, LenderUser } from '../testSetup.js';

describe('POST /api/auth/register (RF-001)', () => {
  const timestamp = Date.now();
  const testUser = {
    userEmail: `reg_${timestamp}@test.com`,
    userPassword: 'password123',
    userFirstName: 'Test',
    userLastName: 'User'
  };

  afterAll(async () => {
    await LenderUser.destroy({ where: { userEmail: testUser.userEmail }, force: true });
  });

  it('registro con datos válidos → 201 + JWT + user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toMatchObject({
      userEmail: testUser.userEmail,
      userFirstName: testUser.userFirstName,
      userLastName: testUser.userLastName
    });
  });

  it('registro con email duplicado → 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('message');
  });

  it('registro con password < 8 caracteres → 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        userEmail: `short_${timestamp}@test.com`,
        userPassword: 'short'
      });

    expect(response.status).toBe(400);
  });

  it('registro con email inválido → 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        userEmail: 'invalid-email',
        userPassword: 'password123'
      });

    expect(response.status).toBe(400);
  });

  it('registro sin userFirstName → 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        userEmail: `nofirstname_${timestamp}@test.com`,
        userPassword: 'password123',
        userFirstName: '',
        userLastName: 'User'
      });

    expect(response.status).toBe(400);
  });

  it('registro sin userLastName → 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        userEmail: `nolastname_${timestamp}@test.com`,
        userPassword: 'password123',
        userFirstName: 'Test',
        userLastName: ''
      });

    expect(response.status).toBe(400);
  });

  it('registro sin campos obligatorios → 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(response.status).toBe(400);
  });
});