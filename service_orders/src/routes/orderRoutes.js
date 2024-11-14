const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createOrderSchema, updateStatusSchema } = require('../schemas/orderSchemas');
const axios = require('axios');

const verifyUserExists = async (userId) => {
  try {
    const serviceUsersUrl = process.env.SERVICE_USERS_URL || 'http://service_users:3001';
    const response = await axios.get(`${serviceUsersUrl}/v1/users/${userId}`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const { items } = validatedData;

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = uuidv4();

    const result = await pool.query(
      'INSERT INTO orders (id, user_id, items, status, total, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [orderId, req.user.user_id, JSON.stringify(items), 'created', total]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
        },
      });
    }
    next(error);
  }
});

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    const order = result.rows[0];

    if (order.user_id !== req.user.user_id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const validSortFields = ['created_at', 'updated_at', 'total', 'status'];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    let query = 'SELECT * FROM orders WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1';
    const values = [req.user.user_id];

    if (status) {
      query += ' AND status = $2';
      countQuery += ' AND status = $2';
      values.push(status);
    }

    query += ` ORDER BY ${orderBy} ${sortOrder} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    const [ordersResult, countResult] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        orders: ordersResult.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);
    const { status } = validatedData;

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    const order = orderResult.rows[0];

    if (order.user_id !== req.user.user_id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
        },
      });
    }
    next(error);
  }
});

router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    const order = orderResult.rows[0];

    if (order.user_id !== req.user.user_id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['cancelled', id]
    );

    res.json({
      success: true,
      data: {
        message: 'Order cancelled successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

