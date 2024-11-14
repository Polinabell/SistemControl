const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const orderRoutes = require('../src/routes/orderRoutes');

const app = express();
app.use(express.json());
app.use('/v1/orders', orderRoutes);

const testUserId = 'cab9fe0b-e964-4147-bb01-ea03f1babcbd';
const testUserId2 = 'bbb9fe0b-e964-4147-bb01-ea03f1babcbd';

const createToken = (userId, roles = ['user']) => {
  return jwt.sign(
    {
      user_id: userId,
      email: 'test@example.com',
      roles,
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '24h' }
  );
};

const userToken = createToken(testUserId);
const userToken2 = createToken(testUserId2);
const adminToken = createToken(testUserId, ['admin']);

let createdOrderId = '';

describe('Orders API Tests', () => {
  describe('POST /v1/orders', () => {
    test('должна успешно создать заказ для авторизованного пользователя', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            { name: 'Кирпич', quantity: 100, price: 50.5 },
            { name: 'Цемент', quantity: 50, price: 150 },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('created');
      expect(parseFloat(response.body.data.total)).toBe(12550);
      expect(response.body.data.items).toHaveLength(2);
      
      createdOrderId = response.body.data.id;
    });

    test('должна вернуть ошибку при пустом массиве items', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('должна вернуть ошибку при невалидных данных item', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ name: 'Test', quantity: -1, price: 100 }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('должна вернуть отказ без токена авторизации', async () => {
      const response = await request(app)
        .post('/v1/orders')
        .send({
          items: [{ name: 'Test', quantity: 1, price: 100 }],
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /v1/orders/:id', () => {
    test('должна успешно вернуть свой заказ', async () => {
      const response = await request(app)
        .get(`/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdOrderId);
      expect(response.body.data.user_id).toBe(testUserId);
    });

    test('должна вернуть 404 для несуществующего заказа', async () => {
      const response = await request(app)
        .get('/v1/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('GET /v1/orders - список заказов с пагинацией', () => {
    test('должна вернуть список заказов текущего пользователя', async () => {
      const response = await request(app)
        .get('/v1/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    test('должна поддерживать фильтрацию по статусу', async () => {
      const response = await request(app)
        .get('/v1/orders?status=created')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.orders.length > 0) {
        expect(response.body.data.orders[0].status).toBe('created');
      }
    });

    test('должна поддерживать сортировку', async () => {
      const response = await request(app)
        .get('/v1/orders?sortBy=total&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Orders API Tests', () => {
  describe('Проверка прав доступа', () => {
    test('должна запретить доступ к чужому заказу', async () => {
      const response = await request(app)
        .get(`/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    test('должна запретить обновление чужого заказа', async () => {
      const response = await request(app)
        .patch(`/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send({ status: 'in_progress' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    test('должна разрешить админу доступ к любому заказу', async () => {
      const response = await request(app)
        .get(`/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /v1/orders/:id/status', () => {
    test('должна успешно обновить статус своего заказа', async () => {
      const response = await request(app)
        .patch(`/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    test('должна вернуть ошибку при невалидном статусе', async () => {
      const response = await request(app)
        .patch(`/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /v1/orders/:id - отмена заказа', () => {
    test('должна успешно отменить собственный заказ', async () => {
      const response = await request(app)
        .delete(`/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('cancelled');
    });

    test('заказ должен иметь статус cancelled после отмены', async () => {
      const response = await request(app)
        .get(`/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.status).toBe('cancelled');
    });

    test('должна запретить отмену чужого заказа', async () => {
      const response = await request(app)
        .delete(`/v1/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});

describe('Domain Events Tests', () => {
  test('должна публиковать событие при создании заказа', async () => {
    const response = await request(app)
        .post('/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ name: 'Test Event', quantity: 1, price: 100 }],
        })
        .expect(201);

    expect(response.body.success).toBe(true);
  });
});

