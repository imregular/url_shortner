# Testing URL Shortener with Postman 🚀

## Prerequisites

1. **Start Redis Server** (in WSL/Linux terminal):
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Start Your Backend Server**:
   ```bash
   cd d:\url_shortner\backend
   npm run dev
   ```
   
   **Expected Console Output:**
   ```
   ✅ Redis connected successfully
   🚀 Server running on http://localhost:5000
   ```

---

## Test 1: Health Check ✅

**Purpose:** Verify server is running

- **Method:** `GET`
- **URL:** `http://localhost:5000/health`
- **Headers:** None needed
- **Body:** None

**Expected Response (200 OK):**
```json
{
    "status": "OK",
    "message": "Server is running"
}
```

---

## Test 2: Create Short URL 🔗

**Purpose:** Create a new short URL and cache it in Redis

- **Method:** `POST`
- **URL:** `http://localhost:5000/api/shorten`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
      "longUrl": "https://www.google.com"
  }
  ```

**Expected Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "shortCode": "abc1234",
        "longUrl": "https://www.google.com",
        "shortUrl": "http://localhost:5000/abc1234",
        "createdAt": "2026-01-31T01:20:00.000Z"
    }
}
```

**📝 Note:** Copy the `shortCode` value - you'll need it for the next tests!

---

## Test 3: Redirect to Long URL 🔄

**Purpose:** Test URL redirect (this reads from Redis cache!)

- **Method:** `GET`
- **URL:** `http://localhost:5000/{shortCode}`
  - Replace `{shortCode}` with the actual code from Test 2
  - Example: `http://localhost:5000/abc1234`
- **Headers:** None needed
- **Body:** None

**Expected Response (302 Found):**
- Postman will automatically follow the redirect
- You'll see the final page (Google homepage)
- Check the **Headers** tab to see: `Location: https://www.google.com`

**⚡ Performance:** This should be **very fast** because it's reading from Redis cache!

---

## Test 4: Get URL Statistics 📊

**Purpose:** Check click count and URL details

- **Method:** `GET`
- **URL:** `http://localhost:5000/api/stats/{shortCode}`
  - Replace `{shortCode}` with your actual code
  - Example: `http://localhost:5000/api/stats/abc1234`
- **Headers:** None needed
- **Body:** None

**Expected Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "shortCode": "abc1234",
        "longUrl": "https://www.google.com",
        "clickCount": 1,
        "createdAt": "2026-01-31T01:20:00.000Z",
        "expiresAt": null
    }
}
```

**📈 Note:** The `clickCount` increments each time you access the short URL (Test 3)

---

## Test 5: Create Custom Short Code 🎯

**Purpose:** Create a short URL with a custom code

- **Method:** `POST`
- **URL:** `http://localhost:5000/api/shorten`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
      "longUrl": "https://github.com",
      "customCode": "github"
  }
  ```

**Expected Response (201 Created):**
```json
{
    "success": true,
    "data": {
        "shortCode": "github",
        "longUrl": "https://github.com",
        "shortUrl": "http://localhost:5000/github",
        "createdAt": "2026-01-31T01:20:00.000Z"
    }
}
```

Now test it: `GET http://localhost:5000/github` → Should redirect to GitHub!

---

## Test 6: Error - Invalid URL ❌

**Purpose:** Test validation

- **Method:** `POST`
- **URL:** `http://localhost:5000/api/shorten`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
      "longUrl": "not-a-valid-url"
  }
  ```

**Expected Response (500 Internal Server Error):**
```json
{
    "success": false,
    "message": "Invalid URL format"
}
```

---

## Test 7: Error - Duplicate Custom Code ❌

**Purpose:** Test duplicate prevention

- **Method:** `POST`
- **URL:** `http://localhost:5000/api/shorten`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
      "longUrl": "https://example.com",
      "customCode": "github"
  }
  ```
  (Use the same custom code from Test 5)

**Expected Response (500 Internal Server Error):**
```json
{
    "success": false,
    "message": "Custom short code already exists"
}
```

---

## Test 8: Error - URL Not Found ❌

**Purpose:** Test non-existent short code

- **Method:** `GET`
- **URL:** `http://localhost:5000/nonexistent123`
- **Headers:** None needed
- **Body:** None

**Expected Response (404 Not Found):**
```json
{
    "success": false,
    "message": "URL not found or expired"
}
```

---

## Test 9: Error - Missing Long URL ❌

**Purpose:** Test required field validation

- **Method:** `POST`
- **URL:** `http://localhost:5000/api/shorten`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
      "customCode": "test"
  }
  ```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Long URL is required"
}
```

---

## Verify Redis Cache 🔍

After running Test 2 or Test 5, verify the data is in Redis:

**Open Redis CLI:**
```bash
redis-cli
```

**Check cached URLs:**
```redis
# List all keys
KEYS *

# Get specific URL (replace abc1234 with your shortCode)
GET url:abc1234

# Check TTL (time to live)
TTL url:abc1234

# Exit
exit
```

**Expected Output:**
```
127.0.0.1:6379> KEYS *
1) "url:abc1234"
2) "url:github"

127.0.0.1:6379> GET url:abc1234
"https://www.google.com"

127.0.0.1:6379> TTL url:abc1234
(integer) 3542
```

---

## Testing Workflow 🔄

### Complete Test Sequence:

1. ✅ **Health Check** → Verify server is running
2. 🔗 **Create Short URL** → Get a shortCode
3. 🔄 **Redirect** → Test the shortCode works
4. 📊 **Get Stats** → Verify clickCount = 1
5. 🔄 **Redirect Again** → Test cache hit
6. 📊 **Get Stats Again** → Verify clickCount = 2
7. 🔍 **Check Redis** → Verify data is cached
8. 🎯 **Custom Code** → Test custom shortCode
9. ❌ **Test Errors** → Verify validation works

---

## Postman Collection Setup (Optional)

Create a Postman Collection with environment variables:

**Environment Variables:**
- `base_url` = `http://localhost:5000`
- `shortCode` = (leave empty, will be set automatically)

**In Test 2 (Create Short URL), add this to the "Tests" tab:**
```javascript
// Save shortCode for later tests
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("shortCode", response.data.shortCode);
}
```

**Then use `{{base_url}}` and `{{shortCode}}` in your requests:**
- URL: `{{base_url}}/{{shortCode}}`

---

## Performance Testing 🚀

### Test Cache Performance:

1. **First Request** (Cache Miss):
   - `GET http://localhost:5000/{newShortCode}`
   - Check response time in Postman (bottom right)
   - Example: ~50ms

2. **Second Request** (Cache Hit):
   - `GET http://localhost:5000/{sameShortCode}`
   - Check response time
   - Example: ~5ms (10x faster!)

The second request should be **significantly faster** because it's reading from Redis! ⚡

---

## Troubleshooting 🔧

### Server Not Starting
**Error:** `Redis connection failed`
```bash
# Start Redis
sudo service redis-server start

# Verify
redis-cli ping
```

### Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# WSL/Linux
lsof -ti:5000 | xargs kill -9
```

### Postman Shows HTML Instead of JSON
- Make sure you're using the correct URL
- Check that the server is running
- Verify the request method (GET/POST)

---

## Success Checklist ✅

- ✅ Server starts with "✅ Redis connected successfully"
- ✅ Health endpoint returns 200 OK
- ✅ Can create short URLs (201 Created)
- ✅ Short URLs redirect correctly (302 Found)
- ✅ Stats show correct click counts
- ✅ Custom codes work
- ✅ Validation errors return proper messages
- ✅ Data appears in Redis (`redis-cli KEYS *`)
- ✅ Cache hits are faster than cache misses

---

## Quick Reference 📋

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/shorten` | POST | Create short URL |
| `/{shortCode}` | GET | Redirect to long URL |
| `/api/stats/{shortCode}` | GET | Get URL statistics |

Happy Testing! 🎉
