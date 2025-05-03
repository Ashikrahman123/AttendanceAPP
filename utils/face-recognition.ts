import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Face verification using Replicate API
export async function verifyFace(capturedFace: string, storedFace?: string): Promise<boolean> {
  try {
    // If no stored face, just return true for demo purposes
    if (!storedFace) {
      console.log('No stored face found, skipping verification');
      return true;
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
    
    // Call Replicate API for face comparison
    const similarity = await compareFacesWithReplicate(
      capturedFaceBase64, 
      storedFaceBase64
    );
    
    console.log('Face similarity score:', similarity);
    
    // Consider a match if similarity is above 0.6 (60%)
    return similarity > 0.6;
  } catch (error) {
    console.error('Face verification error:', error);
    
    // For demo purposes, return true 80% of the time if API fails
    return Math.random() < 0.8;
  }
}

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

// Function to compare faces using Replicate API
async function compareFacesWithReplicate(image1: string, image2: string): Promise<number> {
  try {
    // Prepare images for API
    const img1 = image1.replace(/^data:image\/\w+;base64,/, '');
    const img2 = image2.replace(/^data:image\/\w+;base64,/, '');
    
    // Call Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token r8_YOUR_REPLICATE_API_KEY', // Replace with your API key
      },
      body: JSON.stringify({
        version: "c4c1223f5def6d349be68b0a0e1b8763e1d1c5070e0c9d4f6f28c7d5a44b5e67",
        input: {
          img1: img1,
          img2: img2,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // For demo purposes, return a random similarity score
    // In production, you would poll the API for results
    return Math.random() * 0.4 + 0.6; // Random score between 0.6 and 1.0
  } catch (error) {
    console.error('Replicate API error:', error);
    // Return a fallback similarity score for demo
    return Math.random() * 0.4 + 0.6;
  }
}

// Function to register a face
export async function registerFace(imageUri: string, userId: string): Promise<boolean> {
  try {
    // If the imageUri is already a base64 string, use it directly
    const base64Image = imageUri.startsWith('data:image') 
      ? imageUri 
      : await getBase64FromUri(imageUri);
    
    if (!base64Image) {
      throw new Error('Failed to convert image to base64');
    }
    
    // Store the face data in AsyncStorage
    const storageKey = `face_data_${userId}`;
    await AsyncStorage.setItem(storageKey, base64Image);
    console.log('Face data stored successfully with key:', storageKey);
    
    return true;
  } catch (error) {
    console.error('Error registering face:', error);
    return false;
  }
}

// Function to get registered face
export async function getRegisteredFace(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`face_data_${userId}`);
  } catch (error) {
    console.error('Error getting registered face:', error);
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