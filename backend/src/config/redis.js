const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD || undefined,
});

let isRedisConnected = false;

// Event handlers
redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
    isRedisConnected = true;
});

redisClient.on('error', (err) => {
    console.warn('⚠️  Redis not available:', err.message);
    console.log('ℹ️  App will continue without caching');
    isRedisConnected = false;
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

// Try to connect to Redis (non-blocking)
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.warn('⚠️  Redis connection failed:', err.message);
        console.log('ℹ️  App will continue without caching');
    }
})();

// Export a safe wrapper
module.exports = {
    async get(key) {
        if (!isRedisConnected) return null;
        try {
            return await redisClient.get(key);
        } catch (err) {
            console.error('Redis get error:', err);
            return null;
        }
    },
    async setEx(key, ttl, value) {
        if (!isRedisConnected) return;
        try {
            await redisClient.setEx(key, ttl, value);
        } catch (err) {
            console.error('Redis setEx error:', err);
        }
    },
    async quit() {
        if (!isRedisConnected) return;
        try {
            await redisClient.quit();
        } catch (err) {
            console.error('Redis quit error:', err);
        }
    }
};

