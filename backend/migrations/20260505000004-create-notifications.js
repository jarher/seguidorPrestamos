'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      loanId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scheduledFor: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      type: {
        type: Sequelize.ENUM('UPCOMING', 'DUE_TODAY', 'NO_DUE_DATE_REMINDER'),
        allowNull: false,
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

    await queryInterface.addIndex('notifications', ['lenderId']);
    await queryInterface.addIndex('notifications', ['loanId']);
    await queryInterface.addIndex('notifications', ['scheduledFor']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  },
};