const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const midtrans = require('../services/midtransService');

// ─── GET /plans ─── list all active plans
router.get('/plans', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, display_name, description, price, duration_days, features, is_popular, sort_order
       FROM plans WHERE is_active = true ORDER BY sort_order`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /my-subscription ─── current user's active sub
router.get('/my-subscription', verifyToken, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, p.name AS plan_name, p.display_name, p.price, p.features
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active' AND s.expires_at > NOW()
       ORDER BY s.expires_at DESC LIMIT 1`,
      [req.user.id]
    );
    const sub = rows[0] || null;
    res.json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

// ─── GET /midtrans-client-key ─── return client key for Snap.js
router.get('/midtrans-client-key', verifyToken, (req, res) => {
  res.json({ success: true, clientKey: midtrans.getClientKey() });
});

// ─── POST /subscribe ─── create payment transaction
router.post('/subscribe', verifyToken, async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ success: false, error: 'planId is required' });

    // Get plan
    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1 AND is_active = true', [planId]);
    const plan = planResult.rows[0];
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    // Free plan → activate directly
    if (plan.price === 0) {
      // Cancel existing active subs
      await pool.query(
        `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`,
        [req.user.id]
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, expires_at) VALUES ($1, $2, 'active', $3)`,
        [req.user.id, plan.id, expiresAt]
      );

      await pool.query(`UPDATE users SET current_plan = $1 WHERE id = $2`, [plan.name, req.user.id]);

      return res.json({ success: true, message: 'Paket Gratis diaktifkan', data: { plan: plan.name } });
    }

    // Paid plan → create Midtrans transaction
    const orderId = `EDZ-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Get user info
    const userResult = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    const { token, redirect_url } = await midtrans.createTransaction({
      orderId,
      grossAmount: plan.price,
      planName: plan.display_name,
      user,
    });

    // Store pending transaction
    await pool.query(
      `INSERT INTO payment_transactions (user_id, plan_id, order_id, amount, status, snap_token, snap_redirect_url)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)`,
      [req.user.id, plan.id, orderId, plan.price, token, redirect_url]
    );

    res.json({
      success: true,
      data: {
        token,
        redirect_url,
        order_id: orderId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /webhook ─── Midtrans notification handler (no auth)
router.post('/webhook', async (req, res, next) => {
  try {
    const notification = req.body;
    const statusResponse = await midtrans.verifyNotification(notification);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const paymentType = statusResponse.payment_type;

    // Determine final status
    let status = transactionStatus;
    if (transactionStatus === 'capture') {
      status = fraudStatus === 'accept' ? 'settlement' : 'deny';
    }

    // Update transaction
    await pool.query(
      `UPDATE payment_transactions 
       SET status = $1, payment_type = $2, midtrans_transaction_id = $3, raw_response = $4, updated_at = NOW()
       WHERE order_id = $5`,
      [status, paymentType, statusResponse.transaction_id, JSON.stringify(statusResponse), orderId]
    );

    // If settlement → activate subscription
    if (status === 'settlement') {
      const txResult = await pool.query(
        `SELECT pt.user_id, pt.plan_id, p.name AS plan_name, p.duration_days
         FROM payment_transactions pt
         JOIN plans p ON p.id = pt.plan_id
         WHERE pt.order_id = $1`,
        [orderId]
      );

      if (txResult.rows.length > 0) {
        const tx = txResult.rows[0];

        // Cancel old active subs
        await pool.query(
          `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`,
          [tx.user_id]
        );

        // Create new subscription
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + tx.duration_days);

        await pool.query(
          `INSERT INTO subscriptions (user_id, plan_id, status, expires_at) VALUES ($1, $2, 'active', $3)`,
          [tx.user_id, tx.plan_id, expiresAt]
        );

        // Update user's current plan
        await pool.query(`UPDATE users SET current_plan = $1 WHERE id = $2`, [tx.plan_name, tx.user_id]);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Midtrans webhook error:', err);
    res.status(200).json({ success: true }); // Always respond 200 to Midtrans
  }
});

// ─── GET /transactions ─── user's payment history
router.get('/transactions', verifyToken, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pt.*, p.display_name AS plan_name
       FROM payment_transactions pt
       JOIN plans p ON p.id = pt.plan_id
       WHERE pt.user_id = $1
       ORDER BY pt.created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /confirm ─── Client-side payment confirmation (fallback for sandbox where webhook can't reach localhost)
router.post('/confirm', verifyToken, async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ success: false, error: 'order_id required' });

    // Check if this transaction belongs to the user and is still pending
    const txResult = await pool.query(
      `SELECT pt.*, p.name AS plan_name, p.duration_days
       FROM payment_transactions pt
       JOIN plans p ON p.id = pt.plan_id
       WHERE pt.order_id = $1 AND pt.user_id = $2`,
      [order_id, req.user.id]
    );

    if (txResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Transaction not found' });
    const tx = txResult.rows[0];

    // If already settled, just return success
    if (tx.status === 'settlement') {
      return res.json({ success: true, message: 'Already activated' });
    }

    // Verify with Midtrans
    try {
      const statusResponse = await midtrans.verifyNotification({ order_id, transaction_status: 'capture' });
      const finalStatus = statusResponse.transaction_status === 'capture'
        ? (statusResponse.fraud_status === 'accept' ? 'settlement' : 'deny')
        : statusResponse.transaction_status;

      await pool.query(
        `UPDATE payment_transactions SET status = $1, updated_at = NOW() WHERE order_id = $2`,
        [finalStatus, order_id]
      );

      if (finalStatus === 'settlement') {
        await pool.query(`UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`, [req.user.id]);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + tx.duration_days);
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan_id, status, expires_at) VALUES ($1, $2, 'active', $3)`,
          [req.user.id, tx.plan_id, expiresAt]
        );
        await pool.query(`UPDATE users SET current_plan = $1 WHERE id = $2`, [tx.plan_name, req.user.id]);
        return res.json({ success: true, message: 'Plan activated', plan: tx.plan_name });
      }

      return res.json({ success: true, message: `Status: ${finalStatus}` });
    } catch (verifyErr) {
      if (process.env.MIDTRANS_IS_PRODUCTION === 'true') {
        console.error('Midtrans verify failed on production:', verifyErr.message);
        return res.status(400).json({ success: false, error: 'Verifikasi pembayaran gagal.' });
      }
      // If Midtrans verification fails in sandbox, force-activate for testing
      console.warn('Midtrans verify failed, force-activating for sandbox:', verifyErr.message);
      await pool.query(`UPDATE payment_transactions SET status = 'settlement', updated_at = NOW() WHERE order_id = $1`, [order_id]);
      await pool.query(`UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`, [req.user.id]);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + tx.duration_days);
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, expires_at) VALUES ($1, $2, 'active', $3)`,
        [req.user.id, tx.plan_id, expiresAt]
      );
      await pool.query(`UPDATE users SET current_plan = $1 WHERE id = $2`, [tx.plan_name, req.user.id]);
      return res.json({ success: true, message: 'Plan activated (sandbox)', plan: tx.plan_name });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
