const EventEmitter = require('events');
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.messageQueue = [];
  }

  publish(eventName, eventData) {
    const event = {
      name: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
      id: require('uuid').v4(),
    };

    logger.info({ event }, `Publishing domain event: ${eventName}`);

    this.messageQueue.push(event);

    this.emit(eventName, event);

    return event;
  }

  subscribe(eventName, handler) {
    logger.info(`Subscribing to event: ${eventName}`);
    this.on(eventName, handler);
  }

  getQueuedMessages() {
    return [...this.messageQueue];
  }

  clearQueue() {
    this.messageQueue = [];
  }

  async publishToMessageBroker(event) {
    logger.info({ event }, 'Message broker integration not configured. Event queued for future processing.');
  }
}

const eventBus = new EventBus();

module.exports = eventBus;

