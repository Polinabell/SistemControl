# Система Контроля - Микросервисный Backend

## Быстрый старт

### 1. Запуск проекта

```bash
cd backend
docker-compose up --build
```

Сервисы будут доступны:
- **API Gateway**: http://localhost:3000
- **Service Users**: http://localhost:3001
- **Service Orders**: http://localhost:3002
- **PostgreSQL**: localhost:5432

### 2. Проверка работы

```bash
curl http://localhost:3000/health
```

### 3. Остановка

```bash
docker-compose down
```

---

## Что реализовано

### Компоненты
-  API Gateway - проксирование, JWT, rate limiting, CORS, трассировка
-  Service Users - регистрация, вход, профиль, список (admin)
-  Service Orders - CRUD заказов, пагинация, фильтры, проверка прав
-  PostgreSQL - база данных с миграциями

### Функционал
- JWT авторизация на всех защищённых маршрутах
-  Валидация данных (Zod)
-  Логирование и трассировка (Pino + X-Request-ID)
-  Доменные события (EventBus + заготовка для брокера)
-  Проверка прав доступа
-  Три окружения (dev/test/prod)

---

##  Тестирование

### Юнит-тесты (25+ тестов)

```bash
# Service Users
cd service_users && npm install && npm test

# Service Orders
cd service_orders && npm install && npm test
```

**Что покрывают:**
- Регистрация и вход пользователей
- Валидация данных
- Защита маршрутов (токены)
- CRUD операции с заказами
- Проверка прав доступа (свой/чужой заказ)
- Пагинация и фильтрация

### E2E тесты

```bash
./test-api.sh
```

Проверяет полный цикл: регистрация → вход → создание заказа → обновление → отмена

### Postman

Импортируйте `docs/postman-collection.json` в Postman и запустите коллекцию.

---

## Структура

```
backend/
├── api_gateway/          # Шлюз (порт 3000)
├── service_users/        # Пользователи (порт 3001)
├── service_orders/       # Заказы (порт 3002)
├── docs/                 # Документация
│   ├── openapi.yaml
│   ├── postman-collection.json
│   ├── API_EXAMPLES.md
│   ├── DOMAIN_EVENTS.md
│   └── TESTING.md
├── docker-compose.yml
├── .env.dev / .env.test / .env.prod
└── test-api.sh
```

---

## Выполнение ТЗ

### Архитектура 
-  API Gateway с проксированием
-  Service Users с JWT
-  Service Orders с полным CRUD
-  PostgreSQL
-  Docker-compose

### Функциональные требования 

**Шлюз:**
-  Проксирование /v1/users → service_users
-  Проксирование /v1/orders → service_orders
-  Проверка JWT на защищённых путях
-  Rate limiting (100 req/15 min)
-  CORS
-  X-Request-ID трассировка

**Service Users:**
-  Регистрация с валидацией и проверкой уникальности email
-  Вход с выдачей JWT
-  Получение и обновление профиля
-  Список пользователей для admin (с пагинацией и фильтрами)

**Service Orders:**
-  Создание заказа с проверкой пользователя
-  Получение заказа по ID (с проверкой прав)
-  Список заказов с пагинацией и сортировкой
-  Обновление статуса
-  Отмена заказа
-  Проверка прав на каждой операции

### Доменные события 
-  Публикация события "создан заказ"
-  Публикация события "обновлён статус"
-  Заготовка для брокера сообщений (RabbitMQ/Kafka)

### Формат API 
- JSON с полями {success, data/error}
-  Ошибки с {code, message}
-  Версионирование /v1
-  Authorization: Bearer JWT
-  Публичные только регистрация/вход

### Данные 
- Пользователь: id(UUID), email, password_hash, name, roles[], timestamps
- Заказ: id(UUID), user_id, items(JSONB), status(enum), total, timestamps

### Логи и трассировка 
-  Pino во всех сервисах
-  X-Request-ID в каждом запросе
-  Логи с user_id, путь, время, статус

### Окружения 
-  .env.dev
-  .env.test
-  .env.prod

### Документация 
- OpenAPI 3.0 спецификация (docs/openapi.yaml)
-  Postman коллекция с тестами
-  Примеры API (docs/API_EXAMPLES.md)
-  Руководство по тестированию (docs/TESTING.md)
-  Документация событий (docs/DOMAIN_EVENTS.md)

### Тестирование 

**Пользователи:**
- Успешная регистрация
-  Повторная регистрация → ошибка
-  Вход с валидными данными → токен
-  Доступ без токена → отказ

**Заказы:**
-  Создание заказа → статус "created"
-  Получение своего заказа
-  Список с пагинацией

**Права:**
-  Попытка обновить чужой заказ → отказ
-  Отмена своего заказа → статус "cancelled"
-  Проверка побочных эффектов

**Итого:** 25+ автоматических тестов (Jest) + Postman коллекция + E2E bash-скрипт

---

## Технологии

- Node.js 18 + Express
- PostgreSQL 15
- Docker & Docker Compose
- JWT (jsonwebtoken)
- Pino (логирование)
- Zod (валидация)
- Jest + Supertest (тестирование)
- Express Rate Limit
- CORS

---

## Документация

- **OpenAPI**: `docs/openapi.yaml` - полная спецификация API
- **Примеры**: `docs/API_EXAMPLES.md` - curl примеры для всех endpoints
- **События**: `docs/DOMAIN_EVENTS.md` - описание доменных событий
- **Тесты**: `docs/TESTING.md` - руководство по тестированию
- **Postman**: `docs/postman-collection.json` - коллекция для импорта

---

