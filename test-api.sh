#!/bin/bash

API_URL="http://localhost:3000"

echo "=== Тестирование API ==="
echo ""

echo "1. Регистрация пользователя..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }')
echo "Ответ: $REGISTER_RESPONSE"
echo ""

echo "2. Вход пользователя..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
echo "Ответ: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Токен: $TOKEN"
echo ""

echo "3. Получение профиля..."
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/v1/users/profile" \
  -H "Authorization: Bearer $TOKEN")
echo "Ответ: $PROFILE_RESPONSE"
echo ""

echo "4. Создание заказа..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/v1/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {"name": "Кирпич", "quantity": 100, "price": 50.5},
      {"name": "Цемент", "quantity": 50, "price": 150}
    ]
  }')
echo "Ответ: $ORDER_RESPONSE"

ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "ID заказа: $ORDER_ID"
echo ""

echo "5. Получение списка заказов..."
ORDERS_LIST=$(curl -s -X GET "$API_URL/v1/orders" \
  -H "Authorization: Bearer $TOKEN")
echo "Ответ: $ORDERS_LIST"
echo ""

echo "6. Получение заказа по ID..."
ORDER_DETAIL=$(curl -s -X GET "$API_URL/v1/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Ответ: $ORDER_DETAIL"
echo ""

echo "7. Обновление статуса заказа..."
UPDATE_STATUS=$(curl -s -X PATCH "$API_URL/v1/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "in_progress"}')
echo "Ответ: $UPDATE_STATUS"
echo ""

echo "8. Отмена заказа..."
CANCEL_ORDER=$(curl -s -X DELETE "$API_URL/v1/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "Ответ: $CANCEL_ORDER"
echo ""

echo "=== Тестирование завершено ==="

