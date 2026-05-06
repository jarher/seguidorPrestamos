import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Sequelize } from 'sequelize';
import 'dotenv/config';

describe('Database Schema - Foreign Keys', () => {
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

  const foreignKeys = [
    { table: 'borrowers', column: 'lenderId', references: 'lender_users(id)' },
    { table: 'loans', column: 'borrowerId', references: 'borrowers(id)' },
    { table: 'loans', column: 'lenderId', references: 'lender_users(id)' },
    { table: 'payment_schedules', column: 'loanId', references: 'loans(id)' },
    { table: 'notifications', column: 'lenderId', references: 'lender_users(id)' },
    { table: 'notifications', column: 'loanId', references: 'loans(id)' },
  ];

  foreignKeys.forEach(({ table, column, references }) => {
    it(`tabla ${table} debe tener FK ${column} -> ${references}`, async () => {
      const result = await sequelize.query(
        `SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.key_column_usage AS kcu
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = kcu.constraint_name
        WHERE kcu.table_name = '${table}'
          AND kcu.column_name = '${column}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      expect(result).toHaveLength(1);
    }, 30000);
  });

  it('debe tener las relaciones esperadas entre tablas', async () => {
    const result = await sequelize.query(
      `SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const fkRelations = result.flat().map(r => `${r.table_name}.${r.column_name}->${r.foreign_table}`);

    expect(fkRelations).toContain('borrowers.lenderId->lender_users');
    expect(fkRelations).toContain('loans.borrowerId->borrowers');
    expect(fkRelations).toContain('loans.lenderId->lender_users');
    expect(fkRelations).toContain('payment_schedules.loanId->loans');
    expect(fkRelations).toContain('notifications.lenderId->lender_users');
    expect(fkRelations).toContain('notifications.loanId->loans');
  }, 30000);
});