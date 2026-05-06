import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Sequelize } from 'sequelize';
import 'dotenv/config';

describe('Database Schema - Columnas de Tablas', () => {
  let sequelize;

  beforeAll(() => {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const expectedColumns = {
    lender_users: ['id', 'userEmail', 'userPassword', 'userFirstName', 'userLastName', 'createdAt', 'updatedAt', 'deletedAt'],
    borrowers: ['id', 'lenderId', 'borrowerFirstName', 'borrowerLastName', 'borrowerEmail', 'borrowerPhone', 'createdAt', 'updatedAt', 'deletedAt'],
    loans: ['id', 'borrowerId', 'lenderId', 'principalLoan', 'monthlyRate', 'loanScheme', 'totalMonths', 'startDate', 'maturityDate', 'status', 'statusUpdatedAt', 'createdAt', 'updatedAt', 'deletedAt'],
    payment_schedules: ['id', 'loanId', 'installmentNumber', 'dueDate', 'principalAmount', 'interestAmount', 'totalAmount', 'isPaid', 'paidAt', 'createdAt', 'updatedAt'],
    notifications: ['id', 'lenderId', 'loanId', 'message', 'scheduledFor', 'isRead', 'type', 'createdAt', 'updatedAt'],
  };

  for (const [table, columns] of Object.entries(expectedColumns)) {
    it(`tabla ${table} debe tener las columnas requeridas`, async () => {
      const result = await sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`,
        { type: sequelize.QueryTypes.SELECT }
      );

      const actualColumns = result.map(r => r.column_name);

      columns.forEach(col => {
        expect(actualColumns).toContain(col, `La columna '${col}' debería existir en '${table}'`);
      });
    }, 30000);
  }
});