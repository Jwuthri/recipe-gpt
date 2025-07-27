# 🚀 Recipe GPT - App Store Deployment Guide

## Prerequisites ✅

1. **Apple Developer Account** - Sign up at [developer.apple.com](https://developer.apple.com) ($99/year)
2. **Xcode** - Install latest version from Mac App Store
3. **Mac computer** - Required for iOS builds

## Step 1: Apple Developer Setup

### 1.1 Create Certificates & Provisioning Profiles
```bash
# Open Xcode and sign in with your Apple ID
# Go to Xcode > Preferences > Accounts > Add Apple ID
```

### 1.2 Register App ID (if needed)
- Bundle ID: `com.julienwuthrich.recipegpt` ✅ (already configured)
- App Name: "Recipe GPT" ✅ (already configured)

## Step 2: App Store Connect Setup

### 2.1 Create New App
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in details:
   - **Platform**: iOS
   - **Name**: Recipe GPT
   - **Primary Language**: English
   - **Bundle ID**: com.julienwuthrich.recipegpt
   - **SKU**: recipegpt-ios (or any unique identifier)
   - **User Access**: Full Access

### 2.2 App Information
- **Category**: Food & Drink
- **Subcategory**: Cooking
- **Content Rights**: No, it does not contain, show, or access third-party content

## Step 3: Build Configuration

### 3.1 Update Version Info
Current version: 1.0.0+1 ✅

### 3.2 Release Build
```bash
# Clean and build for release
flutter clean
flutter pub get
flutter build ios --release
```

### 3.3 Archive in Xcode
```bash
# Open iOS project in Xcode
open ios/Runner.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Wait for build to complete
```

## Step 4: Upload to App Store

### 4.1 Xcode Organizer
1. Xcode will open Organizer after archive
2. Select your archive
3. Click "Distribute App"
4. Choose "App Store Connect"
5. Follow the upload wizard

### 4.2 Alternative: Application Loader
```bash
# Install Application Loader or use Transporter app
# Drag .ipa file to upload
```

## Step 5: App Store Metadata

### 5.1 Required Information
- **App Name**: Recipe GPT
- **Subtitle**: AI-Powered Recipe Generation
- **Description**: See description below
- **Keywords**: recipe, cooking, AI, ingredients, food, chef
- **Support URL**: Your website/GitHub
- **Privacy Policy URL**: Required

### 5.2 App Description Template
```
Transform your ingredients into delicious recipes with the power of AI!

🤖 SMART RECIPE GENERATION
Take a photo of your ingredients and let our AI chef create personalized recipes just for you.

🥘 MULTIPLE COOKING STYLES
• Quick & Easy meals
• Healthy & Nutritious options  
• High-Protein recipes
• Vegan & Vegetarian dishes
• And many more!

📱 FEATURES
• Camera ingredient scanning
• Real-time recipe streaming
• Beautiful, easy-to-follow instructions
• Share recipes with friends
• Multiple dietary preferences

✨ PERFECT FOR
• Busy home cooks
• Food enthusiasts
• Health-conscious individuals
• Anyone who loves to experiment in the kitchen

Download Recipe GPT today and never wonder "what to cook" again!
```

### 5.3 Screenshots Required
- **6.7" Display** (iPhone 14 Pro Max): 2-10 screenshots
- **6.5" Display** (iPhone 14 Plus): 2-10 screenshots  
- **5.5" Display** (iPhone 8 Plus): 2-10 screenshots
- **iPad Pro 12.9"**: 2-10 screenshots
- **iPad Pro 11"**: 2-10 screenshots

### 5.4 App Review Information
- **Notes**: "This app uses AI to generate recipes from ingredient photos. Camera permission is required for ingredient scanning."
- **Contact**: Your email
- **Phone**: Your phone number

## Step 6: Submission

### 6.1 Version Release
1. Select "Manually release this version"
2. Add build from Step 4
3. Complete all required metadata
4. Submit for Review

### 6.2 Review Process
- **Timeline**: 24-48 hours (typically)
- **Status**: Track in App Store Connect
- **Common Issues**: Privacy policy, app description clarity

## Step 7: Post-Submission

### 7.1 If Rejected
- Read rejection reasons carefully
- Fix issues and resubmit
- Common fixes: privacy policy, app description, permissions

### 7.2 If Approved
- App goes live automatically (or manually if you chose that option)
- Monitor crash reports and user feedback
- Plan future updates

## Quick Commands Reference

```bash
# Clean project
flutter clean && flutter pub get

# Build for iOS release
flutter build ios --release

# Open in Xcode
open ios/Runner.xcworkspace

# Check Flutter doctor
flutter doctor

# Analyze project
flutter analyze
```

## Troubleshooting

### Common Issues:
1. **Code Signing**: Ensure certificates are properly configured
2. **Provisioning Profile**: Make sure it matches your bundle ID
3. **Build Errors**: Run `flutter doctor` and fix any issues
4. **Archive Failed**: Check Xcode build settings

### Support Resources:
- [Flutter iOS Deployment](https://docs.flutter.dev/deployment/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

---

*Good luck with your app submission! 🚀* 