# Testing Guide for URL Shortener with Redis

## Prerequisites

1. **Redis Server Running**: Verify Redis is running
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Environment Variables**: Create `.env` file (copy from `.env.example`)
   ```bash
   cp .env.example .env
   ```

## Step 1: Start the Server

```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Redis connected successfully
🚀 Server running on http://localhost:5000
```

If you see these messages, Redis is connected successfully! ✅

---

## Step 2: Test Health Endpoint

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{"status":"OK","message":"Server is running"}
```

---

## Step 3: Create a Short URL

```bash
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d "{\"longUrl\": \"https://www.google.com\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "shortCode": "abc1234",
    "longUrl": "https://www.google.com",
    "shortUrl": "http://localhost:5000/abc1234",
    "createdAt": "2026-01-31T..."
  }
}
```

**Note the `shortCode`** - you'll use it in the next tests!

---

## Step 4: Test URL Redirect (Cache Read)

Replace `{shortCode}` with the actual code from Step 3:

```bash
curl -I http://localhost:5000/{shortCode}
```

**Expected Response:**
```
HTTP/1.1 302 Found
Location: https://www.google.com
...
```

This should be **fast** because it's reading from Redis cache! 🚀

---

## Step 5: Verify Redis Cache

Open Redis CLI and check the cached data:

```bash
redis-cli
```

In Redis CLI:
```redis
KEYS *
# Should show: url:{shortCode}

GET url:{shortCode}
# Should show: https://www.google.com

TTL url:{shortCode}
# Should show remaining seconds (up to 3600)
```

Type `exit` to leave Redis CLI.

---

## Step 6: Test URL Statistics

```bash
curl http://localhost:5000/api/stats/{shortCode}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "shortCode": "abc1234",
    "longUrl": "https://www.google.com",
    "clickCount": 2,
    "createdAt": "...",
    "expiresAt": null
  }
}
```

The `clickCount` should increment each time you access the short URL!

---

## Step 7: Test Custom Short Code

```bash
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d "{\"longUrl\": \"https://github.com\", \"customCode\": \"github\"}"
```

Then test it:
```bash
curl -I http://localhost:5000/github
# Should redirect to https://github.com
```

---

## Step 8: Test Cache Performance

**First request** (cache miss - slower):
```bash
time curl -I http://localhost:5000/{newShortCode}
```

**Second request** (cache hit - faster):
```bash
time curl -I http://localhost:5000/{newShortCode}
```

The second request should be noticeably faster! ⚡

---

## Step 9: Test Error Handling

**Test invalid URL:**
```bash
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d "{\"longUrl\": \"not-a-valid-url\"}"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid URL format"
}
```

**Test non-existent short code:**
```bash
curl http://localhost:5000/nonexistent
```

**Expected Response:**
```json
{
  "success": false,
  "message": "URL not found or expired"
}
```

---

## Step 10: Test Graceful Shutdown

In the terminal where the server is running, press `Ctrl+C`:

**Expected Output:**
```
🛑 Shutting down gracefully...
✅ Redis connection closed
```

---

## Monitoring Redis in Real-Time

Open a new terminal and run:

```bash
redis-cli monitor
```

This will show all Redis commands in real-time as you create and access URLs!

---

## Quick Test Script

Save this as `test.sh` in the backend folder:

```bash
#!/bin/bash

echo "🧪 Testing URL Shortener with Redis"
echo ""

echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:5000/health | jq
echo ""

echo "2️⃣ Creating short URL..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://www.example.com"}')
echo $RESPONSE | jq
SHORT_CODE=$(echo $RESPONSE | jq -r '.data.shortCode')
echo ""

echo "3️⃣ Testing redirect with code: $SHORT_CODE"
curl -I http://localhost:5000/$SHORT_CODE
echo ""

echo "4️⃣ Checking Redis cache..."
redis-cli GET "url:$SHORT_CODE"
echo ""

echo "5️⃣ Getting stats..."
curl -s http://localhost:5000/api/stats/$SHORT_CODE | jq
echo ""

echo "✅ All tests complete!"
```

Run it with:
```bash
bash test.sh
```

---

## Troubleshooting

### Redis Connection Failed
```
❌ Redis error: connect ECONNREFUSED
```
**Solution:** Start Redis server
```bash
sudo service redis-server start
# or
redis-server
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill the process using port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/WSL
lsof -ti:5000 | xargs kill -9
```

### Environment Variables Not Loaded
**Solution:** Ensure `.env` file exists in the backend folder
```bash
ls -la .env
```

---

## Success Indicators ✅

- ✅ Server starts with "✅ Redis connected successfully"
- ✅ URLs are cached in Redis (verify with `redis-cli KEYS *`)
- ✅ Second requests are faster (cache hits)
- ✅ Click counts increment correctly
- ✅ Server shuts down gracefully with Redis cleanup

Happy testing! 🚀
