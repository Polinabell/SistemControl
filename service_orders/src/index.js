require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const pinoHttp = require('pino-http');
const orderRoutes = require('./routes/orderRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const registerEventHandlers = require('./events/registerHandlers');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

registerEventHandlers();
logger.info('Domain event handlers registered');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/v1/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy' } });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Service Orders listening on port ${PORT}`);
});

