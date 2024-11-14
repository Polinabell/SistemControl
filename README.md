# Система Контроля

Микросервисная система управления строительными задачами.

## Архитектура

- **API Gateway** (порт 3000) - точка входа, проксирование запросов
- **Service Users** (порт 3001) - управление пользователями
- **Service Orders** (порт 3002) - управление заказами
- **PostgreSQL** (порт 5432) - база данных

## Запуск

```bash
docker-compose up --build
```

## API Документация

См. `docs/openapi.yaml`

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

