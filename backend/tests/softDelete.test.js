import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Sequelize } from 'sequelize';
import 'dotenv/config';

describe('Database Schema - Soft Delete', () => {
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

  const tablesWithSoftDelete = ['lender_users', 'borrowers', 'loans'];
  const tablesWithoutSoftDelete = ['payment_schedules', 'notifications'];

  tablesWithSoftDelete.forEach(table => {
    it(`tabla ${table} debe tener columna deletedAt para soft delete`, async () => {
      const result = await sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = '${table}' AND column_name = 'deletedAt'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const hasDeletedAt = result.length > 0;
      expect(hasDeletedAt).toBe(true);
    }, 30000);
  });

  tablesWithoutSoftDelete.forEach(table => {
    it(`tabla ${table} NO debe tener deletedAt`, async () => {
      const result = await sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = '${table}' AND column_name = 'deletedAt'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const hasDeletedAt = result.length > 0;
      expect(hasDeletedAt).toBe(false);
    }, 30000);
  });

  it('verification: lender_users tiene deletedAt', async () => {
    const result = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'lender_users'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const columns = result.map(r => r.column_name);
    expect(columns).toContain('deletedAt');
  }, 30000);

  it('verification: borrowers tiene deletedAt', async () => {
    const result = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'borrowers'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const columns = result.map(r => r.column_name);
    expect(columns).toContain('deletedAt');
  }, 30000);

  it('verification: loans tiene deletedAt', async () => {
    const result = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'loans'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const columns = result.map(r => r.column_name);
    expect(columns).toContain('deletedAt');
  }, 30000);

  it('verification: payment_schedules NO tiene deletedAt', async () => {
    const result = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'payment_schedules'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const columns = result.map(r => r.column_name);
    expect(columns).not.toContain('deletedAt');
  }, 30000);
});