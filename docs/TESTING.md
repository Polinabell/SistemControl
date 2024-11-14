# Руководство по тестированию

## Обзор

Проект включает три типа тестирования:
1. **Юнит-тесты** (Jest + Supertest)
2. **Postman коллекция** (интеграционное тестирование)
3. **Bash-скрипт** (end-to-end тестирование)

## 1. Юнит-тесты (Jest)

### Установка зависимостей

```bash
cd backend/service_users
npm install

cd ../service_orders
npm install
```

### Запуск тестов

**Service Users:**
```bash
cd backend/service_users
npm test
```

**Service Orders:**
```bash
cd backend/service_orders
npm test
```

**С покрытием кода:**
```bash
npm test -- --coverage
```

**В режиме watch:**
```bash
npm run test:watch
```

### Структура тестов

```
service_users/
├── __tests__/
│   └── users.test.js       # Тесты API пользователей
└── package.json

service_orders/
├── __tests__/
│   └── orders.test.js      # Тесты API заказов
└── package.json
```

### Покрытие тест-кейсов

#### Оценка 3 - Пользователи ✅

**Регистрация:**
- ✅ Успешная регистрация с валидными полями
- ✅ Повторная регистрация с тем же email → ошибка
- ✅ Валидация email
- ✅ Валидация пароля (минимум 6 символов)

**Вход:**
- ✅ Вход с правильными данными → токен
- ✅ Вход с неправильным паролем → ошибка
- ✅ Вход с несуществующим email → ошибка

**Защищённые пути:**
- ✅ Доступ без токена → отказ 401
- ✅ Доступ с невалидным токеном → отказ 403
- ✅ Доступ с валидным токеном → успех

#### Оценка 4 - Заказы ✅

**Создание заказа:**
- ✅ Успешное создание → статус "created"
- ✅ Автоматический расчёт total
- ✅ Валидация items
- ✅ Проверка авторизации

**Получение заказа:**
- ✅ Получение своего заказа → успех
- ✅ Несуществующий заказ → 404

**Список заказов:**
- ✅ Пагинация (page, limit)
- ✅ Фильтрация по статусу
- ✅ Сортировка (sortBy, sortOrder)

#### Оценка 5 - Права доступа ✅

**Проверка прав:**
- ✅ Попытка доступа к чужому заказу → отказ 403
- ✅ Попытка обновить чужой заказ → отказ 403
- ✅ Админ может видеть любые заказы

**Отмена заказа:**
- ✅ Отмена собственного заказа → статус "cancelled"
- ✅ Попытка отменить чужой заказ → отказ
- ✅ Проверка побочных эффектов

**Доменные события:**
- ✅ Публикация событий при создании
- ✅ Публикация событий при обновлении статуса

### Пример запуска

```bash
$ cd backend/service_users && npm test

PASS  __tests__/users.test.js
  Users API Tests - Оценка 3
    POST /v1/users/register
      ✓ должна успешно зарегистрировать нового пользователя
      ✓ должна вернуть ошибку при повторной регистрации
      ✓ должна вернуть ошибку валидации при невалидном email
      ✓ должна вернуть ошибку валидации при коротком пароле
    POST /v1/users/login
      ✓ должна успешно авторизовать пользователя
      ✓ должна вернуть ошибку при неправильном пароле
      ✓ должна вернуть ошибку при несуществующем email
    GET /v1/users/profile - защищённый путь
      ✓ должна вернуть отказ при доступе без токена
      ✓ должна вернуть отказ при невалидном токене
      ✓ должна успешно вернуть профиль

Tests:       10 passed, 10 total
```

## 2. Postman коллекция

### Импорт коллекции

1. Откройте Postman
2. File → Import
3. Выберите `backend/docs/postman-collection.json`
4. Коллекция "Система Контроля API" будет добавлена

### Переменные окружения

Коллекция использует переменные:
- `{{base_url}}` - http://localhost:3000
- `{{token}}` - автоматически сохраняется после логина
- `{{order_id}}` - автоматически сохраняется после создания заказа

### Запуск коллекции

**Через UI:**
1. Откройте коллекцию
2. Нажмите "Run"
3. Выберите все запросы
4. Нажмите "Run Система Контроля API"

**Через Newman (CLI):**
```bash
npm install -g newman
newman run backend/docs/postman-collection.json
```

### Структура коллекции

```
Система Контроля API/
├── Users/
│   ├── Регистрация пользователя
│   ├── Вход пользователя (сохраняет token)
│   ├── Получить профиль
│   ├── Обновить профиль
│   └── Список пользователей (admin)
└── Orders/
    ├── Создать заказ (сохраняет order_id)
    ├── Получить список заказов
    ├── Получить заказ по ID
    ├── Обновить статус заказа
    └── Отменить заказ
```

### Тестовые скрипты

Каждый запрос включает автоматические проверки:

```javascript
// Пример: После логина
pm.test('Токен получен', () => {
    pm.expect(response.data).to.have.property('token');
    pm.collectionVariables.set('token', response.data.token);
});

// Пример: После создания заказа
pm.test('Заказ создан', () => {
    pm.expect(response.data.status).to.equal('created');
    pm.collectionVariables.set('order_id', response.data.id);
});
```

## 3. Bash-скрипт (E2E)

### Запуск

```bash
cd backend
./test-api.sh
```

### Что тестирует

1. Health check API
2. Регистрация пользователя
3. Вход и получение JWT
4. Получение профиля
5. Создание заказа
6. Список заказов
7. Получение заказа по ID
8. Обновление статуса
9. Отмена заказа

### Пример вывода

```bash
=== Тестирование API ===

Проверка доступности API...
✅ API доступен

1. Регистрация пользователя...
Ответ: {"success":true,"data":{"id":"...","email":"test@example.com"}}

2. Вход пользователя...
Токен: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

3. Получение профиля...
Ответ: {"success":true,"data":{"email":"test@example.com"}}

✅ Все тесты пройдены успешно
```

## 4. Тестирование в Docker

### Запуск тестов в контейнерах

**Service Users:**
```bash
docker-compose exec service_users npm test
```

**Service Orders:**
```bash
docker-compose exec service_orders npm test
```

### Запуск всех тестов

```bash
cd backend

# Юнит-тесты
docker-compose exec service_users npm test
docker-compose exec service_orders npm test

# E2E тесты
./test-api.sh

# Postman (через Newman)
newman run docs/postman-collection.json
```

## 5. CI/CD интеграция

### GitHub Actions пример

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: password
        
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend/service_users && npm install
          cd ../service_orders && npm install
      
      - name: Run tests
        run: |
          cd backend/service_users && npm test
          cd ../service_orders && npm test
      
      - name: E2E tests
        run: |
          docker-compose up -d
          sleep 10
          cd backend && ./test-api.sh
```

## 6. Отладка тестов

### Просмотр логов при ошибках

```bash
# Jest verbose mode
npm test -- --verbose

# С детальным выводом
npm test -- --verbose --detectOpenHandles

# Один конкретный тест
npm test -- --testNamePattern="должна успешно зарегистрировать"
```

### Проверка покрытия

```bash
npm test -- --coverage --coverageReporters=html

# Откройте coverage/index.html в браузере
open coverage/index.html
```

## 7. Лучшие практики

### При написании тестов

1. ✅ Используйте описательные имена тестов
2. ✅ Тестируйте один сценарий в одном тесте
3. ✅ Проверяйте и успешные, и ошибочные сценарии
4. ✅ Очищайте данные после тестов
5. ✅ Используйте моки для внешних зависимостей

### При запуске тестов

1. ✅ Запускайте тесты перед коммитом
2. ✅ Проверяйте покрытие кода
3. ✅ Тестируйте в изолированном окружении
4. ✅ Используйте тестовую базу данных

## Итоги

### Покрытие требований ТЗ

| Требование | Статус |
|------------|--------|
| Минимальный набор тестов | ✅ Выполнено |
| Тесты на оценку 3 (Пользователи) | ✅ 7 тестов |
| Тесты на оценку 4 (Заказы) | ✅ 10 тестов |
| Тесты на оценку 5 (Права) | ✅ 8 тестов |
| Postman коллекция | ✅ Готова |
| E2E тесты | ✅ Bash-скрипт |
| Документация | ✅ Данный файл |

**Всего: 25+ автоматических тестов** покрывающих все критические сценарии!

