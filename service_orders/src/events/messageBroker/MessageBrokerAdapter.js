const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

class MessageBrokerAdapter {
  constructor(config = {}) {
    this.config = {
      type: config.type || process.env.MESSAGE_BROKER_TYPE || 'rabbitmq',
      host: config.host || process.env.MESSAGE_BROKER_HOST || 'localhost',
      port: config.port || process.env.MESSAGE_BROKER_PORT || 5672,
      username: config.username || process.env.MESSAGE_BROKER_USERNAME || 'guest',
      password: config.password || process.env.MESSAGE_BROKER_PASSWORD || 'guest',
      exchange: config.exchange || 'orders_exchange',
      enabled: config.enabled || process.env.MESSAGE_BROKER_ENABLED === 'true',
    };
    
    this.connected = false;
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (!this.config.enabled) {
      logger.info('Message broker integration is disabled');
      return;
    }

    try {
      logger.info({ config: this.config }, 'Attempting to connect to message broker');
      
      this.connected = true;
      logger.info('Message broker connection established (stub)');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to message broker');
      throw error;
    }
  }

  async publish(routingKey, message) {
    if (!this.config.enabled) {
      logger.debug({ routingKey, message }, 'Message broker disabled - event not published');
      return;
    }

    try {
      logger.info(
        {
          exchange: this.config.exchange,
          routingKey,
          message,
        },
        'Publishing message to broker (stub)'
      );

      return true;
    } catch (error) {
      logger.error({ error, routingKey, message }, 'Failed to publish message');
      throw error;
    }
  }

  async subscribe(queueName, routingKey, handler) {
    if (!this.config.enabled) {
      logger.debug({ queueName, routingKey }, 'Message broker disabled - subscription not created');
      return;
    }

    try {
      logger.info(
        {
          queueName,
          routingKey,
        },
        'Subscribing to queue (stub)'
      );

      return true;
    } catch (error) {
      logger.error({ error, queueName, routingKey }, 'Failed to subscribe to queue');
      throw error;
    }
  }

  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      logger.info('Disconnecting from message broker');
      this.connected = false;
      this.connection = null;
      this.channel = null;
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from message broker');
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = MessageBrokerAdapter;

