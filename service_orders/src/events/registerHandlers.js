const eventBus = require('./EventBus');
const eventTypes = require('./eventTypes');
const handleOrderCreated = require('./handlers/orderCreatedHandler');
const handleOrderStatusUpdated = require('./handlers/orderStatusUpdatedHandler');

const registerEventHandlers = () => {
  eventBus.subscribe(eventTypes.ORDER_CREATED, handleOrderCreated);
  eventBus.subscribe(eventTypes.ORDER_STATUS_UPDATED, handleOrderStatusUpdated);
};

module.exports = registerEventHandlers;

