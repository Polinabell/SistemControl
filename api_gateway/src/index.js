require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { v4: uuidv4 } = require('uuid');
const { verifyJWT } = require('./middleware/authMiddleware');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  req.headers['x-request-id'] = req.id;
  next();
});

app.use(pinoHttp({ logger }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

app.use(limiter);

const publicPaths = ['/v1/users/register', '/v1/users/login', '/health'];

app.use((req, res, next) => {
  const isPublicPath = publicPaths.some((path) => req.path.startsWith(path));
  if (!isPublicPath) {
    return verifyJWT(req, res, next);
  }
  next();
});

const SERVICE_USERS_URL = process.env.SERVICE_USERS_URL || 'http://service_users:3001';
const SERVICE_ORDERS_URL = process.env.SERVICE_ORDERS_URL || 'http://service_orders:3002';

app.use(
  '/v1/users',
  createProxyMiddleware({
    target: SERVICE_USERS_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Request-ID', req.id);
    },
    onError: (err, req, res) => {
      logger.error({ err, requestId: req.id }, 'Proxy error to service_users');
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Users service is unavailable',
        },
      });
    },
  })
);

app.use(
  '/v1/orders',
  createProxyMiddleware({
    target: SERVICE_ORDERS_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Request-ID', req.id);
    },
    onError: (err, req, res) => {
      logger.error({ err, requestId: req.id }, 'Proxy error to service_orders');
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Orders service is unavailable',
        },
      });
    },
  })
);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy' } });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

