# Channah Marketplace - Mobile Apps

React Native mobile applications for Channah Marketplace (iOS & Android).

## 📱 Apps Included

- **Customer App** (`/customer-app`) - Shopping app for customers
- **Vendor App** (`/vendor-app`) - Store management app for vendors
- **Shared** (`/shared`) - Shared API clients and utilities

## 🚀 Quick Start

### ⚠️ CRITICAL FIRST STEP: Backend Connection Setup

**The mobile apps MUST connect to your backend server.** See [SETUP-BACKEND-CONNECTION.md](./SETUP-BACKEND-CONNECTION.md) for detailed instructions.

**Quick test:** Run the connection test script:
```bash
cd mobile
node test-backend-connection.js
```

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Expo CLI**: `npm install -g expo-cli`
3. **Expo Go App** on your mobile device ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
4. **Backend Running** on your local machine
5. **Same Wi-Fi Network** - Your phone and computer MUST be on the same Wi-Fi

### Step 1: Configure Backend URL

**IMPORTANT**: Update the API URL in `shared/api/client.ts` (line 7):

```typescript
// Replace with your computer's LOCAL IP ADDRESS
const API_BASE_URL = 'http://YOUR_IP_HERE:8000/api/v1';
// Example: 'http://192.168.1.100:8000/api/v1'
```

**Find your IP address:**
- **Windows**: Run `ipconfig`, look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig`, look for "inet" address

**❌ Do NOT use `localhost` or `127.0.0.1`** - your phone needs your computer's actual network IP!

### Step 2: Start Backend Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**CRITICAL:** The `--host 0.0.0.0` flag is REQUIRED for mobile access!

**Verify it's working:** Open `http://YOUR_IP:8000/docs` in your phone's browser. You should see the FastAPI documentation.

### Step 3: Install Dependencies

```bash
# Customer App
cd mobile/customer-app
npm install

# Vendor App
cd ../vendor-app
npm install
```

### Step 4: Start the Apps

**Customer App:**
```bash
cd mobile/customer-app
npm start
```

**Vendor App:**
```bash
cd mobile/vendor-app
npm start
```

### Step 5: Run on Your Device

1. Open **Expo Go** app on your phone
2. Scan the QR code from terminal
3. App will load on your device

## 📋 Features

### Customer App Features

#### ✅ Authentication
- [x] Login with email/password
- [x] Register new account
- [x] Auto-login with secure token storage
- [ ] Password reset

#### ✅ Shopping
- [x] Browse products with pagination
- [x] View product details
- [x] Search products
- [x] Filter by category, price, rating
- [x] Add to cart
- [x] Add to wishlist

#### ✅ Cart & Checkout
- [x] View cart items
- [x] Update quantities
- [x] Apply coupon codes
- [x] Remove items
- [x] Checkout process
- [x] Address management

#### ✅ Orders
- [x] View order history
- [x] Track orders
- [x] Order details
- [x] Cancel pending orders

#### ✅ Profile
- [x] View/edit profile
- [x] Manage addresses
- [x] Order history
- [x] Wishlist
- [x] Logout

#### 🔔 Notifications
- [x] Push notification setup
- [x] Order status updates
- [x] Promotional notifications

### Vendor App Features

#### ✅ Dashboard
- [x] Sales overview
- [x] Revenue charts
- [x] Top selling products
- [x] Recent orders
- [x] Key metrics

#### ✅ Product Management
- [x] List all products
- [x] Add new product
- [x] Edit product
- [x] Delete product
- [x] Update inventory
- [x] Product status toggle

#### ✅ Order Management
- [x] View orders
- [x] Order details
- [x] Update order status
- [x] Add tracking information
- [x] Filter by status

#### ✅ Analytics
- [x] Sales analytics (30d, 60d, 90d)
- [x] Customer insights
- [x] Revenue trends

#### ✅ Payouts
- [x] View balance
- [x] Payout history
- [x] Request payout

#### ✅ Settings
- [x] Profile management
- [x] Payment settings
- [x] Notification preferences

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **API Client**: Axios
- **Storage**: Expo SecureStore
- **Notifications**: Expo Notifications
- **Language**: TypeScript

## 📂 Project Structure

```
mobile/
├── customer-app/
│   ├── App.tsx                    # Main app entry
│   ├── app.json                   # Expo config
│   ├── package.json
│   └── src/
│       ├── screens/
│       │   ├── auth/              # Login, Register
│       │   └── main/              # Home, Products, Cart, Profile
│       ├── components/            # Reusable components
│       ├── store/                 # Zustand stores
│       └── types/                 # TypeScript types
│
├── vendor-app/
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   └── src/
│       ├── screens/
│       │   ├── auth/              # Login
│       │   └── main/              # Dashboard, Products, Orders
│       ├── components/
│       ├── store/
│       └── types/
│
└── shared/
    └── api/
        ├── client.ts              # Base API client
        ├── customer-api.ts        # Customer endpoints
        └── vendor-api.ts          # Vendor endpoints
```

## 🔐 Authentication

Both apps use **JWT tokens** stored securely in **Expo SecureStore**:

- Access tokens for API requests
- Refresh tokens for automatic renewal
- Auto-logout on token expiration

## 📱 Testing

### Test Accounts

**Customer:**
- Email: customer@test.com
- Password: customer123

**Vendor:**
- Email: vendor@test.com
- Password: vendor123

### Creating Test Data

Run this in your backend:
```bash
cd backend
python scripts/seed_test_data.py
```

## 🐛 Troubleshooting

### "Network request failed"
- ✅ Ensure backend is running with `--host 0.0.0.0`
- ✅ Check that API_BASE_URL uses your computer's IP (not localhost)
- ✅ Verify phone and computer are on same Wi-Fi network
- ✅ Disable VPN on your computer

### "Cannot connect to Metro"
- ✅ Run `expo start -c` to clear cache
- ✅ Restart Expo Go app
- ✅ Check firewall settings

### Images not loading
- ✅ Image URLs from backend need to be absolute URLs
- ✅ Or serve images from backend with correct CORS headers

### Push notifications not working
- ✅ Run on physical device (not simulator)
- ✅ Grant notification permissions
- ✅ Register device token with backend

## 🚢 Building for Production

### Android APK
```bash
cd customer-app  # or vendor-app
expo build:android
```

### iOS IPA
```bash
cd customer-app  # or vendor-app
expo build:ios
```

### Publishing Updates
```bash
expo publish
```

## 📝 Development Notes

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add route to `App.tsx` navigator
3. Import screen in navigation

### Adding API Endpoints

1. Add method to appropriate API file in `/shared/api/`
2. Use in screen with try/catch error handling
3. Show loading states during requests

### State Management

Using Zustand for lightweight state:
```typescript
import { create } from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
}));
```

## 🔄 API Integration

All API calls go through the shared API client with:
- Automatic authentication headers
- Token refresh on 401
- Error handling
- Type safety with TypeScript

Example:
```typescript
import { productsAPI } from '../../shared/api/customer-api';

const products = await productsAPI.getAll({ limit: 20 });
```

## 📞 Support

For issues or questions:
1. Check this README
2. Review error logs in Expo console
3. Check backend logs
4. Verify network connectivity

## 🎨 Customization

### Colors
Update theme colors in each app's navigation config and styles.

### App Name & Icon
1. Update `app.json` name
2. Replace `assets/icon.png`
3. Replace `assets/splash.png`

### Bundle Identifier
Update in `app.json`:
- iOS: `ios.bundleIdentifier`
- Android: `android.package`

## ✅ Next Steps

1. ✅ Configure backend URL
2. ✅ Start backend server
3. ✅ Install dependencies
4. ✅ Run customer app
5. ✅ Run vendor app
6. ✅ Test core features
7. 📸 Add product images
8. 🔔 Test push notifications
9. 🚀 Build and publish

---

**Happy coding! 🎉**
