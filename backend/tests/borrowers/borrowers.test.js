import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, LenderUser, Borrower, Loan, Notification } from '../testSetup.js';

describe('BORROWERS (RF-003, RF-004, RF-005)', () => {
  const startDate = '2026-01-01';

  afterAll(async () => {
    await Notification.destroy({ where: {}, force: true });
    await Loan.destroy({ where: {}, force: true });
    await Borrower.destroy({ where: {}, force: true });
    await LenderUser.destroy({ where: {}, force: true });
  });

  it('RF-003: crear borrower solo con firstName → 201', async () => {
    const timestamp = Date.now();
    const email = `borrow1_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Lender',
      userLastName: 'Test'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/borrowers')
      .set('Authorization', `Bearer ${token}`)
      .send({ borrowerFirstName: 'Juan' });

    expect(res.status).toBe(201);
    expect(res.body.borrowerFirstName).toBe('Juan');
    expect(res.body.borrowerLastName).toBeNull();
  });

  it('RF-003: crear borrower con todos los campos → 201', async () => {
    const timestamp = Date.now() + 1;
    const email = `borrow2_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Lender',
      userLastName: 'Test'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/borrowers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        borrowerFirstName: 'Maria',
        borrowerLastName: 'Garcia',
        borrowerEmail: 'maria@test.com',
        borrowerPhone: '+573001234567'
      });

    expect(res.status).toBe(201);
    expect(res.body.borrowerFirstName).toBe('Maria');
    expect(res.body.borrowerLastName).toBe('Garcia');
    expect(res.body.borrowerEmail).toBe('maria@test.com');
    expect(res.body.borrowerPhone).toBe('+573001234567');
  });

  it('RF-003: crear borrower con email inválido → 400', async () => {
    const timestamp = Date.now() + 2;
    const email = `borrow3_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Lender',
      userLastName: 'Test'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/borrowers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        borrowerFirstName: 'Carlos',
        borrowerEmail: 'invalid-email'
      });

    expect(res.status).toBe(400);
  });

  it('RF-003: listar borrowers → 200', async () => {
    const timestamp = Date.now() + 3;
    const email = `borrow4_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Lender',
      userLastName: 'Test'
    });

    await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Pedro',
      borrowerLastName: 'Rodriguez'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/borrowers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('RF-004: editar phone de borrower → solo phone cambia', async () => {
    const timestamp = Date.now() + 4;
    const email = `borrow5_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Lender',
      userLastName: 'Test'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Ana',
      borrowerLastName: 'Lopez',
      borrowerPhone: '+573000000000'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .put(`/api/borrowers/${borrower.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ borrowerPhone: '+573009999999' });

    expect(res.status).toBe(200);
    expect(res.body.borrowerPhone).toBe('+573009999999');
    expect(res.body.borrowerFirstName).toBe('Ana');
    expect(res.body.borrowerLastName).toBe('Lopez');
  });

  it('RF-004: editar borrower de otro lender → 403/404', async () => {
    const timestamp = Date.now() + 5;
    const email1 = `borrow6a_${timestamp}@test.com`;
    const email2 = `borrow6b_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender1 = await LenderUser.create({
      userEmail: email1,
      userPassword: hashedPassword,
      userFirstName: 'Lender1',
      userLastName: 'Test'
    });

    const lender2 = await LenderUser.create({
      userEmail: email2,
      userPassword: hashedPassword,
      userFirstName: 'Lender2',
      userLastName: 'Test'
    });

    const borrower = await Borrower.create({
      lenderId: lender1.id,
      borrowerFirstName: 'Luis',
      borrowerLastName: 'Martinez'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email2, userPassword: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .put(`/api/borrowers/${borrower.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ borrowerPhone: '+573009999999' });

    expect(res.status).toBeGreaterThanOrEqual(403);
    expect([403, 404]).toContain(res.status);
  });

  it('RF-005: eliminar borrower → soft delete', async () => {
    const timestamp = Date.now() + 6;
    const email = `borrow7_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Lender',
      userLastName: 'Test'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Sofia',
      borrowerLastName: 'Diaz'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .delete(`/api/borrowers/${borrower.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Prestatario eliminado');

    const listRes = await request(app)
      .get('/api/borrowers')
      .set('Authorization', `Bearer ${token}`);

    const existsInList = listRes.body.some(b => b.id === borrower.id);
    expect(existsInList).toBe(false);
  });
});