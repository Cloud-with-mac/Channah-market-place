import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../utils/network';

/**
 * Network status banner component
 * Shows a banner at the top of the screen when offline
 */
export function NetworkStatusBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  // Only show banner if offline or internet not reachable
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {!isConnected
          ? 'No internet connection'
          : 'Internet not reachable'}
      </Text>
      <Text style={styles.subtext}>
        Some features may be unavailable
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
});
