'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('borrowers', {
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
      borrowerFirstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      borrowerLastName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      borrowerEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      borrowerPhone: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('borrowers', ['lenderId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('borrowers');
  },
};