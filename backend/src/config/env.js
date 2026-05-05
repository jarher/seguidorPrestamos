'use strict';

require('dotenv').config();

const REQUIRED_VARS = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'NODE_ENV',
];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`[env] Missing required env var: ${varName}`);
    process.exit(1);
  }
}

module.exports = {
  PORT:           process.env.PORT,
  DATABASE_URL:   process.env.DATABASE_URL,
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  NODE_ENV:       process.env.NODE_ENV,
};
