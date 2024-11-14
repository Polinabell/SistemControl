const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require('../schemas/userSchemas');

router.post('/register', async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name } = validatedData;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'User with this email already exists',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const result = await pool.query(
      'INSERT INTO users (id, email, password_hash, name, roles, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, email, name, roles, created_at',
      [userId, email, hashedPassword, name, ['user']]
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

router.post('/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        roles: user.roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      },
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

router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, roles, created_at, updated_at FROM users WHERE id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/profile', authenticateToken, async (req, res, next) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (validatedData.name) {
      updates.push(`name = $${paramCount}`);
      values.push(validatedData.name);
      paramCount++;
    }

    if (validatedData.email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [validatedData.email, req.user.user_id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already in use',
          },
        });
      }

      updates.push(`email = $${paramCount}`);
      values.push(validatedData.email);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No fields to update',
        },
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.user_id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, roles, created_at, updated_at`;
    const result = await pool.query(query, values);

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

router.get('/', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role;

    let query = 'SELECT id, email, name, roles, created_at, updated_at FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const values = [];

    if (role) {
      query += ' WHERE $1 = ANY(roles)';
      countQuery += ' WHERE $1 = ANY(roles)';
      values.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
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

module.exports = router;

