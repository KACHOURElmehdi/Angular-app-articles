const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  sslKeyFile: process.env.SSL_KEY_FILE ? path.resolve(process.env.SSL_KEY_FILE) : null,
  sslCertFile: process.env.SSL_CERT_FILE ? path.resolve(process.env.SSL_CERT_FILE) : null,
};

module.exports = config;
