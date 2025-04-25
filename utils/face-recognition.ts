import { Platform } from 'react-native';

// This is a mock face recognition service
// In a real app, you would use a proper face recognition library

export async function detectFace(imageUri: string): Promise<boolean> {
  // Simulate face detection with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // 90% chance of success for demo purposes
      const success = Math.random() < 0.9;
      resolve(success);
    }, 1500);
  });
}

export async function compareFaces(faceData1: string, faceData2: string): Promise<boolean> {
  // Simulate face comparison with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // 85% chance of success for demo purposes
      const success = Math.random() < 0.85;
      resolve(success);
    }, 1500);
  });
}

export async function verifyFace(capturedFace: string, storedFace?: string): Promise<boolean> {
  // If no stored face, just detect a face
  if (!storedFace) {
    return detectFace(capturedFace);
  }
  
  // Otherwise compare with stored face
  return compareFaces(capturedFace, storedFace);
}