const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ errors: { body: ['Not found'] } }));
app.use(errorHandler);

const start = () => {
  if (config.sslKeyFile && config.sslCertFile) {
    try {
      const credentials = {
        key: fs.readFileSync(config.sslKeyFile),
        cert: fs.readFileSync(config.sslCertFile),
      };
      https.createServer(credentials, app).listen(config.port, () => {
        console.log(`API listening (HTTPS) on https://localhost:${config.port}/api`);
      });
      return;
    } catch (err) {
      console.warn('Failed to start HTTPS server, falling back to HTTP:', err.message);
    }
  }

  http.createServer(app).listen(config.port, () => {
    console.log(`API listening (HTTP) on http://localhost:${config.port}/api`);
  });
};

start();
