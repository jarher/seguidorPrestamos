import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, LenderUser, Borrower, Loan, Notification, sequelize } from '../testSetup.js';
import { calculatePaymentSchedule } from '../../src/services/loanCalculator.js';

describe('Notificaciones de Préstamo - DECREASING_INSTALLMENT (RF-012)', () => {
  const startDate = '2026-01-01';

  afterAll(async () => {
    await Notification.destroy({ where: {}, force: true });
    await Loan.destroy({ where: {}, force: true });
    await Borrower.destroy({ where: {}, force: true });
    await LenderUser.destroy({ where: {}, force: true });
  });

  it('debe generar notificaciones upcoming (-2 días) y due_today por cada cuota', async () => {
    const timestamp = Date.now();
    const email = `notif1_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Test',
      userLastName: 'Lender'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Juan',
      borrowerLastName: 'Perez',
      borrowerEmail: 'juan@test.com',
      borrowerPhone: '+573001234567'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const loanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        borrowerId: borrower.id,
        principalLoan: 1000000,
        monthlyRate: 0.02,
        loanScheme: 'DECREASING_INSTALLMENT',
        totalMonths: 6,
        startDate: startDate
      });

    expect(loanRes.status).toBe(201);
    expect(loanRes.body.schedule.length).toBe(6);

    const upcomingCount = await Notification.count({
      where: { loanId: loanRes.body.loan.id, type: 'UPCOMING' }
    });
    const dueTodayCount = await Notification.count({
      where: { loanId: loanRes.body.loan.id, type: 'DUE_TODAY' }
    });

    expect(upcomingCount).toBe(6);
    expect(dueTodayCount).toBe(6);
  });

  it('debe generar notificacion upcoming 2 días antes del vencimiento', async () => {
    const timestamp = Date.now() + 1;
    const email = `notif2_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Test',
      userLastName: 'Lender'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Maria',
      borrowerLastName: ' Garcia',
      borrowerEmail: 'maria@test.com',
      borrowerPhone: '+573009999999'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const loanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        borrowerId: borrower.id,
        principalLoan: 1000000,
        monthlyRate: 0.02,
        loanScheme: 'DECREASING_INSTALLMENT',
        totalMonths: 6,
        startDate: startDate
      });

    const firstDueDate = new Date(loanRes.body.schedule[0].dueDate);
    const expectedUpcoming = new Date(firstDueDate);
    expectedUpcoming.setDate(expectedUpcoming.getDate() - 2);

    const upcomingNotifications = await Notification.findAll({
      where: { loanId: loanRes.body.loan.id, type: 'UPCOMING' },
      order: [['scheduledFor', 'ASC']],
      limit: 1
    });

    const notificationDate = new Date(upcomingNotifications[0].scheduledFor);
    expect(notificationDate.toISOString().split('T')[0]).toBe(expectedUpcoming.toISOString().split('T')[0]);
  });

  it('debe generar notificacion DUE_TODAY el día del vencimiento', async () => {
    const timestamp = Date.now() + 2;
    const email = `notif3_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Test',
      userLastName: 'Lender'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Carlos',
      borrowerLastName: 'Rodriguez',
      borrowerEmail: 'carlos@test.com',
      borrowerPhone: '+573007777777'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const loanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        borrowerId: borrower.id,
        principalLoan: 1000000,
        monthlyRate: 0.02,
        loanScheme: 'DECREASING_INSTALLMENT',
        totalMonths: 6,
        startDate: startDate
      });

    const dueTodayNotifications = await Notification.findAll({
      where: { loanId: loanRes.body.loan.id, type: 'DUE_TODAY' },
      order: [['scheduledFor', 'ASC']],
      limit: 1
    });

    expect(dueTodayNotifications[0].scheduledFor.toISOString().split('T')[0])
      .toBe(loanRes.body.schedule[0].dueDate);
  });

  it('el interés debe disminuir mes a mes (DECREASING)', async () => {
    const timestamp = Date.now() + 3;
    const email = `notif4_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Test',
      userLastName: 'Lender'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Ana',
      borrowerLastName: 'Lopez',
      borrowerEmail: 'ana@test.com',
      borrowerPhone: '+573006666666'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const schedule = calculatePaymentSchedule({
      principalLoan: 1000000,
      monthlyRate: 0.02,
      loanScheme: 'DECREASING_INSTALLMENT',
      totalMonths: 6,
      startDate: startDate
    });

    for (let i = 0; i < schedule.length - 1; i++) {
      expect(schedule[i].interestAmount).toBeGreaterThan(schedule[i + 1].interestAmount);
    }
  });

  it('el mensaje debe mostrar principal + interés para DUE_TODAY', async () => {
    const timestamp = Date.now() + 4;
    const email = `notif5_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Test',
      userLastName: 'Lender'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Luis',
      borrowerLastName: 'Martinez',
      borrowerEmail: 'luis@test.com',
      borrowerPhone: '+573005555555'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const loanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        borrowerId: borrower.id,
        principalLoan: 1000000,
        monthlyRate: 0.02,
        loanScheme: 'DECREASING_INSTALLMENT',
        totalMonths: 6,
        startDate: startDate
      });

    const dueTodayNotifications = await Notification.findAll({
      where: { loanId: loanRes.body.loan.id, type: 'DUE_TODAY' },
      limit: 1
    });

    expect(dueTodayNotifications[0].message).toContain('COBRO HOY');
    expect(dueTodayNotifications[0].message).toContain('capital');
    expect(dueTodayNotifications[0].message).toContain('interés');
  });

  it('debe generar notificacion NO_DUE_DATE_REMINDER cuando no hay maturityDate', async () => {
    const timestamp = Date.now() + 5;
    const email = `notif6_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Test',
      userLastName: 'Lender'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Sofia',
      borrowerLastName: 'Diaz',
      borrowerEmail: 'sofia@test.com',
      borrowerPhone: '+573004444444'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const loanData = {
      borrowerId: borrower.id,
      principalLoan: 1000000,
      monthlyRate: 0.02,
      loanScheme: 'DECREASING_INSTALLMENT',
      totalMonths: 6,
      startDate: startDate
    };

    const loanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send(loanData);

    if (loanRes.status !== 201) {
      console.log('Error creating loan:', loanRes.status, loanRes.body);
    }

    const noDueDateNotification = await Notification.findOne({
      where: { loanId: loanRes.body.loan.id, type: 'NO_DUE_DATE_REMINDER' }
    });

    expect(noDueDateNotification).not.toBeNull();
    expect(noDueDateNotification.message).toContain('SIN FECHA LÍMITE');
  });

  it('debe generar exactamente 2 notificaciones por cuota (upcoming + due_today)', async () => {
    const timestamp = Date.now() + 6;
    const email = `notif7_${timestamp}@test.com`;

    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    const lender = await LenderUser.create({
      userEmail: email,
      userPassword: hashedPassword,
      userFirstName: 'Test',
      userLastName: 'Lender'
    });

    const borrower = await Borrower.create({
      lenderId: lender.id,
      borrowerFirstName: 'Pedro',
      borrowerLastName: 'Sanchez',
      borrowerEmail: 'pedro@test.com',
      borrowerPhone: '+573003333333'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userEmail: email, userPassword: 'password123' });
    const token = loginRes.body.token;

    const loanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        borrowerId: borrower.id,
        principalLoan: 900000,
        monthlyRate: 0.02,
        loanScheme: 'DECREASING_INSTALLMENT',
        totalMonths: 3,
        startDate: startDate
      });

    const upcomingCount = await Notification.count({
      where: { loanId: loanRes.body.loan.id, type: 'UPCOMING' }
    });
    const dueTodayCount = await Notification.count({
      where: { loanId: loanRes.body.loan.id, type: 'DUE_TODAY' }
    });
    const noDueDateCount = await Notification.count({
      where: { loanId: loanRes.body.loan.id, type: 'NO_DUE_DATE_REMINDER' }
    });

    expect(upcomingCount).toBe(3);
    expect(dueTodayCount).toBe(3);
    expect(noDueDateCount).toBe(1);
  });
});