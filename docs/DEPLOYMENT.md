# Инструкция по развертыванию

## Локальная разработка (Development)

### Требования
- Docker Desktop
- Docker Compose

### Запуск

1. Убедитесь, что Docker Desktop запущен

2. Запустите все сервисы:
```bash
docker-compose up --build
```

3. Проверьте работу сервисов:
```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Остановка

```bash
docker-compose down
```

Для удаления данных базы:
```bash
docker-compose down -v
```

## Тестовое окружение (Test)

### Запуск с тестовыми настройками

1. Создайте файл docker-compose.test.yml:
```yaml
version: '3.8'
services:
  db:
    environment:
      POSTGRES_DB: systema_kontrola_test
  service_users:
    environment:
      - NODE_ENV=test
      - PORT=3011
      - DATABASE_URL=postgresql://postgres:password@db:5432/systema_kontrola_test
      - JWT_SECRET=test_secret
    ports:
      - "3011:3011"
  service_orders:
    environment:
      - NODE_ENV=test
      - PORT=3012
      - DATABASE_URL=postgresql://postgres:password@db:5432/systema_kontrola_test
      - JWT_SECRET=test_secret
      - SERVICE_USERS_URL=http://service_users:3011
    ports:
      - "3012:3012"
  api_gateway:
    environment:
      - NODE_ENV=test
      - PORT=3001
      - JWT_SECRET=test_secret
      - SERVICE_USERS_URL=http://service_users:3011
      - SERVICE_ORDERS_URL=http://service_orders:3012
    ports:
      - "3001:3001"
```

2. Запустите:
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up --build
```

## Продакшн (Production)

### Требования
- Сервер с Docker и Docker Compose
- Настроенный домен
- SSL сертификаты
- Настроенный reverse proxy (nginx)

### Подготовка

1. Обновите `.env.prod` с продакшн настройками:
```env
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://username:password@production-db-host:5432/systema_kontrola_prod
JWT_SECRET=STRONG_SECRET_KEY_HERE
API_GATEWAY_PORT=3002
SERVICE_USERS_PORT=3021
SERVICE_ORDERS_PORT=3022
```

2. Настройте nginx для reverse proxy:
```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Запуск

1. Склонируйте репозиторий на сервер:
```bash
git clone <repository-url>
cd backend
```

2. Запустите сервисы:
```bash
docker-compose up -d --build
```

3. Проверьте логи:
```bash
docker-compose logs -f
```

### Обновление

```bash
git pull
docker-compose down
docker-compose up -d --build
```

## Мониторинг

### Проверка здоровья сервисов

```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Просмотр логов

Все сервисы:
```bash
docker-compose logs -f
```

Конкретный сервис:
```bash
docker-compose logs -f api_gateway
docker-compose logs -f service_users
docker-compose logs -f service_orders
```

### Просмотр статуса контейнеров

```bash
docker-compose ps
```

## Резервное копирование

### Бэкап базы данных

```bash
docker exec systema_kontrola_db pg_dump -U postgres systema_kontrola_dev > backup.sql
```

### Восстановление базы данных

```bash
cat backup.sql | docker exec -i systema_kontrola_db psql -U postgres systema_kontrola_dev
```

## Масштабирование

### Горизонтальное масштабирование сервисов

```bash
docker-compose up -d --scale service_users=3 --scale service_orders=3
```

Для продакшн использования рекомендуется настроить:
- Load balancer (nginx/HAProxy)
- Отдельную БД (не в контейнере)
- Redis для сессий/кэша
- Централизованное логирование (ELK Stack)

## Безопасность

### Рекомендации для продакшн

1. Используйте сильные пароли и секреты
2. Настройте SSL/TLS
3. Ограничьте доступ к базе данных
4. Используйте файрволл
5. Регулярно обновляйте зависимости
6. Настройте автоматические бэкапы
7. Используйте secrets management (Docker Secrets, Vault)

### Обновление секретов

```bash
docker-compose down
vim .env.prod
docker-compose up -d
```

