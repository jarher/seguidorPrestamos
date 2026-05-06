'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('loans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      borrowerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'borrowers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      lenderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'lender_users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      principalLoan: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      monthlyRate: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
      },
      loanScheme: {
        type: Sequelize.ENUM('FIXED_INSTALLMENT', 'DECREASING_INSTALLMENT', 'NO_INTEREST'),
        allowNull: false,
      },
      totalMonths: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      maturityDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'DEFAULTED', 'PAID'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      statusUpdatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('loans', ['borrowerId']);
    await queryInterface.addIndex('loans', ['lenderId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('loans');
  },
};