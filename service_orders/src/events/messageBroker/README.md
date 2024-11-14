# Интеграция с брокером сообщений

## Описание

Заготовка для интеграции с брокером сообщений (RabbitMQ/Kafka) для публикации доменных событий заказов.

## Текущий статус

**Реализовано:**
- ✅ Архитектура адаптера для брокера сообщений
- ✅ Интеграция с системой доменных событий
- ✅ Автоматическая публикация событий в брокер (при включении)
- ✅ Заглушки для всех методов

**В разработке (следующие итерации):**
- ⏳ Реальная интеграция с RabbitMQ
- ⏳ Реальная интеграция с Kafka
- ⏳ Обработка ошибок и retry логика
- ⏳ Dead letter queue для неудачных сообщений

## Конфигурация

Настройка через переменные окружения:

```env
MESSAGE_BROKER_ENABLED=false
MESSAGE_BROKER_TYPE=rabbitmq
MESSAGE_BROKER_HOST=localhost
MESSAGE_BROKER_PORT=5672
MESSAGE_BROKER_USERNAME=guest
MESSAGE_BROKER_PASSWORD=guest
```

## События

### 1. order.created
Публикуется при создании нового заказа.

**Payload:**
```json
{
  "name": "order.created",
  "id": "uuid",
  "timestamp": "ISO-8601",
  "data": {
    "orderId": "uuid",
    "userId": "uuid",
    "items": [...],
    "total": 12550.00,
    "status": "created"
  }
}
```

### 2. order.status.updated
Публикуется при обновлении статуса заказа.

**Payload:**
```json
{
  "name": "order.status.updated",
  "id": "uuid",
  "timestamp": "ISO-8601",
  "data": {
    "orderId": "uuid",
    "userId": "uuid",
    "oldStatus": "created",
    "newStatus": "in_progress"
  }
}
```

### 3. order.cancelled
Публикуется при отмене заказа.

**Payload:**
```json
{
  "name": "order.cancelled",
  "id": "uuid",
  "timestamp": "ISO-8601",
  "data": {
    "orderId": "uuid",
    "userId": "uuid",
    "oldStatus": "created",
    "newStatus": "cancelled"
  }
}
```

## Включение брокера

1. Установите переменную окружения:
```bash
MESSAGE_BROKER_ENABLED=true
```

2. Настройте параметры подключения к вашему брокеру

3. Реализуйте реальные методы в `MessageBrokerAdapter.js`

## Пример реальной интеграции с RabbitMQ

```javascript
const amqp = require('amqplib');

async connect() {
  const connectionString = `amqp://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}`;
  this.connection = await amqp.connect(connectionString);
  this.channel = await this.connection.createChannel();
  await this.channel.assertExchange(this.config.exchange, 'topic', { durable: true });
  this.connected = true;
}

async publish(routingKey, message) {
  const content = Buffer.from(JSON.stringify(message));
  this.channel.publish(
    this.config.exchange,
    routingKey,
    content,
    { persistent: true }
  );
}
```

## Пример реальной интеграции с Kafka

```javascript
const { Kafka } = require('kafkajs');

async connect() {
  this.kafka = new Kafka({
    clientId: 'orders-service',
    brokers: [`${this.config.host}:${this.config.port}`]
  });
  this.producer = this.kafka.producer();
  await this.producer.connect();
  this.connected = true;
}

async publish(topic, message) {
  await this.producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }]
  });
}
```

## Архитектура

```
orderRoutes.js
    ↓
EventBus (публикация события)
    ↓
eventBrokerIntegration.js (подписка на события)
    ↓
MessageBrokerAdapter (публикация в брокер)
    ↓
RabbitMQ/Kafka (внешний брокер)
```

