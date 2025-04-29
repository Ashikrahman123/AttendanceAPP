// Create new file: utils/face-storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeFaceData = async (userId: string, base64Data: string) => {
  await AsyncStorage.setItem(`userFace-${userId}`, base64Data);
};

export const getFaceData = async (userId: string) => {
  return AsyncStorage.getItem(`userFace-${userId}`);
};