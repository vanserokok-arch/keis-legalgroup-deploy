const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { CORS_ORIGIN } = require('./config');
const { notFoundHandler, errorHandler } = require('./utils/errorHandler');

const app = express();

app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
