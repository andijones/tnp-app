#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File paths
const APP_JSON = path.join(__dirname, '../app.json');
const INFO_PLIST = path.join(__dirname, '../ios/TheNakedPantry/Info.plist');
const PROJECT_PBXPROJ = path.join(__dirname, '../ios/TheNakedPantry.xcodeproj/project.pbxproj');

console.log('📱 Incrementing iOS build number...\n');

try {
  // 1. Read and increment app.json
  const appJson = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  const currentBuild = parseInt(appJson.expo.ios.buildNumber);
  const newBuild = currentBuild + 1;

  console.log(`Current build number: ${currentBuild}`);
  console.log(`New build number: ${newBuild}\n`);

  // 2. Update app.json
  appJson.expo.ios.buildNumber = newBuild.toString();
  fs.writeFileSync(APP_JSON, JSON.stringify(appJson, null, 2) + '\n');
  console.log('✓ Updated app.json');

  // 3. Update Info.plist
  let infoPlist = fs.readFileSync(INFO_PLIST, 'utf8');
  infoPlist = infoPlist.replace(
    /<key>CFBundleVersion<\/key>\s*<string>\d+<\/string>/,
    `<key>CFBundleVersion</key>\n    <string>${newBuild}</string>`
  );
  fs.writeFileSync(INFO_PLIST, infoPlist);
  console.log('✓ Updated Info.plist');

  // 4. Update project.pbxproj
  let projectPbxproj = fs.readFileSync(PROJECT_PBXPROJ, 'utf8');
  projectPbxproj = projectPbxproj.replace(
    /CURRENT_PROJECT_VERSION = \d+;/g,
    `CURRENT_PROJECT_VERSION = ${newBuild};`
  );
  fs.writeFileSync(PROJECT_PBXPROJ, projectPbxproj);
  console.log('✓ Updated project.pbxproj');

  console.log(`\n✅ Build number successfully incremented to ${newBuild}!`);
  console.log('\nNext steps:');
  console.log('  1. Run: eas build --platform ios --profile production');
  console.log('  2. Wait for build to complete');
  console.log('  3. Upload .ipa to TestFlight\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
