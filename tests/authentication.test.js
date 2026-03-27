import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';

import { startMongoMemory } from './helpers/mongoMemory.js';
import { createApp } from '../server/app.js';

describe('Auth + Loans API (Express + mongodb-memory-server)', () => {
  let stopMongo;
  let baseUrl;
  let server;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'a-valid-secret-that-is-long-enough-for-api-tests';
    process.env.CORS_ORIGIN = 'http://localhost:3000';

    const mongo = await startMongoMemory({ dbName: 'lenders_hq_api_test' });
    stopMongo = mongo.stop;

    const app = createApp({ db: mongo.db, corsOrigin: 'http://localhost:3000' });
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  }, 180000);

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (stopMongo) {
      await stopMongo();
    }
  });

  async function request(path, { method = 'GET', token, body } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  it('register → validate → loans CRUD', async () => {
    const reg = await request('/api/auth/register', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'Password123!', fullName: 'Test User' },
    });
    expect(reg.status).toBe(200);
    expect(reg.data.success).toBe(true);
    expect(typeof reg.data.token).toBe('string');
    expect(reg.data.user.email).toBe('test@example.com');

    const token = reg.data.token;

    const validate = await request('/api/auth/validate', { method: 'POST', token });
    expect(validate.status).toBe(200);
    expect(validate.data.valid).toBe(true);

    const created = await request('/api/loans', {
      method: 'POST',
      token,
      body: {
        loan: {
          id: 'loan1',
          borrowerName: 'Juan Pérez',
          amount: 1000,
          interest: 3,
          startDate: '2026-03-01',
          deadlineDate: '2026-04-01',
          scheme: 'habitual',
          schedule: [],
          paymentsHistory: [],
          status: 'active',
        },
      },
    });
    expect(created.status).toBe(201);
    expect(created.data.loan.id).toBe('loan1');

    const list1 = await request('/api/loans', { method: 'GET', token });
    expect(list1.status).toBe(200);
    expect(Array.isArray(list1.data.loans)).toBe(true);
    expect(list1.data.loans.length).toBe(1);

    const updated = await request('/api/loans/loan1', {
      method: 'PUT',
      token,
      body: { updates: { phone: '+57 300 000 0000' } },
    });
    expect(updated.status).toBe(200);
    expect(updated.data.loan.phone).toBe('+57 300 000 0000');

    const del = await request('/api/loans/loan1', { method: 'DELETE', token });
    expect(del.status).toBe(200);

    const list2 = await request('/api/loans', { method: 'GET', token });
    expect(list2.data.loans.length).toBe(0);
  });

  it('login failure does not enumerate users', async () => {
    await request('/api/auth/register', {
      method: 'POST',
      body: { email: 'known@example.com', password: 'Password123!', fullName: 'Known User' },
    });

    const wrongPwd = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'known@example.com', password: 'WrongPassword123!' },
    });
    const unknown = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'unknown@example.com', password: 'WrongPassword123!' },
    });

    expect(wrongPwd.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPwd.data.error).toBe(unknown.data.error);
  });
});
