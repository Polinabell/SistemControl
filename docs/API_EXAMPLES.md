# Примеры использования API

## Базовый URL

```
http://localhost:3000
```

## Регистрация пользователя

```bash
curl -X POST http://localhost:3000/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Иван Иванов"
  }'
```

Ответ (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "roles": ["user"],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Вход пользователя

```bash
curl -X POST http://localhost:3000/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Ответ (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Иван Иванов",
      "roles": ["user"]
    }
  }
}
```

## Получение профиля

```bash
curl -X GET http://localhost:3000/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ответ (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "roles": ["user"],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Обновление профиля

```bash
curl -X PATCH http://localhost:3000/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Новое Имя"
  }'
```

Ответ (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Новое Имя",
    "roles": ["user"],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T01:00:00.000Z"
  }
}
```

## Создание заказа

```bash
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "name": "Кирпич",
        "quantity": 100,
        "price": 50.5
      },
      {
        "name": "Цемент",
        "quantity": 50,
        "price": 150
      }
    ]
  }'
```

Ответ (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "items": [
      {"name": "Кирпич", "quantity": 100, "price": 50.5},
      {"name": "Цемент", "quantity": 50, "price": 150}
    ],
    "status": "created",
    "total": "12550.00",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Получение списка заказов

```bash
curl -X GET "http://localhost:3000/v1/orders?page=1&limit=10&status=created" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ответ (200):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "items": [...],
        "status": "created",
        "total": "12550.00",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

## Получение заказа по ID

```bash
curl -X GET http://localhost:3000/v1/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ответ (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "items": [...],
    "status": "created",
    "total": "12550.00",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Обновление статуса заказа

```bash
curl -X PATCH http://localhost:3000/v1/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "in_progress"
  }'
```

Ответ (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "items": [...],
    "status": "in_progress",
    "total": "12550.00",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T01:00:00.000Z"
  }
}
```

## Отмена заказа

```bash
curl -X DELETE http://localhost:3000/v1/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ответ (200):
```json
{
  "success": true,
  "data": {
    "message": "Order cancelled successfully"
  }
}
```

## Ошибки

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already in use"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Invalid or expired token"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

