# Mobile HTTPS Configuration Guide

## ⚠️ CRITICAL SECURITY REQUIREMENT

**Current Status:** Mobile apps are configured to use HTTP in development (`.env` file).
**Production Requirement:** HTTPS is MANDATORY for production deployment.

---

## 📋 Prerequisites

1. Valid SSL certificate for your API domain
2. Backend API served over HTTPS
3. Updated `.env` files for mobile apps

---

## 🔧 Configuration Steps

### Step 1: Update Environment Variables

**Customer App:** `mobile/customer-app/.env`
```env
# BEFORE (Development - INSECURE)
EXPO_PUBLIC_API_URL=http://10.39.14.63:8000/api/v1

# AFTER (Production - SECURE)
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

**Vendor App:** `mobile/vendor-app/.env`
```env
# BEFORE (Development - INSECURE)
EXPO_PUBLIC_API_URL=http://10.39.14.63:8000/api/v1

# AFTER (Production - SECURE)
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

### Step 2: SSL Certificate Pinning (Recommended)

Certificate pinning prevents man-in-the-middle attacks by validating the server's SSL certificate.

#### Install Dependencies

```bash
cd mobile/customer-app
npx expo install expo-network

cd ../vendor-app
npx expo install expo-network
```

#### Implementation Example

Create `mobile/customer-app/src/lib/api-config.ts`:

```typescript
import * as Network from 'expo-network'

export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000,

  // Certificate pinning configuration
  certificatePinning: {
    enabled: process.env.NODE_ENV === 'production',
    // Add your certificate's public key hash
    publicKeyHashes: [
      // Example: 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      // Get this from your SSL certificate
    ],
  },
}

// Validate HTTPS in production
if (process.env.NODE_ENV === 'production' && !API_CONFIG.baseURL?.startsWith('https://')) {
  throw new Error('SECURITY ERROR: API must use HTTPS in production')
}
```

#### Get Certificate Hash

```bash
# Method 1: Using OpenSSL
openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64

# Method 2: Using Node.js
node -e "
const https = require('https');
const crypto = require('crypto');
https.get('https://api.yourdomain.com', (res) => {
  const cert = res.socket.getPeerCertificate();
  const pubkey = cert.pubkey;
  const hash = crypto.createHash('sha256').update(pubkey).digest('base64');
  console.log('sha256/' + hash);
});
"
```

---

### Step 3: Network Security Configuration (Android)

Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Production: Only allow HTTPS -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.yourdomain.com</domain>

        <!-- Certificate pinning -->
        <pin-set>
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
            <!-- Add backup pin for certificate rotation -->
            <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
        </pin-set>
    </domain-config>

    <!-- Development only: Allow localhost cleartext -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

Update `android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

### Step 4: iOS App Transport Security

Update `ios/YourApp/Info.plist`:

```xml
<!-- For development only -->
<key>NSAppTransportSecurity</key>
<dict>
    <!-- Remove this entire block for production -->
    <key>NSAllowsLocalNetworking</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>

<!-- For production: Force HTTPS -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

---

## ✅ Verification Checklist

- [ ] Updated `.env` files with HTTPS URLs
- [ ] Obtained SSL certificate for API domain
- [ ] Implemented certificate pinning (recommended)
- [ ] Configured network security (Android)
- [ ] Configured App Transport Security (iOS)
- [ ] Tested API calls work over HTTPS
- [ ] Verified certificate pinning works
- [ ] Removed HTTP fallbacks from production builds

---

## 🔒 Security Best Practices

1. **Never use HTTP in production** - All API traffic must be encrypted
2. **Implement certificate pinning** - Prevents MITM attacks
3. **Keep backup pins** - Allow certificate rotation without app updates
4. **Monitor certificate expiration** - Set up alerts 30 days before expiry
5. **Use strong cipher suites** - Configure backend to use TLS 1.2+
6. **Validate hostnames** - Ensure certificate matches API domain

---

## 🧪 Testing

### Development
```bash
# Use ngrok or similar to test HTTPS locally
ngrok http 8000

# Update .env with ngrok HTTPS URL
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api/v1
```

### Production
```bash
# Test SSL configuration
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com

# Verify certificate chain
curl -v https://api.yourdomain.com/health
```

---

## 📚 References

- [Expo Network Security](https://docs.expo.dev/versions/latest/sdk/network/)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
- [iOS App Transport Security](https://developer.apple.com/documentation/security/preventing_insecure_network_connections)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)

---

## ⚠️ Important Notes

- **HTTP is ONLY acceptable for local development**
- **Production apps MUST use HTTPS**
- **Certificate pinning is HIGHLY recommended for sensitive applications**
- **Keep certificates up to date** - Expired certificates will break the app
- **Test thoroughly before production deployment**
