import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
];

const jsonError = (c, message, status = 400) =>
  c.json(
    {
      success: false,
      message,
    },
    status
  );

const normalizeAllowedOrigins = (rawOrigins) => {
  if (!rawOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isAllowedOrigin = (origin, allowedOrigins) => {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const parsedOrigin = new URL(origin);
    const hostname = parsedOrigin.hostname.toLowerCase();

    if (
      hostname === 'url-shortner-delta-three.vercel.app' ||
      (hostname.endsWith('.vercel.app') && hostname.startsWith('url-shortner-'))
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

const isValidCustomCode = (customCode) => /^[A-Za-z0-9_-]{3,32}$/.test(customCode);

const isValidHttpUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const sha256Hex = async (value) => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const generateShortCode = async (url) => {
  const hash = await sha256Hex(url);
  return hash.slice(0, 7);
};

const buildShortUrl = (c, shortCode) => {
  const configuredBaseUrl = c.env.BASE_URL?.trim();
  const requestOrigin = new URL(c.req.url).origin;
  return `${configuredBaseUrl || requestOrigin}/${shortCode}`;
};

app.use('*', async (c, next) => {
  const allowedOrigins = normalizeAllowedOrigins(c.env.ALLOWED_ORIGINS);

  return cors({
    origin: (origin) => {
      if (!origin) {
        return '*';
      }

      return isAllowedOrigin(origin, allowedOrigins) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next);
});

app.onError((error, c) => {
  console.error(error);
  return jsonError(c, error.message || 'Internal Server Error', error.status || 500);
});

app.get('/health', (c) =>
  c.json({
    success: true,
    status: 'OK',
    message: 'Worker is running',
  })
);

app.post('/api/shorten', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body?.longUrl) {
    return jsonError(c, 'Long URL is required');
  }

  const longUrl = String(body.longUrl).trim();
  const customCode = body.customCode ? String(body.customCode).trim() : null;

  if (!isValidHttpUrl(longUrl)) {
    return jsonError(c, 'Invalid URL format');
  }

  if (customCode && !isValidCustomCode(customCode)) {
    return jsonError(c, 'Custom short code must be 3-32 characters and use only letters, numbers, hyphens, or underscores');
  }

  const shortCode = customCode || (await generateShortCode(longUrl));
  const now = new Date().toISOString();

  if (customCode) {
    const existingCustom = await c.env.DB.prepare(
      'SELECT short_code FROM urls WHERE short_code = ?1'
    )
      .bind(shortCode)
      .first();

    if (existingCustom) {
      return jsonError(c, 'Custom short code already exists', 409);
    }
  } else {
    const existingUrl = await c.env.DB.prepare(
      'SELECT short_code, long_url, created_at FROM urls WHERE short_code = ?1'
    )
      .bind(shortCode)
      .first();

    if (existingUrl) {
      return c.json({
        success: true,
        data: {
          shortCode: existingUrl.short_code,
          longUrl: existingUrl.long_url,
          shortUrl: buildShortUrl(c, existingUrl.short_code),
          createdAt: existingUrl.created_at,
        },
      });
    }
  }

  await c.env.DB.prepare(
    `INSERT INTO urls (short_code, long_url, created_at, click_count)
     VALUES (?1, ?2, ?3, 0)`
  )
    .bind(shortCode, longUrl, now)
    .run();

  return c.json(
    {
      success: true,
      data: {
        shortCode,
        longUrl,
        shortUrl: buildShortUrl(c, shortCode),
        createdAt: now,
      },
    },
    201
  );
});

app.get('/api/stats/:shortCode', async (c) => {
  const shortCode = c.req.param('shortCode');

  const url = await c.env.DB.prepare(
    `SELECT short_code, long_url, created_at, expires_at, click_count
     FROM urls
     WHERE short_code = ?1`
  )
    .bind(shortCode)
    .first();

  if (!url) {
    return jsonError(c, 'URL not found', 404);
  }

  return c.json({
    success: true,
    data: {
      shortCode: url.short_code,
      longUrl: url.long_url,
      createdAt: url.created_at,
      expiresAt: url.expires_at,
      clickCount: url.click_count,
    },
  });
});

app.get('/:shortCode', async (c) => {
  const shortCode = c.req.param('shortCode');

  const url = await c.env.DB.prepare(
    `SELECT short_code, long_url, expires_at
     FROM urls
     WHERE short_code = ?1`
  )
    .bind(shortCode)
    .first();

  if (!url) {
    return jsonError(c, 'URL not found or expired', 404);
  }

  if (url.expires_at && new Date(url.expires_at) < new Date()) {
    return jsonError(c, 'URL not found or expired', 404);
  }

  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      `UPDATE urls
       SET click_count = click_count + 1
       WHERE short_code = ?1`
    )
      .bind(shortCode)
      .run()
  );

  return c.redirect(url.long_url, 302);
});

export default app;
