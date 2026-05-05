'use strict';

const { Sequelize } = require('sequelize');
const { DATABASE_URL, NODE_ENV } = require('./env');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Verificación de conexión al ejecutar directamente
if (require.main === module) {
  sequelize
    .authenticate()
    .then(() => {
      console.log('Conexión establecida con PostgreSQL');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error al conectar con PostgreSQL:', err.message);
      process.exit(1);
    });
}

module.exports = sequelize;
