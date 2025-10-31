# Build Scripts

## Increment Build Number

This script automatically increments the iOS build number in all three required locations:

1. `app.json` → `expo.ios.buildNumber`
2. `ios/TheNakedPantry/Info.plist` → `CFBundleVersion`
3. `ios/TheNakedPantry.xcodeproj/project.pbxproj` → `CURRENT_PROJECT_VERSION`

### Usage

**Option 1: Manual increment only**
```bash
npm run bump-build
```

This increments the build number but doesn't start a build.

**Option 2: Increment + Build (Recommended)**
```bash
npm run build:ios
```

This automatically:
1. Increments the build number
2. Starts an EAS build for iOS production

### Manual Build (if needed)
```bash
eas build --platform ios --profile production
```

### Important Notes

- **Always use `npm run build:ios` for production builds** - it ensures the build number is incremented
- The script reads the current build number from `app.json` and increments it by 1
- All three files are updated synchronously to prevent mismatches
- Build numbers must always increase for TestFlight uploads

### Troubleshooting

If you get a "bundle version must be higher" error in Transporter:
1. Check the build number in App Store Connect → TestFlight
2. Run `npm run bump-build` until the number is higher
3. Rebuild with `eas build --platform ios --profile production`

### Example Workflow

```bash
# 1. Increment build and start build
npm run build:ios

# 2. Wait for build to complete (~20-30 mins)

# 3. Download .ipa from EAS dashboard

# 4. Upload to TestFlight via Transporter

# 5. Wait for processing (~5-10 mins)

# 6. Test in TestFlight
```
