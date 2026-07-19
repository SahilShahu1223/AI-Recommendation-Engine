const Stripe = require('stripe');
const userModel = require('../models/userModel');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw Object.assign(
      new Error('Payments are not configured yet. Set STRIPE_SECRET_KEY in backend/.env (see README).'),
      { status: 503 }
    );
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Creates a real Stripe Checkout session (test mode by default with a test key)
// for the Pro subscription and returns the URL to redirect the browser to.
async function createCheckoutSession(req, res, next) {
  try {
    const stripe = getStripe();
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return res.status(503).json({ success: false, message: 'STRIPE_PRICE_ID is not configured in backend/.env' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/?checkout=cancelled`,
      metadata: { userId: String(user.id) },
    });

    res.json({ success: true, url: session.url });
  } catch (err) { next(err); }
}

// Confirms a checkout session directly (fallback for local dev when the
// Stripe CLI / webhook isn't running) — verifies payment status with Stripe
// before upgrading, so this cannot be spoofed by just calling the endpoint.
async function confirmCheckoutSession(req, res, next) {
  try {
    const stripe = getStripe();
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId is required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(402).json({ success: false, message: 'Payment not completed yet' });
    }
    if (String(session.metadata?.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'This checkout session does not belong to you' });
    }

    await userModel.updateProfile(req.user.id, {}); // no-op guard, keeps pattern consistent
    const { pool } = require('../config/db');
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    await pool.query(
      "UPDATE users SET plan = 'pro', cancel_at_period_end = FALSE, current_period_end = :periodEnd WHERE id = :id",
      { id: req.user.id, periodEnd: periodEnd.toISOString().slice(0, 10) }
    );

    const user = await userModel.findById(req.user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, message: 'Upgraded to Pro!', user: safeUser });
  } catch (err) { next(err); }
}

// Real webhook endpoint — Stripe calls this server-to-server when a payment
// succeeds. This is the authoritative, production-correct way to upgrade a
// user (works even if the browser tab was closed after payment).
async function webhook(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId) {
      const { pool } = require('../config/db');
      await pool.query("UPDATE users SET plan = 'pro' WHERE id = :id", { id: userId });
      console.log(`[stripe webhook] user ${userId} upgraded to Pro`);
    }
  }

  res.json({ received: true });
}

// Lets the frontend know upfront whether real payments are configured, so
// it can offer a clearly-labelled demo upgrade instead of a raw error.
async function status(req, res) {
  res.json({ success: true, configured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID });
}

// Demo-only upgrade path used when Stripe hasn't been configured (see README
// section 6). This does NOT process any real payment — it's a clearly-labelled
// testing shortcut so the "Upgrade to Pro" flow is not simply broken for
// anyone who hasn't set up their own Stripe account yet.
async function demoUpgrade(req, res, next) {
  try {
    const { pool } = require('../config/db');
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    await pool.query(
      "UPDATE users SET plan = 'pro', cancel_at_period_end = FALSE, current_period_end = :periodEnd WHERE id = :id",
      { id: req.user.id, periodEnd: periodEnd.toISOString().slice(0, 10) }
    );
    const user = await userModel.findById(req.user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, message: 'Upgraded to Pro (demo mode — no real payment was made)', user: safeUser });
  } catch (err) { next(err); }
}

// Cancels the subscription at the end of the current billing period. This
// does NOT touch Stripe or move any money — it only flips a flag so the
// billing UI can show the cancellation, while the user keeps Pro access
// until current_period_end (matches how real subscription cancellation
// behaves: access continues until the period the user already paid for
// ends).
async function cancelSubscription(req, res, next) {
  try {
    const { pool } = require('../config/db');
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.plan !== 'pro') {
      return res.status(400).json({ success: false, message: 'You are not on a paid plan' });
    }

    let periodEnd = user.current_period_end;
    if (!periodEnd) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      periodEnd = d.toISOString().slice(0, 10);
    }

    await pool.query(
      'UPDATE users SET cancel_at_period_end = TRUE, current_period_end = :periodEnd WHERE id = :id',
      { id: req.user.id, periodEnd }
    );

    const updated = await userModel.findById(req.user.id);
    const { password_hash, ...safeUser } = updated;
    res.json({ success: true, message: 'Subscription cancelled', user: safeUser });
  } catch (err) { next(err); }
}

// Undoes a pending cancellation while still inside the current period.
async function resumeSubscription(req, res, next) {
  try {
    const { pool } = require('../config/db');
    await pool.query(
      'UPDATE users SET cancel_at_period_end = FALSE WHERE id = :id',
      { id: req.user.id }
    );
    const updated = await userModel.findById(req.user.id);
    const { password_hash, ...safeUser } = updated;
    res.json({ success: true, message: 'Subscription resumed', user: safeUser });
  } catch (err) { next(err); }
}

// Generates a simple demo invoice for the current user. There is no real
// Stripe invoice to fetch in demo mode, so this synthesizes one from the
// user's own plan/account data; the frontend turns this into a downloadable
// file. Clearly labelled as a demo document, not a real receipt.
async function invoice(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const amount = user.plan === 'pro' ? '$8.00 USD' : '$0.00 USD';
    const invoiceNumber = `DEMO-INV-${String(user.id).padStart(6, '0')}-${Date.now().toString().slice(-6)}`;

    res.json({
      success: true,
      invoice: {
        invoiceNumber,
        date: new Date().toISOString().slice(0, 10),
        customerName: `${user.first_name} ${user.last_name}`,
        customerEmail: user.email,
        planLabel: user.plan === 'pro' ? 'Pro Plan (monthly)' : 'Free Plan',
        amount,
        status: user.plan === 'pro' ? 'Paid (demo)' : 'N/A',
      },
    });
  } catch (err) { next(err); }
}

module.exports = {
  createCheckoutSession, confirmCheckoutSession, webhook, status, demoUpgrade,
  cancelSubscription, resumeSubscription, invoice,
};
