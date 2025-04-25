import * as Location from 'expo-location';
import { Platform } from 'react-native';

export async function getCurrentLocation() {
  if (Platform.OS === 'web') {
    return {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
      }
    };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }
    
    const location = await Location.getCurrentPositionAsync({});
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    // Return mock location as fallback
    return {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
      }
    };
  }
}

export async function getAddressFromCoordinates(latitude: number, longitude: number) {
  if (Platform.OS === 'web') {
    return '123 Work Street, San Francisco, CA';
  }

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return `${address.street || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting address:', error);
    return '123 Work Street, San Francisco, CA'; // Fallback address
  }
}