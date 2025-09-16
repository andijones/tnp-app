# Blur Header Troubleshooting Guide

## Common Errors & Fixes

### 1. **"Cannot resolve module 'expo-blur'"**
**Fix:** Ensure expo-blur is installed:
```bash
npm install expo-blur
npx expo install --fix
```

### 2. **"BlurView is not defined"**
**Fix:** Check imports in affected files:
```tsx
import { BlurView } from 'expo-blur';
```

### 3. **"StyleSheet is not defined"**
**Fix:** Add StyleSheet to React Native imports:
```tsx
import { View, StyleSheet } from 'react-native';
```

### 4. **Component import errors**
**Fix:** Verify file paths in imports:
```tsx
// Make sure these paths are correct
import { BlurHeader } from '../../components/common/BlurHeader';
import { GreenBlurHeader } from '../../components/common/GreenBlurHeader';
```

### 5. **Metro bundler cache issues**
**Fix:** Clear cache and restart:
```bash
npx expo start --clear
```

### 6. **iOS Simulator Issues**
**Fix:** Reset iOS simulator:
- iOS Simulator → Device → Erase All Content and Settings

### 7. **Android Build Issues**
**Fix:** Clean and rebuild:
```bash
cd android && ./gradlew clean && cd ..
npx expo run:android
```

## Quick Debug Steps

1. **Check Terminal/Console** for specific error messages
2. **Clear Metro cache**: `npx expo start --clear`
3. **Restart development server**
4. **Check if all new files exist** in correct directories
5. **Verify all imports** are correct

## If You See TypeScript Errors
Add to your `metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('tsx', 'ts');
module.exports = config;
```

Please share the specific error message for targeted assistance!