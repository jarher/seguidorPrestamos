'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// @spec-guardian: modelo LenderUser — ver spec sección 2.1
class LenderUser extends Model {}

LenderUser.init(
  {
    // PK: UUID generado automáticamente
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    // spec 2.1: UNIQUE, NOT NULL, formato email
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },

    // spec 2.1: NOT NULL, mín 8 caracteres (el hash se guarda tal cual)
    // Nota: NO se define getter() — se almacena el hash sin transformar
    userPassword: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 1024], // mínimo 8; el hash siempre superará esto
      },
    },

    // spec 2.1: NOT NULL
    userFirstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // spec 2.1: NOT NULL
    userLastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // createdAt y updatedAt son manejados por Sequelize (timestamps: true)
    // deletedAt es manejado por Sequelize (paranoid: true)
  },
  {
    sequelize,
    modelName: 'LenderUser',
    tableName: 'lender_users', // spec: snake_case
    timestamps: true,          // genera createdAt y updatedAt
    paranoid: true,            // activa soft delete via deletedAt
  }
);

module.exports = LenderUser;
