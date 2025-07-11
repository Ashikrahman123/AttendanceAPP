// Simple face verification for demo purposes
export async function verifyFace(capturedFace: string, storedFace?: string): Promise<boolean> {
  try {
    // For demo purposes, return true if we have a captured face
    return !!capturedFace;
  } catch (error) {
    console.error('Face verification error:', error);
    return false;
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