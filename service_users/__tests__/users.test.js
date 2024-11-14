const request = require('supertest');
const express = require('express');
const userRoutes = require('../src/routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/v1/users', userRoutes);

const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User',
};

let authToken = '';
let userId = '';

describe('Users API Tests', () => {
  describe('POST /v1/users/register', () => {
    test('должна успешно зарегистрировать нового пользователя', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.roles).toContain('user');
      
      userId = response.body.data.id;
    });

    test('должна вернуть ошибку при повторной регистрации с тем же email', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    test('должна вернуть ошибку валидации при невалидном email', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('должна вернуть ошибку валидации при коротком пароле', async () => {
      const response = await request(app)
        .post('/v1/users/register')
        .send({
          email: 'new@example.com',
          password: '123',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /v1/users/login', () => {
    test('должна успешно авторизовать пользователя с правильными данными', async () => {
      const response = await request(app)
        .post('/v1/users/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
      
      authToken = response.body.data.token;
    });

    test('должна вернуть ошибку при неправильном пароле', async () => {
      const response = await request(app)
        .post('/v1/users/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('должна вернуть ошибку при несуществующем email', async () => {
      const response = await request(app)
        .post('/v1/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /v1/users/profile - защищённый путь', () => {
    test('должна вернуть отказ при доступе без токена', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('должна вернуть отказ при невалидном токене', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    test('должна успешно вернуть профиль с валидным токеном', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('created_at');
    });
  });

  describe('PATCH /v1/users/profile', () => {
    test('должна успешно обновить имя пользователя', async () => {
      const response = await request(app)
        .patch('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    test('должна вернуть ошибку при обновлении на занятый email', async () => {
      const response = await request(app)
        .patch('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Users API Tests - Дополнительно', () => {
  describe('GET /v1/users - только для admin', () => {
    test('должна вернуть отказ для обычного пользователя', async () => {
      const response = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});

