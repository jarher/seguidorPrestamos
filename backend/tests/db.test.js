import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Sequelize } from 'sequelize';
import 'dotenv/config';

describe('Database Connection', () => {
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

  it('should connect to PostgreSQL', async () => {
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  it('should execute simple query', async () => {
    const [result] = await sequelize.query('SELECT 1 as test');
    expect(result[0].test).toBe(1);
  });

  it('should have all required tables', async () => {
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      { type: sequelize.QueryTypes.SELECT }
    );

    // El resultado viene como array de arrays: [["lender_users"], ["borrowers"], ...]
    const flatTables = tables.flat();
    const tableNames = flatTables.filter(Boolean);

    expect(tableNames.length).toBe(5);

    expect(tableNames).toContain('lender_users');
    expect(tableNames).toContain('borrowers');
    expect(tableNames).toContain('loans');
    expect(tableNames).toContain('payment_schedules');
    expect(tableNames).toContain('notifications');
  }, 30000);
});