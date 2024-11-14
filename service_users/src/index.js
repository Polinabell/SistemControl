require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const pinoHttp = require('pino-http');
const userRoutes = require('./routes/userRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/v1/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy' } });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Service Users listening on port ${PORT}`);
});

