'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_schedules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      loanId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      installmentNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      principalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      interestAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      isPaid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      paidAt: {
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
    });

    await queryInterface.addIndex('payment_schedules', ['loanId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payment_schedules');
  },
};