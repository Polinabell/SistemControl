const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const handleOrderCreated = (event) => {
  logger.info(
    {
      eventId: event.id,
      orderId: event.data.orderId,
      userId: event.data.userId,
      total: event.data.total,
      timestamp: event.timestamp,
    },
    'Order created event received'
  );
};

module.exports = handleOrderCreated;

