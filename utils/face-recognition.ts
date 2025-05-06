import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBaseUrl } from '@/context/BaseUrlContext';

// Helper function to get base64 from image URI
async function getBase64FromUri(uri: string): Promise<string | null> {
  // If already a base64 string, return it
  if (uri.startsWith('data:image')) {
    return uri;
  }

  try {
    // For web, we can't easily convert URI to base64
    if (Platform.OS === 'web') {
      return uri;
    }

    // For native platforms, use FileSystem
    const FileSystem = require('expo-file-system');

    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

// Simple face verification
export async function verifyFace(capturedFace: string, storedFace?: string): Promise<boolean> {
  try {
    // If no stored face, return false
    if (!storedFace) {
      console.log('No stored face found');
      return false;
    }
    
    // Get base64 data from image URIs
    const capturedFaceBase64 = await getBase64FromUri(capturedFace);
    const storedFaceBase64 = storedFace.startsWith('data:') 
      ? storedFace 
      : await getBase64FromUri(storedFace);
    
    if (!capturedFaceBase64 || !storedFaceBase64) {
      console.error('Failed to get base64 data from images');
      return false;
    }
    
    // For now, just return true if we have both images
    return true;
  } catch (error) {
    console.error('Face verification error:', error);
    return false;
  }
}


// Function to register a face
export async function registerFace(imageUri: string, contactRecordId: string): Promise<boolean> {
  try {
    console.log('[Face Registration] Starting face registration process');
    console.log('[Face Registration] Image URI:', imageUri?.substring(0, 50) + '...');
    console.log('[Face Registration] Contact Record ID:', contactRecordId);

    // Convert image to base64
    const base64Image = await getBase64FromUri(imageUri);
    if (!base64Image) {
      throw new Error('Failed to convert image to base64');
    }

    // Get required data from AsyncStorage
    const [orgId, modifyUser, bearerToken] = await Promise.all([
      AsyncStorage.getItem('orgId'),
      AsyncStorage.getItem('userId'),
      AsyncStorage.getItem('bearerToken')
    ]);

    console.log('[Face Registration] Retrieved data:', {
      orgId,
      contactRecordId,
      modifyUser,
      tokenExists: !!bearerToken
    });

    if (!orgId || !contactRecordId || !modifyUser || !bearerToken) {
      throw new Error('Required data missing from storage');
    }

    // Get base URL from storage
    const baseUrl = await AsyncStorage.getItem('baseUrl');
    if (!baseUrl) {
      throw new Error('Base URL not configured');
    }

    // Prepare request body
    const requestBody = {
      DetailData: {
        orgId: parseInt(orgId),
        ContactRecordId: parseInt(contactRecordId),
        Image: base64Image,
        ModifyUser: parseInt(modifyUser)
      },
      BearerTokenValue: bearerToken
    };

    console.log('[Face Registration] Making API request to:', baseUrl + 'MiddleWare/Employee_Attendance_Face_Register');

    // Make API request
    const response = await fetch(baseUrl + 'MiddleWare/Employee_Attendance_Face_Register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('[Face Registration] API Response:', data);

    if (!data.success) {
      throw new Error(data.message || 'Face registration failed');
    }

    // Store the face data in AsyncStorage
    const storageKey = `face_data_${contactRecordId}`;
    await AsyncStorage.setItem(storageKey, base64Image);
    console.log('[Face Registration] Face data stored successfully with key:', storageKey);

    return true;
  } catch (error) {
    console.error('[Face Registration] Error registering face:', error);
    return false;
  }
}

// Function to get registered face
export async function getRegisteredFace(userId: string): Promise<string | null> {
  try {
    console.log('[Face Retrieval] Getting registered face for user:', userId);
    const faceData = await AsyncStorage.getItem(`face_data_${userId}`);
    console.log('[Face Retrieval] Face data found:', !!faceData);
    return faceData;
  } catch (error) {
    console.error('[Face Retrieval] Error getting registered face:', error);
    return null;
  }
}



// Function to detect if an image contains a face
export async function detectFace(imageUri: string): Promise<boolean> {
  try {
    // For demo purposes, return true 90% of the time
    return Math.random() < 0.9;
  } catch (error) {
    console.error('Face detection error:', error);
    return false;
  }
}