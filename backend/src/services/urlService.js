const { nanoid } = require('nanoid');
const prisma = require('../config/database');
const validator = require('validator');
const redisClient = require('../config/redis');
const crypto = require('crypto');

// Cache TTL in seconds (default: 1 hour)
const CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL) || 3600;

const urlService = {
    // Generate a short code from URL hash
    generateShortCode: (url) => {
        // Create hash of the URL
        const hash = crypto.createHash('sha256').update(url).digest('hex');
        // Take first 7 characters of the hash
        return hash.substring(0, 7);
    },

    // Create short URL
    createShortUrl: async (longUrl, customCode = null) => {
        // Validate URL
        if (!validator.isURL(longUrl)) {
            throw new Error('Invalid URL format');
        }

        // Generate or use custom short code
        let shortCode = customCode || urlService.generateShortCode(longUrl);

        // Check if this exact URL already exists (for hash-based codes)
        if (!customCode) {
            const existingUrl = await prisma.url.findUnique({
                where: { shortCode }
            });

            if (existingUrl) {
                // URL already shortened, return existing record
                return existingUrl;
            }
        }

        // Check if custom code already exists
        if (customCode) {
            const existing = await prisma.url.findUnique({
                where: { shortCode: customCode }
            });

            if (existing) {
                throw new Error('Custom short code already exists');
            }
        }

        // Create URL in database
        const url = await prisma.url.create({
            data: {
                shortCode,
                longUrl,
            }
        });

        // Cache it in Redis with TTL
        try {
            await redisClient.setEx(`url:${shortCode}`, CACHE_TTL, longUrl);
        } catch (err) {
            console.error('Redis cache set error:', err);
            // Continue even if cache fails
        }

        return url;
    },

    // Get long URL by short code
    getLongUrl: async (shortCode) => {
        // Check Redis cache first
        try {
            const cachedUrl = await redisClient.get(`url:${shortCode}`);
            if (cachedUrl) {
                // Update click count in background (don't wait)
                prisma.url.update({
                    where: { shortCode },
                    data: { clickCount: { increment: 1 } }
                }).catch(err => console.error('Error updating click count:', err));

                return cachedUrl;
            }
        } catch (err) {
            console.error('Redis cache get error:', err);
            // Continue to database lookup if Redis fails
        }

        // If not in cache, get from database
        const url = await prisma.url.findUnique({
            where: { shortCode }
        });

        if (!url) {
            return null;
        }

        // Check if expired
        if (url.expiresAt && new Date() > url.expiresAt) {
            return null;
        }

        // Update click count
        await prisma.url.update({
            where: { shortCode },
            data: { clickCount: { increment: 1 } }
        });

        // Add to Redis cache
        try {
            await redisClient.setEx(`url:${shortCode}`, CACHE_TTL, url.longUrl);
        } catch (err) {
            console.error('Redis cache set error:', err);
            // Continue even if cache fails
        }

        return url.longUrl;
    },

    // Get URL stats
    getUrlStats: async (shortCode) => {
        const url = await prisma.url.findUnique({
            where: { shortCode }
        });

        return url;
    }
};

module.exports = urlService;