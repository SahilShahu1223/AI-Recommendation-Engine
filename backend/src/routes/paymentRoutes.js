const express = require('express');
const router = express.Router();
const c = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');

router.post('/create-checkout-session', requireAuth, c.createCheckoutSession);
router.post('/confirm', requireAuth, c.confirmCheckoutSession);
router.get('/status', c.status);
router.post('/demo-upgrade', requireAuth, c.demoUpgrade);
router.post('/cancel', requireAuth, c.cancelSubscription);
router.post('/resume', requireAuth, c.resumeSubscription);
router.get('/invoice', requireAuth, c.invoice);
// NOTE: webhook route is mounted separately in app.js with express.raw(),
// since Stripe signature verification requires the raw request body.

module.exports = router;
