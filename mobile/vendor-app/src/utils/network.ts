import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Hook to monitor network connectivity status
 * @returns {boolean} isConnected - true if device has internet connection
 * @returns {boolean} isInternetReachable - true if internet is actually reachable (not just connected to wifi)
 * @returns {string} type - connection type (wifi, cellular, none, etc.)
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [type, setType] = useState<string>('unknown');

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
      setType(state.type);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
      setType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isConnected, isInternetReachable, type };
}

/**
 * Check if device is currently connected to the internet
 * @returns {Promise<boolean>} true if connected, false otherwise
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  } catch (error) {
    console.error('Error checking network connection:', error);
    return false; // Assume offline if check fails
  }
}

/**
 * Error class for network-related errors
 */
export class NetworkError extends Error {
  constructor(message: string = 'No internet connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Execute a function only if network is available
 * @param fn Function to execute
 * @param options Optional configuration
 * @returns Result of function execution
 * @throws {NetworkError} if offline
 */
export async function executeIfOnline<T>(
  fn: () => Promise<T>,
  options: {
    throwIfOffline?: boolean;
    fallbackValue?: T;
  } = {}
): Promise<T> {
  const { throwIfOffline = true, fallbackValue } = options;

  const isOnline = await checkNetworkConnection();

  if (!isOnline) {
    if (throwIfOffline) {
      throw new NetworkError('Cannot perform this action while offline');
    }
    return fallbackValue as T;
  }

  return await fn();
}
