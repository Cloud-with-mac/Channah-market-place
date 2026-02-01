# Quick Test Guide - TL;DR

**Get your mobile apps running in 5 minutes!**

## 1. Find Your IP Address

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Write it down! Example: `192.168.1.100`

## 2. Update Mobile Config

Edit: `mobile/shared/api/client.ts` (line 7)

```typescript
const API_BASE_URL = 'http://YOUR_IP_HERE:8000/api/v1';
```

## 3. Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**MUST use `--host 0.0.0.0`!**

## 4. Test Connection

Open on your **phone's browser**: `http://YOUR_IP:8000/docs`

✅ Works? Continue!
❌ Fails? Check firewall and Wi-Fi

## 5. Install & Run App

**Customer App:**
```bash
cd mobile/customer-app
npm install
npm start
```

**Vendor App:**
```bash
cd mobile/vendor-app
npm install
npm start
```

## 6. Open on Phone

1. Open **Expo Go** app on phone
2. Scan the **QR code** from terminal
3. Wait for app to load

## Test Accounts

**Customer:**
- Email: `test@example.com`
- Password: `password123`

**Vendor:**
- Email: `vendor@example.com`
- Password: `password123`

## Quick Troubleshooting

**"Network request failed"**
→ Wrong IP or backend not running

**"Unable to connect to Metro"**
→ Run: `npm start -- --clear`

**Backend unreachable from phone**
→ Check Windows Firewall, allow port 8000

**App crashes**
→ Delete `node_modules`, run `npm install` again

---

**See [HOW-TO-TEST.md](./HOW-TO-TEST.md) for detailed instructions.**
