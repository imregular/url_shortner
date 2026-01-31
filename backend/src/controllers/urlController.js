const urlService = require('../services/urlService');

const urlController = {
    // Create short URL
    shortenUrl: async (req, res, next) => {
        try {
            const { longUrl, customCode } = req.body;

            if (!longUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Long URL is required'
                });
            }

            const url = await urlService.createShortUrl(longUrl, customCode);

            // Use BASE_URL for production, fallback to localhost for dev
            const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

            res.status(201).json({
                success: true,
                data: {
                    shortCode: url.shortCode,
                    longUrl: url.longUrl,
                    shortUrl: `${process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`}/${url.shortCode}`,
                    createdAt: url.createdAt
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Redirect to long URL
    redirectUrl: async (req, res, next) => {
        try {
            const { shortCode } = req.params;

            const longUrl = await urlService.getLongUrl(shortCode);

            if (!longUrl) {
                return res.status(404).json({
                    success: false,
                    message: 'URL not found or expired'
                });
            }

            // Redirect to the long URL
            res.redirect(longUrl);
        } catch (error) {
            next(error);
        }
    },

    // Get URL statistics
    getStats: async (req, res, next) => {
        try {
            const { shortCode } = req.params;

            const stats = await urlService.getUrlStats(shortCode);

            if (!stats) {
                return res.status(404).json({
                    success: false,
                    message: 'URL not found'
                });
            }

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = urlController;