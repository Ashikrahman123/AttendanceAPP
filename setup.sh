
#!/bin/bash

echo "Setting up React Native Employee Face Attendance App..."

# Clean install
echo "Cleaning previous installations..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install

# iOS specific setup
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Setting up iOS..."
    cd ios
    pod install
    cd ..
    echo "iOS setup complete!"
fi

# Android specific setup
echo "Setting up Android..."
cd android
./gradlew clean
cd ..

echo "Setup complete!"
echo ""
echo "To run the app:"
echo "For iOS: npm run ios"
echo "For Android: npm run android"
echo ""
echo "Make sure you have:"
echo "- React Native CLI installed: npm install -g react-native-cli"
echo "- Android Studio with SDK 28 or higher"
echo "- Xcode (for iOS development)"
echo "- Node.js 16 or higher"
