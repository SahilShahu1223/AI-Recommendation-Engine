const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const kidsRoutes = require('./routes/kidsRoutes');
const creditRoutes = require('./routes/creditRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const historyRoutes = require('./routes/historyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const paymentController = require('./controllers/paymentController');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

// Stripe webhook needs the raw request body for signature verification,
// so it must be registered BEFORE express.json() and outside /api/payments below.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Recommend AI API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/kids', kidsRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/catalog', catalogRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
