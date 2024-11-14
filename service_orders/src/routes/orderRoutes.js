const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createOrderSchema, updateStatusSchema } = require('../schemas/orderSchemas');
const axios = require('axios');
const eventBus = require('../events/EventBus');
const eventTypes = require('../events/eventTypes');

const verifyUserExists = async (userId) => {
  try {
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
};

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const { items } = validatedData;

    const userExists = await verifyUserExists(req.user.user_id);
    if (!userExists) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User does not exist',
        },
      });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = uuidv4();

    const result = await pool.query(
      'INSERT INTO orders (id, user_id, items, status, total, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [orderId, req.user.user_id, JSON.stringify(items), 'created', total]
    );

    const order = result.rows[0];

    eventBus.publish(eventTypes.ORDER_CREATED, {
      orderId: order.id,
      userId: order.user_id,
      items: order.items,
      total: order.total,
      status: order.status,
    });

    res.status(201).json({
      success: true,
      data: order,
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

    const oldStatus = order.status;

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    const updatedOrder = result.rows[0];

    eventBus.publish(eventTypes.ORDER_STATUS_UPDATED, {
      orderId: updatedOrder.id,
      userId: updatedOrder.user_id,
      oldStatus,
      newStatus: updatedOrder.status,
    });

    res.json({
      success: true,
      data: updatedOrder,
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

    const oldStatus = order.status;

    await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['cancelled', id]
    );

    eventBus.publish(eventTypes.ORDER_CANCELLED, {
      orderId: order.id,
      userId: order.user_id,
      oldStatus,
      newStatus: 'cancelled',
    });

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

