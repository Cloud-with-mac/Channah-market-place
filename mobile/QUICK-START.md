# 🚀 Quick Start Guide - Channah Mobile Apps

Get your mobile apps running in 5 minutes!

## ⚡ Quick Setup (3 Steps)

### Step 1: Update API URL

Open `mobile/shared/api/client.ts` and update line 9:

```typescript
// REPLACE THIS with your computer's IP address
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8000/api/v1';
// Example: 'http://192.168.1.100:8000/api/v1'
```

**Find your IP:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Look for **IPv4 Address** (e.g., 192.168.1.100)

### Step 2: Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ You should see: `Application startup complete`

### Step 3: Install & Run Mobile App

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

Scan the QR code with Expo Go app on your phone!

## 📱 Download Expo Go

- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## ✅ Testing the Apps

### Customer App Test
1. Tap "Sign up" on login screen
2. Enter details and create account
3. Browse products
4. Add items to cart
5. View profile

### Vendor App Test
1. Login with vendor credentials
2. View dashboard stats
3. Navigate to Products tab
4. Navigate to Orders tab

## 🐛 Common Issues

### "Network request failed"
- ✅ Check backend is running on `0.0.0.0:8000`
- ✅ Verify IP address in `client.ts` is correct
- ✅ Phone and computer on same Wi-Fi

### "Cannot connect to Metro"
```bash
npm start -- --clear
```

### "Module not found"
```bash
npm install
npm start
```

## 🎯 What's Included

### ✅ Customer App
- Login/Register
- Product browsing
- Shopping cart
- Wishlist
- Profile management

### ✅ Vendor App
- Vendor login
- Dashboard with stats
- Product management (coming soon)
- Order management (coming soon)

### ✅ Shared Features
- Secure authentication
- Token management
- API integration
- Error handling

## 📝 Next Steps

1. **Connect to real data** - Start backend and see live products
2. **Test authentication** - Create account and login
3. **Build features** - Add more screens as needed
4. **Customize UI** - Update colors and branding
5. **Add push notifications** - Enable order updates

## 🔗 Useful Links

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

## 💡 Tips

- Use `console.log()` to debug
- Check terminal for errors
- Reload app with `Cmd+R` (iOS) or `Cmd+M` (Android)
- Use `expo start --clear` to clear cache

---

**Need help?** Check the full README.md in the mobile directory!
