
import { FaceSDK, Enum } from '@regulaforensics/react-native-face-api';

let isSDKInitialized = false;

export const initializeFaceSDK = async (): Promise<boolean> => {
  if (isSDKInitialized) {
    return true;
  }

  try {
    const config = {
      license: "", // Add your license key here if you have one
      licenseUpdate: false,
    };

    return new Promise((resolve, reject) => {
      FaceSDK.init(config, (response) => {
        if (response.success) {
          console.log("Face SDK initialized successfully");
          isSDKInitialized = true;
          resolve(true);
        } else {
          console.error("Face SDK initialization failed:", response.error);
          reject(new Error(response.error?.message || "SDK initialization failed"));
        }
      }, (error) => {
        console.error("Face SDK initialization error:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error initializing Face SDK:", error);
    throw error;
  }
};

export const captureFaceImage = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    FaceSDK.presentFaceCaptureActivity({
      cameraPosition: Enum.CameraPosition.FRONT,
      timeout: 10000,
    }, (response) => {
      if (response.image) {
        resolve(`data:image/jpeg;base64,${response.image}`);
      } else {
        reject(new Error("No image captured"));
      }
    }, (error) => {
      reject(error);
    });
  });
};

export const compareFaceImages = (image1Base64: string, image2Base64: string): Promise<{ similarity: number; isMatch: boolean }> => {
  return new Promise((resolve, reject) => {
    const matchRequest = {
      images: [
        {
          imageType: Enum.ImageType.PRINTED,
          image: image1Base64,
        },
        {
          imageType: Enum.ImageType.PRINTED,
          image: image2Base64,
        }
      ]
    };

    FaceSDK.matchFaces(JSON.stringify(matchRequest), (response) => {
      if (response.results && response.results.length > 0) {
        const matchResult = response.results[0];
        const similarity = matchResult.similarity;
        const isMatch = similarity > 0.75; // 75% threshold
        
        resolve({ similarity, isMatch });
      } else {
        reject(new Error("No faces detected for comparison"));
      }
    }, (error) => {
      reject(error);
    });
  });
};

export const detectFaceInImage = (imageBase64: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    FaceSDK.detectFaces({
      image: imageBase64,
    }, (response) => {
      if (response.results && response.results.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    }, (error) => {
      reject(error);
    });
  });
};

export const isSDKReady = (): boolean => {
  return isSDKInitialized;
};
