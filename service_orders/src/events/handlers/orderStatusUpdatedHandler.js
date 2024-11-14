const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const handleOrderStatusUpdated = (event) => {
  logger.info(
    {
      eventId: event.id,
      orderId: event.data.orderId,
      oldStatus: event.data.oldStatus,
      newStatus: event.data.newStatus,
      timestamp: event.timestamp,
    },
    'Order status updated event received'
  );
};

module.exports = handleOrderStatusUpdated;

