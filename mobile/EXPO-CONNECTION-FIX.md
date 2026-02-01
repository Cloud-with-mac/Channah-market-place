# Fix Expo Go Connection Error

## Problem
Expo Go shows: "Failed to connect to /10.153.155.63:8082"

## Quick Fix - Use Tunnel Mode (EASIEST)

1. **Stop Metro bundler** (Ctrl+C in terminal)

2. **Start with tunnel mode**:
```bash
cd mobile/customer-app
npm start -- --tunnel
```

3. **Scan the new QR code** in Expo Go
   - Tunnel mode works even if phone/computer are on different networks
   - No firewall configuration needed

## Alternative Fix - Manual Firewall Configuration

If you prefer LAN mode, configure Windows Firewall:

### Step 1: Check Your Network
- **Computer WiFi**: Connected to WiFi (IP: 10.153.155.63)
- **Phone**: MUST be on the SAME WiFi network
- **Verify**: Check your phone's WiFi settings - it should show the same network name

### Step 2: Allow Port 8082 in Windows Firewall

1. **Open Windows Defender Firewall with Advanced Security** (as Administrator):
   - Press `Win + R`
   - Type: `wf.msc`
   - Press Enter

2. **Create Inbound Rule**:
   - Click "Inbound Rules" in left panel
   - Click "New Rule..." in right panel
   - Select "Port" → Next
   - Select "TCP" and enter "8082" → Next
   - Select "Allow the connection" → Next
   - Check all profiles (Domain, Private, Public) → Next
   - Name: "Expo Metro Bundler" → Finish

3. **Restart Metro bundler**:
```bash
npm start
```

4. **Scan QR code** in Expo Go

## Troubleshooting

### Still not connecting?

1. **Verify same WiFi network**:
   - Computer: Connected to WiFi
   - Phone: Must be on SAME WiFi (not cellular data)

2. **Try tunnel mode** (works regardless of network):
```bash
npm start -- --tunnel
```

3. **Check if port 8082 is in use**:
```bash
netstat -ano | findstr :8082
```

4. **Restart both computer and phone**:
   - Sometimes network settings need a refresh

## Backend Connection

After Expo Go connects, you'll also need to update the backend URL in:

**File**: `mobile/shared/api/client.ts` (Line 7)

```typescript
const API_BASE_URL = 'http://10.153.155.63:8000/api/v1';
```

Make sure your backend is running at: `http://0.0.0.0:8000`

## Test Accounts

### Customer:
- Email: `test@example.com`
- Password: `password123`

### Vendor:
- Email: `vendor@example.com`
- Password: `password123`
