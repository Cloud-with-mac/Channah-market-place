# How to Test the Mobile Apps

Complete step-by-step guide to run and test the customer and vendor mobile apps.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** installed (v18 or higher) - Check with `node --version`
- [ ] **npm** installed - Check with `npm --version`
- [ ] **Expo Go app** installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- [ ] **Phone and computer on same Wi-Fi network**
- [ ] **Backend dependencies installed** (`pip install -r requirements.txt`)

## Step 1: Find Your Computer's IP Address

You need your computer's local network IP address (NOT localhost or 127.0.0.1).

### Windows:
```bash
ipconfig
```
Look for **"IPv4 Address"** under your active network adapter (Wi-Fi or Ethernet).
Example: `192.168.1.100`

### Mac:
```bash
ifconfig | grep "inet "
```
Look for an address starting with `192.168.` or `10.`

### Linux:
```bash
ip addr show
```
Look for an address starting with `192.168.` or `10.`

**Write down your IP address - you'll need it!**

## Step 2: Configure Backend Connection

Edit the file: `mobile/shared/api/client.ts`

Find line 7 and replace with YOUR IP address:

```typescript
// BEFORE (line 7):
const API_BASE_URL = 'http://192.168.1.100:8000/api/v1';

// AFTER (use YOUR IP):
const API_BASE_URL = 'http://YOUR_IP_HERE:8000/api/v1';
```

**Example:** If your IP is `192.168.1.50`, use:
```typescript
const API_BASE_URL = 'http://192.168.1.50:8000/api/v1';
```

## Step 3: Start the Backend Server

The backend MUST be running with `--host 0.0.0.0` for mobile access:

```bash
# Navigate to backend folder
cd backend

# Start server (CRITICAL: use --host 0.0.0.0)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Keep this terminal running!**

## Step 4: Verify Backend is Accessible

### Test from your computer:
Open browser and visit: `http://localhost:8000/docs`
✅ You should see FastAPI Swagger documentation

### Test from your phone:
Open browser on your phone and visit: `http://YOUR_IP:8000/docs`
(Replace YOUR_IP with your actual IP address)

✅ **If this works, your mobile apps will work!**
❌ **If this fails, see troubleshooting below**

### Quick test script:
```bash
cd mobile
node test-backend-connection.js
```

This will automatically verify your connection and show any issues.

## Step 5: Install Mobile App Dependencies

Open a **NEW terminal** (keep backend running in the first one).

### For Customer App:
```bash
cd mobile/customer-app
npm install
```

### For Vendor App:
```bash
cd mobile/vendor-app
npm install
```

**This may take a few minutes.**

## Step 6: Start the Mobile App

### Customer App:
```bash
cd mobile/customer-app
npm start
```

### Vendor App:
```bash
cd mobile/vendor-app
npm start
```

**Expected output:**
```
Metro waiting on exp://192.168.1.XXX:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## Step 7: Open App on Your Phone

### Option 1: Scan QR Code

**Android (Expo Go):**
1. Open **Expo Go** app
2. Tap **"Scan QR Code"**
3. Scan the QR code from your terminal

**iOS (Camera):**
1. Open **Camera** app
2. Point at QR code
3. Tap notification to open in Expo Go

### Option 2: Manual Connection

**In Expo Go app:**
1. Go to **"Projects"** tab
2. Tap **"Enter URL manually"**
3. Type: `exp://YOUR_IP:8081`
4. Tap **"Connect"**

## Step 8: Test the Apps

### Customer App Testing

1. **Registration/Login:**
   ```
   Email: test@example.com
   Password: password123
   ```
   Or create a new account

2. **Browse Products:**
   - Tap "Products" tab
   - You should see products from backend
   - Try searching for products
   - Pull down to refresh

3. **Add to Cart:**
   - Tap on a product
   - Add to cart
   - Go to "Cart" tab
   - Update quantities
   - Remove items

4. **Profile:**
   - View your profile
   - Check orders
   - View wishlist

### Vendor App Testing

1. **Login:**
   ```
   Email: vendor@example.com
   Password: password123
   ```

2. **Dashboard:**
   - View your stats
   - Check revenue, orders, products

3. **Products:**
   - Tap "Products" tab
   - View your product list
   - Edit a product
   - Toggle product status
   - Delete a product

4. **Orders:**
   - Tap "Orders" tab
   - Filter by status
   - Update order status
   - Mark orders as processing, shipped, delivered

## Step 9: Monitor Backend Logs

Watch your backend terminal for API calls:

**Expected logs when using the app:**
```
INFO: 192.168.1.XXX:XXXXX - "POST /api/v1/auth/login HTTP/1.1" 200 OK
INFO: 192.168.1.XXX:XXXXX - "GET /api/v1/products?page=1&limit=20 HTTP/1.1" 200 OK
INFO: 192.168.1.XXX:XXXXX - "GET /api/v1/cart HTTP/1.1" 200 OK
```

This confirms the mobile app is communicating with your backend!

## Common Issues & Solutions

### Issue 1: "Network request failed"

**Symptoms:** Can't load data, connection errors

**Solutions:**
1. Verify IP address in `mobile/shared/api/client.ts` matches your computer's IP
2. Ensure backend is running with `--host 0.0.0.0`
3. Check both devices are on same Wi-Fi (not cellular data)
4. Try running: `node mobile/test-backend-connection.js`

### Issue 2: "Unable to connect to Metro"

**Symptoms:** QR code doesn't work, app won't load

**Solutions:**
```bash
# Stop the app (Ctrl+C)
# Clear cache and restart
npm start -- --clear
```

### Issue 3: Phone can't reach `http://YOUR_IP:8000/docs`

**Symptoms:** Browser times out on phone

**Solutions:**

**Windows Firewall:**
1. Open Windows Security
2. Firewall & Network Protection
3. Allow an app through firewall
4. Find Python or add new rule for port 8000
5. Enable for **Private** networks

**Mac Firewall:**
```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If enabled, add Python
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/python3
```

**Router Issues:**
- Disable AP Isolation (isolates devices)
- Don't use Guest Wi-Fi network
- Both devices must be on same subnet

### Issue 4: "401 Unauthorized" errors

**Symptoms:** Login works but can't load data

**Solutions:**
- This actually means connection is working!
- Try logging out and back in
- Check if your test user exists in database
- Create new account if needed

### Issue 5: Products/Cart showing empty

**Symptoms:** App loads but no data

**Solutions:**
1. Check backend has data:
   - Visit `http://localhost:8000/docs`
   - Try GET `/api/v1/products` endpoint
   - Verify products exist

2. Add test data to backend:
   ```bash
   cd backend
   python scripts/seed_data.py  # if you have a seed script
   ```

3. Check backend logs for errors

### Issue 6: App crashes on startup

**Symptoms:** App opens then immediately closes

**Solutions:**
```bash
# Reinstall dependencies
cd mobile/customer-app  # or vendor-app
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start -c
```

## Performance Testing

### Test Responsive Layouts

1. **Different Screen Sizes:**
   - Try on different phones (small, medium, large)
   - Rotate to landscape mode
   - Check all UI elements are visible

2. **Tablet Support:**
   - If you have a tablet, test on it
   - Product grid should adapt

### Test Network Conditions

1. **Slow Connection:**
   - Enable airplane mode briefly
   - Turn it off and see reconnection
   - Check loading states appear

2. **Offline Mode:**
   - Turn off Wi-Fi
   - App should show error messages
   - Turn on Wi-Fi and pull to refresh

## Advanced Testing

### Using React Native Debugger

1. Install React Native Debugger:
   ```bash
   # Windows
   choco install react-native-debugger

   # Mac
   brew install --cask react-native-debugger
   ```

2. In the app, shake your phone
3. Tap "Debug"
4. View console logs and network requests

### Testing on Emulator

**Android Studio Emulator:**
```bash
# Start emulator first, then:
cd mobile/customer-app
npm run android
```

**iOS Simulator (Mac only):**
```bash
cd mobile/customer-app
npm run ios
```

## Creating Test Accounts

### Customer Account:
```bash
# Via backend API or admin panel
Email: test.customer@example.com
Password: password123
Role: customer
```

### Vendor Account:
```bash
# Via backend API or admin panel
Email: test.vendor@example.com
Password: password123
Role: vendor
```

## Quick Test Checklist

### Customer App:
- [ ] Login/Register works
- [ ] Products load from backend
- [ ] Search works
- [ ] Add to cart works
- [ ] Cart updates (quantity, remove)
- [ ] Cart totals calculate correctly
- [ ] Pull to refresh works
- [ ] Navigation works
- [ ] Profile loads

### Vendor App:
- [ ] Login works
- [ ] Dashboard shows stats
- [ ] Products list loads
- [ ] Edit product works
- [ ] Delete product works
- [ ] Toggle status works
- [ ] Orders list loads
- [ ] Filter orders works
- [ ] Update order status works

## Next Steps After Testing

Once everything works:

1. **Test with real data** from your backend
2. **Add more test accounts** with different roles
3. **Test edge cases** (empty cart, no products, etc.)
4. **Test error handling** (wrong password, network off)
5. **Get feedback** from other users

## Need Help?

### Backend not starting:
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Mac/Linux

# Kill the process and restart
```

### Can't find issues:
1. Check all terminals for error messages
2. Look at backend logs
3. Check Metro bundler output
4. View phone console in Expo Go

### Still stuck:
- Review [SETUP-BACKEND-CONNECTION.md](./SETUP-BACKEND-CONNECTION.md)
- Check [BACKEND-API-STATUS.md](./BACKEND-API-STATUS.md)
- Verify backend API is working: `http://localhost:8000/docs`

---

**You're all set!** Follow these steps and your mobile apps should be running and communicating with your backend. Happy testing! 🚀
