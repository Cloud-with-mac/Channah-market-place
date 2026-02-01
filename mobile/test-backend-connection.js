#!/usr/bin/env node

/**
 * Backend Connection Test Script
 * Run this to verify your mobile apps can reach the backend server
 */

const axios = require('axios');
const os = require('os');

// CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
const YOUR_IP = '192.168.1.100';
const BACKEND_URL = `http://${YOUR_IP}:8000`;

console.log('\n=== Backend Connection Test ===\n');

// Function to get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }

  return addresses;
}

// Display local IP addresses
console.log('Your computer\'s IP addresses:');
const localIPs = getLocalIPs();
localIPs.forEach(({ name, address }) => {
  console.log(`  ${name}: ${address}`);
});
console.log('');

if (!localIPs.some(ip => ip.address === YOUR_IP)) {
  console.log(`⚠️  WARNING: ${YOUR_IP} doesn't match any of your IP addresses`);
  console.log(`   Please update YOUR_IP in this file or mobile/shared/api/client.ts\n`);
}

// Test backend connection
async function testConnection() {
  console.log(`Testing connection to: ${BACKEND_URL}\n`);

  // Test 1: Backend reachable
  console.log('Test 1: Can reach backend server...');
  try {
    const start = Date.now();
    const response = await axios.get(`${BACKEND_URL}/docs`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    const time = Date.now() - start;

    if (response.status === 200) {
      console.log(`✅ SUCCESS - Backend is reachable (${time}ms)`);
    } else {
      console.log(`⚠️  Backend responded with status ${response.status} (${time}ms)`);
    }
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution:');
      console.log('   1. Make sure backend is running');
      console.log('   2. Start it with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000');
      console.log('   3. The --host 0.0.0.0 flag is required!\n');
      return;
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log('\n💡 Solution:');
      console.log('   1. Check if backend is running');
      console.log('   2. Verify IP address is correct');
      console.log('   3. Check firewall settings\n');
      return;
    }
  }

  // Test 2: API endpoint
  console.log('\nTest 2: Can reach API endpoint...');
  try {
    const start = Date.now();
    const response = await axios.get(`${BACKEND_URL}/api/v1/products`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    const time = Date.now() - start;

    if (response.status === 200) {
      console.log(`✅ SUCCESS - API endpoint works (${time}ms)`);
      console.log(`   Received ${response.data.results?.length || 0} products`);
    } else if (response.status === 401) {
      console.log(`✅ SUCCESS - API endpoint reachable (${time}ms)`);
      console.log('   (401 is expected for unauthenticated requests)');
    } else {
      console.log(`⚠️  API responded with status ${response.status} (${time}ms)`);
    }
  } catch (error) {
    console.log(`❌ FAILED - ${error.message}`);
  }

  // Final summary
  console.log('\n=== Summary ===\n');
  console.log('If all tests passed:');
  console.log(`  ✅ Update mobile/shared/api/client.ts with: ${BACKEND_URL}/api/v1`);
  console.log('  ✅ Your mobile apps should be able to connect!');
  console.log('');
  console.log('If tests failed:');
  console.log('  1. Ensure backend is running with --host 0.0.0.0');
  console.log('  2. Verify your IP address matches');
  console.log('  3. Check Windows Firewall / Mac Firewall settings');
  console.log('  4. Ensure mobile device is on same Wi-Fi network');
  console.log('');
  console.log('See SETUP-BACKEND-CONNECTION.md for detailed troubleshooting\n');
}

testConnection();
