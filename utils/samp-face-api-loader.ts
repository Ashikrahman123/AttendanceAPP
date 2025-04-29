// import * as faceapi from 'face-api.js';
// import { Platform } from 'react-native';

// // Path to models - use CDN for web
// const MODEL_URL = Platform.OS === 'web'
//   ? 'https://justadudewhohacks.github.io/face-api.js/models'
//   : 'https://justadudewhohacks.github.io/face-api.js/models';

// // Initialize face-api.js
// export async function initFaceApi() {
//   // For web, we need to set up the environment
//   if (Platform.OS === 'web') {
//     // @ts-ignore - faceapi expects to be in a browser environment
//     faceapi.env.monkeyPatch({
//       Canvas: HTMLCanvasElement,
//       Image: HTMLImageElement,
//       ImageData: ImageData,
//       Video: HTMLVideoElement,
//       createCanvasElement: () => document.createElement('canvas'),
//       createImageElement: () => document.createElement('img')
//     });
//   }
// }

// // Load required models
// export async function loadModels() {
//   try {
//     console.log('Loading face-api.js models...');

//     // Load models sequentially to avoid memory issues
//     await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
//     console.log('SSD MobileNet model loaded');

//     await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
//     console.log('Face Landmark model loaded');

//     await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
//     console.log('Face Recognition model loaded');

//     console.log('All models loaded successfully');
//     return true;
//   } catch (error) {
//     console.error('Error loading face-api.js models:', error);
//     return false;
//   }
// }