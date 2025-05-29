
# Employee Face Attendance App - React Native

A React Native application for employee attendance management using face recognition technology.

## Features

- Face comparison and verification
- Employee management
- Attendance tracking
- Cross-platform support (iOS & Android)

## Prerequisites

Before running this app, make sure you have the following installed:

- Node.js (version 16 or higher)
- React Native CLI: `npm install -g react-native-cli`
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)
- CocoaPods (for iOS): `sudo gem install cocoapods`

## Installation

1. **Extract the project files**
   ```bash
   unzip EmployeeFaceAttendanceApp.zip
   cd EmployeeFaceAttendanceApp
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   Or install manually:
   ```bash
   npm install
   
   # For iOS only (macOS required)
   cd ios && pod install && cd ..
   ```

## Running the App

### Android
1. Start an Android emulator or connect a physical device
2. Run: `npm run android`

### iOS (macOS only)
1. Start an iOS simulator or connect a physical device
2. Run: `npm run ios`

## Development

### Start Metro bundler
```bash
npm start
```

### Debug
- For Android: Shake device or press Ctrl+M (Cmd+M on macOS)
- For iOS: Shake device or press Cmd+D

## Project Structure

```
├── App.tsx                 # Main app component
├── screens/               # Screen components
├── navigation/            # Navigation configuration
├── components/            # Reusable UI components
├── store/                # State management (Zustand)
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── context/              # React context providers
├── constants/            # App constants
├── types/                # TypeScript type definitions
├── android/              # Android specific files
└── ios/                  # iOS specific files
```

## Key Dependencies

- **React Native**: Core framework
- **@react-navigation**: Navigation library
- **react-native-camera**: Camera functionality
- **react-native-image-picker**: Image selection
- **react-native-vector-icons**: Icon library
- **zustand**: State management
- **@regulaforensics/react-native-face-api**: Face recognition

## Configuration

### Face Recognition
The app uses Regula Face SDK for face recognition. Configure the SDK in `utils/faceSDK.ts`.

### API Configuration
Set your server URL in the BaseUrl screen when first launching the app.

## Troubleshooting

### Android Issues
- **Build fails**: Make sure Android SDK is properly installed and ANDROID_HOME is set
- **Metro bundler issues**: Run `npx react-native start --reset-cache`

### iOS Issues
- **Pod install fails**: Run `cd ios && pod deintegrate && pod install`
- **Build fails**: Clean build folder in Xcode (Cmd+Shift+K)

### General Issues
- **Node modules issues**: Delete node_modules and run `npm install`
- **Cache issues**: Run `npx react-native start --reset-cache`

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
1. Open `ios/EmployeeFaceAttendanceApp.xcworkspace` in Xcode
2. Select "Any iOS Device" or your connected device
3. Product → Archive

## License

This project is proprietary. All rights reserved.
