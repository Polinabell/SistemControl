# Система Контроля

Микросервисная система управления строительными задачами.

## Архитектура

- **API Gateway** (порт 3000) - точка входа, проксирование запросов
- **Service Users** (порт 3001) - управление пользователями
- **Service Orders** (порт 3002) - управление заказами
- **PostgreSQL** (порт 5432) - база данных

## Требования

- Docker Desktop (запущен)
- Docker Compose

## Запуск

```bash
docker-compose up --build
```

Для фонового запуска:

```bash
docker-compose up --build -d
```

Остановка:

```bash
docker-compose down
```

## Тестирование

### Юнит-тесты (Jest)

```bash
# Service Users
cd service_users && npm test

# Service Orders
cd service_orders && npm test
```

### E2E тестирование

```bash
./test-api.sh
```

### Postman

Импортируйте `docs/postman-collection.json` в Postman

**Подробнее:** см. `docs/TESTING.md`

## API Документация

- OpenAPI спецификация: `docs/openapi.yaml`
- Примеры использования: `docs/API_EXAMPLES.md`
- Postman коллекция: `docs/postman-collection.json`
- Доменные события: `docs/DOMAIN_EVENTS.md`

## Окружения

- `.env.dev` - development
- `.env.test` - testing
- `.env.prod` - production

## Технологии

- Node.js, Express
- PostgreSQL
- Docker, docker-compose
- JWT
- pino (логирование)
- zod (валидация)
- express-rate-limit
- cors

