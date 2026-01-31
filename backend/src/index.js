require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const urlRoutes = require('./routes/urlRoutes');
const errorHandler = require('./middleware/errorHandler');
const redisClient = require('./config/redis');
const prisma = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Trust proxy (needed for Railway/Render/Cloudflare)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL?.split(',') || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Routes
app.use('/', urlRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    try {
        await redisClient.quit();
        await prisma.$disconnect();
        console.log('✅ All connections closed');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
