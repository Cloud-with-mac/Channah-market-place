# Troubleshooting Checklist

Use this checklist to diagnose and fix mobile app connection issues.

## Before You Start

Print or keep this checklist visible while testing.

---

## Backend Connection Issues

### ❌ Phone can't reach `http://YOUR_IP:8000/docs`

Check each item:

- [ ] Backend is running (`uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`)
- [ ] Used correct flag: `--host 0.0.0.0` (NOT just `--reload`)
- [ ] IP address in URL matches your computer's actual IP
- [ ] Phone and computer on SAME Wi-Fi network
- [ ] NOT using cellular data on phone
- [ ] NOT using Guest Wi-Fi (it isolates devices)
- [ ] Computer NOT on VPN
- [ ] Firewall allows port 8000

**Windows Firewall Check:**
```
1. Windows Security → Firewall & Network Protection
2. Allow an app through firewall
3. Find Python or create rule for port 8000
4. Enable for Private networks
```

**Mac Firewall Check:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

**Test from computer first:**
```
http://localhost:8000/docs (should work)
http://YOUR_IP:8000/docs (should also work)
```

---

## Mobile App Issues

### ❌ "Network request failed"

- [ ] Updated `mobile/shared/api/client.ts` line 7 with YOUR IP
- [ ] Backend running with `--host 0.0.0.0`
- [ ] Same Wi-Fi network
- [ ] Ran connection test: `node mobile/test-backend-connection.js`

**Fix:**
```bash
# 1. Verify IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. Update client.ts
# Edit mobile/shared/api/client.ts line 7

# 3. Restart app
npm start -- --clear
```

---

### ❌ "Unable to connect to Metro"

- [ ] Metro bundler is running (should see "Metro waiting...")
- [ ] No other Metro instances running
- [ ] Phone and computer on same Wi-Fi

**Fix:**
```bash
# Stop all (Ctrl+C)
# Clear cache
npm start -- --clear

# If still fails, reinstall
rm -rf node_modules
npm install
npm start
```

---

### ❌ App loads but shows empty data

- [ ] Backend has data (check `http://localhost:8000/docs`)
- [ ] Login successful (check token received)
- [ ] No 401/403 errors in backend logs
- [ ] Backend logs show requests coming in

**Check Backend Logs:**
```
Should see:
INFO: 192.168.1.XXX - "GET /api/v1/products HTTP/1.1" 200 OK
```

**Test API manually:**
```
Visit: http://localhost:8000/docs
Try: GET /api/v1/products
Should return data
```

---

### ❌ "401 Unauthorized" errors

- [ ] Login completed successfully
- [ ] Token was saved (check app state)
- [ ] Backend not rejecting token

**Fix:**
1. Log out from app
2. Log in again
3. Try action again

**If persists:**
```typescript
// Check token in mobile/shared/api/client.ts
// Verify Authorization header is being sent
```

---

### ❌ App crashes on startup

- [ ] Node modules installed (`npm install` completed)
- [ ] No syntax errors (check terminal)
- [ ] Compatible Expo Go version

**Fix:**
```bash
# 1. Clean install
rm -rf node_modules
npm install

# 2. Clear Expo cache
npx expo start -c

# 3. Update Expo Go app on phone

# 4. Restart everything
```

---

## Network Diagnostic Commands

### Verify Backend Running
```bash
# From your computer
curl http://localhost:8000/docs

# Should return HTML
```

### Verify Backend Accessible on Network
```bash
# From your computer, using your IP
curl http://YOUR_IP:8000/docs

# Should return same HTML
```

### Check Port Not Blocked
```bash
# Windows - Check if port 8000 is listening
netstat -ano | findstr :8000

# Mac/Linux
lsof -i :8000
```

### Find All IP Addresses
```bash
# Windows
ipconfig /all

# Mac/Linux
ifconfig -a
```

---

## Environment Checklist

### Computer Setup

- [ ] Node.js v18+ installed (`node --version`)
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Mobile dependencies installed (`npm install`)
- [ ] Port 8000 not used by other apps

### Phone Setup

- [ ] Expo Go app installed
- [ ] On same Wi-Fi as computer
- [ ] NOT on cellular data
- [ ] NOT on VPN
- [ ] Wi-Fi has internet access

### Network Setup

- [ ] Same Wi-Fi network
- [ ] Router allows device-to-device communication
- [ ] No AP Isolation enabled on router
- [ ] Not using Guest Wi-Fi
- [ ] Not using Public Wi-Fi

---

## Quick Tests

### Test 1: Backend Reachable from Computer
```
✅ PASS: http://localhost:8000/docs works
❌ FAIL: Backend not running or crashed
```

### Test 2: Backend Reachable via IP
```
✅ PASS: http://YOUR_IP:8000/docs works
❌ FAIL: Firewall or network issue
```

### Test 3: Backend Reachable from Phone
```
✅ PASS: http://YOUR_IP:8000/docs works in phone browser
❌ FAIL: Different network or firewall
```

### Test 4: Mobile App Connects
```
✅ PASS: App loads and shows data
❌ FAIL: Check mobile/shared/api/client.ts
```

---

## Last Resort Solutions

### Nuclear Option 1: Restart Everything
```bash
1. Stop backend (Ctrl+C)
2. Stop Metro (Ctrl+C)
3. Close Expo Go on phone
4. Restart computer
5. Restart phone
6. Restart router (if needed)
7. Start from Step 1 of testing
```

### Nuclear Option 2: Clean Install
```bash
# Backend
cd backend
rm -rf __pycache__
pip install -r requirements.txt --force-reinstall

# Mobile
cd mobile/customer-app
rm -rf node_modules
rm package-lock.json
npm install

# Clear all caches
npx expo start -c
```

### Nuclear Option 3: Use ngrok
```bash
# If local network won't work, use ngrok
npm install -g ngrok

# In new terminal
ngrok http 8000

# Copy https URL (e.g., https://abc123.ngrok.io)
# Update mobile/shared/api/client.ts:
const API_BASE_URL = 'https://abc123.ngrok.io/api/v1';
```

---

## Success Indicators

### ✅ Everything Working:

1. **Backend logs show requests:**
   ```
   INFO: 192.168.1.XXX - "POST /api/v1/auth/login HTTP/1.1" 200
   INFO: 192.168.1.XXX - "GET /api/v1/products HTTP/1.1" 200
   ```

2. **Mobile app shows:**
   - Products load
   - Can add to cart
   - Orders show up
   - Profile loads

3. **No error messages in:**
   - Backend terminal
   - Metro terminal
   - Phone screen

---

## Getting Help

If still not working after trying everything:

1. **Run diagnostics:**
   ```bash
   node mobile/test-backend-connection.js
   ```

2. **Check all logs:**
   - Backend terminal output
   - Metro bundler output
   - Phone console (shake phone → Debug → View console)

3. **Document the issue:**
   - What step fails?
   - What error messages?
   - What have you tried?

4. **Review documentation:**
   - [HOW-TO-TEST.md](./HOW-TO-TEST.md) - Full testing guide
   - [SETUP-BACKEND-CONNECTION.md](./SETUP-BACKEND-CONNECTION.md) - Connection setup
   - [BACKEND-API-STATUS.md](./BACKEND-API-STATUS.md) - API documentation

---

**Most issues are:**
1. Wrong IP address (50%)
2. Forgot `--host 0.0.0.0` (30%)
3. Different Wi-Fi networks (15%)
4. Firewall blocking (5%)

**Fix those four and you're 99% there!**
