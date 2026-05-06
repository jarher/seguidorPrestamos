'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// @spec-guardian: modelo Borrower — ver spec sección 2.2
class Borrower extends Model {}

Borrower.init(
  {
    // PK: UUID generado automáticamente
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // spec 2.2: FK → LenderUser.id
    lenderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'lender_users',
        key: 'id',
      },
    },

    // spec 2.2: NOT NULL
    borrowerFirstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // spec 2.2: NULLABLE
    borrowerLastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // spec 2.2: OPCIONAL, formato email
    borrowerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true, // solo valida si el valor no es null
      },
    },

    // spec 2.2: OPCIONAL, formato E.164 (ej: +573001234567)
    // E.164: '+' seguido de 1-15 dígitos, primer dígito del país no puede ser 0
    borrowerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^\+[1-9]\d{1,14}$/,
          msg: 'borrowerPhone debe estar en formato E.164 (ej: +573001234567)',
        },
      },
    },

    // createdAt y updatedAt: manejados por Sequelize (timestamps: true)
    // deletedAt: manejado por Sequelize (paranoid: true)
  },
  {
    sequelize,
    modelName: 'Borrower',
    tableName: 'borrowers',
    timestamps: true,  // genera createdAt y updatedAt
    paranoid: true,    // activa soft delete via deletedAt
  }
);

module.exports = Borrower;
