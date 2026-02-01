# Quick Start Guide

## ⚠️ Important: You're in the wrong directory!

The `mobile/` folder is just a container. The actual apps are in subdirectories.

---

## 🚀 Start Customer App:

```bash
# From mobile/ directory, run:
cd customer-app
npm install
npm start
```

Then scan the QR code with Expo Go on your phone!

---

## 🚀 Start Vendor App:

```bash
# From mobile/ directory, run:
cd vendor-app
npm install
npm start
```

Then scan the QR code with Expo Go on your phone!

---

## 📱 Current Location Issue

You ran:
```bash
C:\...\mobile> npm install  ❌ WRONG
```

You should run:
```bash
C:\...\mobile\customer-app> npm install  ✅ CORRECT
# OR
C:\...\mobile\vendor-app> npm install  ✅ CORRECT
```

---

## Full Setup Checklist:

### 1. Find Your IP Address
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

### 2. Update Backend URL
Edit `mobile/shared/api/client.ts` line 7:
```typescript
const API_BASE_URL = 'http://YOUR_IP_HERE:8000/api/v1';
// Example: 'http://192.168.1.100:8000/api/v1'
```

### 3. Ensure Backend is Running
Backend should already be running at http://0.0.0.0:8000

### 4. Install & Start App
```bash
# Navigate to the correct directory:
cd mobile/customer-app

# Install dependencies (only needed once):
npm install

# Start the app:
npm start
```

### 5. Open on Phone
- Open **Expo Go** app on your phone
- Tap **"Scan QR code"**
- Scan the QR code from your terminal
- App will load!

---

## Test Accounts

### Customer:
- Email: `test@example.com`
- Password: `password123`

### Vendor:
- Email: `vendor@example.com`
- Password: `password123`

---

## Troubleshooting

**"Network request failed"**
→ Update IP address in `shared/api/client.ts`

**"Unable to connect to Metro"**
→ Run: `npm start -- --clear`

**Backend unreachable**
→ Check firewall, ensure backend uses `--host 0.0.0.0`
