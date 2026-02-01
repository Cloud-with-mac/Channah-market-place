# Backend Connection Setup Guide

This guide will help you connect your mobile apps to the backend server.

## Quick Setup (3 Steps)

### Step 1: Find Your Computer's IP Address

The mobile apps need to connect to your backend server using your computer's local IP address.

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).
Example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig | grep "inet "
# OR
ip addr show
```
Look for your local IP (usually starts with `192.168.` or `10.`).

### Step 2: Start Backend Server

The backend MUST be started with `--host 0.0.0.0` to accept connections from other devices:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**CRITICAL:** The `--host 0.0.0.0` flag is required for mobile access!

### Step 3: Update Mobile App Configuration

Edit the file: `mobile/shared/api/client.ts`

```typescript
// Line 7: Change this to YOUR computer's IP address
const API_BASE_URL = 'http://YOUR_IP_HERE:8000/api/v1';

// Example:
const API_BASE_URL = 'http://192.168.1.100:8000/api/v1';
```

## Verification Checklist

### ✅ Before Running Mobile Apps

- [ ] Backend server is running with `--host 0.0.0.0`
- [ ] Mobile device and computer are on the same Wi-Fi network
- [ ] No VPN is active on either device
- [ ] Firewall allows port 8000 connections (Windows Firewall, etc.)
- [ ] Updated `API_BASE_URL` in `mobile/shared/api/client.ts`

### ✅ Test Backend Accessibility

**From your mobile device's browser:**
```
http://YOUR_COMPUTER_IP:8000/docs
```

You should see the FastAPI Swagger documentation page. If this doesn't load:
- Check if backend is running
- Verify IP address is correct
- Ensure same Wi-Fi network
- Check firewall settings

**Example:**
```
http://192.168.1.100:8000/docs
```

## Common Issues & Solutions

### Issue: "Network request failed"

**Causes:**
- Wrong IP address in `API_BASE_URL`
- Backend not running
- Different Wi-Fi networks
- Firewall blocking connection

**Solutions:**
1. Double-check IP address with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Verify backend is running: `http://localhost:8000/docs` should work on your computer
3. Ensure both devices on same Wi-Fi
4. Temporarily disable firewall to test
5. Try restarting backend with `--host 0.0.0.0`

### Issue: "Cannot connect to backend"

**Check:**
```bash
# On your computer, verify backend is accessible:
curl http://localhost:8000/api/v1/health

# From another terminal, verify it's accessible via IP:
curl http://YOUR_IP:8000/api/v1/health
```

### Issue: Backend running but mobile can't connect

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Python or allow port 8000
4. Enable for Private networks

**Mac Firewall:**
```bash
# Check if firewall is blocking
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

### Issue: Connection works but gets 401 errors

This means the connection is working! The 401 error is about authentication, not connectivity.
- Try logging out and logging back in
- Check if you're using correct credentials

## Network Requirements

### Same Wi-Fi Network

Both your computer and mobile device MUST be on the same Wi-Fi network.

**Don't use:**
- Computer on Ethernet, phone on Wi-Fi (different subnets)
- Computer on VPN
- Guest Wi-Fi networks (they often isolate devices)

**Do use:**
- Same Wi-Fi network on both devices
- Home/office Wi-Fi (not public/guest)
- No VPN on computer

## Testing the Connection

### Test 1: Ping Backend from Mobile Browser

Open browser on your phone and visit:
```
http://YOUR_COMPUTER_IP:8000/docs
```

✅ Success: You see FastAPI documentation
❌ Failure: Connection timeout or cannot connect

### Test 2: Login from Mobile App

1. Start customer or vendor app
2. Try to login with test credentials
3. Watch terminal logs on your computer

**Expected logs:**
```
INFO: 192.168.1.XXX:XXXXX - "POST /api/v1/auth/login HTTP/1.1" 200 OK
```

### Test 3: Load Data

After login, try:
- Customer app: Browse products
- Vendor app: View dashboard

Watch for API calls in terminal.

## Quick Reference

| What | Command/Location |
|------|-----------------|
| Find IP (Windows) | `ipconfig` |
| Find IP (Mac/Linux) | `ifconfig` or `ip addr` |
| Start backend | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` |
| Config file | `mobile/shared/api/client.ts` (line 7) |
| Test URL | `http://YOUR_IP:8000/docs` |
| Default port | `8000` |

## Advanced: Using ngrok (Optional)

If you can't get local network to work, use ngrok for development:

```bash
# Install ngrok
npm install -g ngrok

# In new terminal, expose backend
ngrok http 8000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update API_BASE_URL to:
const API_BASE_URL = 'https://abc123.ngrok.io/api/v1';
```

**Note:** ngrok URLs change on every restart unless you have a paid account.

## Summary

1. **Find IP:** `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. **Start Backend:** `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
3. **Update Config:** Edit `mobile/shared/api/client.ts` line 7
4. **Test:** Open `http://YOUR_IP:8000/docs` in phone browser
5. **Run App:** `npm start` in customer-app or vendor-app folder

---

**Need Help?**
- Backend not starting: Check if port 8000 is already in use
- Can't find IP: Run `ipconfig` or `ifconfig` carefully
- Connection fails: Ensure same Wi-Fi and firewall allows connections
