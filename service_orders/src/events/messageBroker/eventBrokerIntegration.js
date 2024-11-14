const eventBus = require('../EventBus');
const eventTypes = require('../eventTypes');
const MessageBrokerAdapter = require('./MessageBrokerAdapter');
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

let messageBroker = null;

const initializeMessageBroker = async () => {
  try {
    messageBroker = new MessageBrokerAdapter({
      enabled: process.env.MESSAGE_BROKER_ENABLED === 'true',
    });

    await messageBroker.connect();

    eventBus.subscribe(eventTypes.ORDER_CREATED, async (event) => {
      try {
        await messageBroker.publish('order.created', event);
      } catch (error) {
        logger.error({ error, event }, 'Failed to publish ORDER_CREATED to message broker');
      }
    });

    eventBus.subscribe(eventTypes.ORDER_STATUS_UPDATED, async (event) => {
      try {
        await messageBroker.publish('order.status.updated', event);
      } catch (error) {
        logger.error({ error, event }, 'Failed to publish ORDER_STATUS_UPDATED to message broker');
      }
    });

    eventBus.subscribe(eventTypes.ORDER_CANCELLED, async (event) => {
      try {
        await messageBroker.publish('order.cancelled', event);
      } catch (error) {
        logger.error({ error, event }, 'Failed to publish ORDER_CANCELLED to message broker');
      }
    });

    logger.info('Message broker integration initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize message broker');
  }
};

const getMessageBroker = () => {
  return messageBroker;
};

module.exports = {
  initializeMessageBroker,
  getMessageBroker,
};

