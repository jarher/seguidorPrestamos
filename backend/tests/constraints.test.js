import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Sequelize } from 'sequelize';
import 'dotenv/config';

describe('Database Schema - Constraints', () => {
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

  it('lender_users debe tener userEmail UNIQUE', async () => {
    const result = await sequelize.query(
      `SELECT constraint_name FROM information_schema.table_constraints 
       WHERE table_name = 'lender_users' AND constraint_type = 'UNIQUE' 
       AND constraint_name IN (
         SELECT constraint_name FROM information_schema.constraint_column_usage 
         WHERE table_name = 'lender_users' AND column_name = 'userEmail'
       )`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    expect(result.length).toBeGreaterThan(0);
  }, 30000);

  it('lender_users debe tener campos NOT NULL', async () => {
    const result = await sequelize.query(
      `SELECT column_name, is_nullable FROM information_schema.columns 
       WHERE table_name = 'lender_users' AND column_name IN ('userEmail', 'userPassword', 'userFirstName', 'userLastName')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const notNullColumns = result.map(r => r.column_name);
    expect(notNullColumns).toContain('userEmail');
    expect(notNullColumns).toContain('userPassword');
    expect(notNullColumns).toContain('userFirstName');
    expect(notNullColumns).toContain('userLastName');
  }, 30000);

  it('loans debe tener status con DEFAULT ACTIVE', async () => {
    const result = await sequelize.query(
      `SELECT column_default FROM information_schema.columns 
       WHERE table_name = 'loans' AND column_name = 'status'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const defaultValue = result[0]?.column_default;
    expect(defaultValue).toContain('ACTIVE');
  }, 30000);

  it('payment_schedules debe tener isPaid DEFAULT false', async () => {
    const result = await sequelize.query(
      `SELECT column_default FROM information_schema.columns 
       WHERE table_name = 'payment_schedules' AND column_name = 'isPaid'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const defaultValue = result[0]?.column_default;
    expect(defaultValue).toContain('false');
  }, 30000);

  it('loans debe tener ENUM para loanScheme', async () => {
    const result = await sequelize.query(
      `SELECT typname FROM pg_type WHERE typname LIKE 'enum_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const typeNames = result.map(r => r.typname);
    const hasLoanSchemeEnum = typeNames.some(n => n.includes('loanScheme'));
    expect(hasLoanSchemeEnum).toBe(true);
  }, 30000);

  it('loans debe tener ENUM para status', async () => {
    const result = await sequelize.query(
      `SELECT typname FROM pg_type WHERE typname LIKE 'enum_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const typeNames = result.map(r => r.typname);
    const hasStatusEnum = typeNames.some(n => n.includes('status'));
    expect(hasStatusEnum).toBe(true);
  }, 30000);
});