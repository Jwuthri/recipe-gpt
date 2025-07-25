# Recipe GPT 🍳

An AI-powered React Native app that analyzes photos of your fridge/pantry and generates delicious recipes based on the ingredients found.

## Features

- 📸 **Multi-Photo Analysis**: Take 1-3 photos of your fridge or pantry
- 🤖 **AI Detection**: Automatically detect ingredients and quantities using Google Gemini Flash 2.5
- ✏️ **Manual Editing**: Edit detected ingredients or add additional ones
- 🧑‍🍳 **Real-time Recipe Generation**: Watch recipes being created in real-time using GPT-4.1-mini
- 📱 **Cross-Platform**: Works on both iOS and Android
- 🎨 **Beautiful UI**: Clean, modern interface with Material Design

## Screenshots

*Screenshots will be added once the app is running*

## Prerequisites

- Node.js (v16 or higher)
- React Native development environment
- iOS: Xcode 12+, iOS Simulator
- Android: Android Studio, Android SDK
- OpenAI API key (for recipe generation)
- Google Gemini API key (for image analysis)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Open `src/services/AIService.js`
4. Replace the placeholder API keys with your actual keys:

```javascript
const OPENAI_API_KEY = 'sk-your-actual-openai-api-key-here';
const GEMINI_API_KEY = 'your-actual-gemini-api-key-here';
```

### 3. iOS Setup

```bash
cd ios && pod install && cd ..
```

### 4. Android Setup

Make sure you have Android Studio installed and configured.

## Running the App

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

## App Flow

1. **Camera Screen**: Take 1-3 photos of your fridge, pantry, or ingredients
2. **Ingredients Screen**: Review and edit detected ingredients
3. **Add Ingredients Screen**: Add any additional ingredients manually
4. **Recipe Screen**: View your AI-generated recipe with step-by-step instructions

## Key Technologies

- **React Native**: Cross-platform mobile development
- **React Navigation**: Screen navigation
- **React Native Paper**: Material Design components
- **OpenAI GPT-4**: Recipe generation
- **Google Gemini Flash 2.5**: Image analysis for ingredient detection
- **React Native Image Picker**: Camera and gallery access
- **React Native Markdown Display**: Recipe formatting

## API Configuration

The app uses two AI services:

1. **Image Analysis** (Google Gemini Flash 2.5): Analyzes photos to detect ingredients and quantities
2. **Recipe Generation** (OpenAI GPT-4.1-mini): Creates recipes in real-time with streaming responses

### Supported Models

- **Gemini**: Uses `gemini-2.0-flash-exp` for fast and accurate image analysis
- **OpenAI**: Uses `gpt-4.1-mini` for fast, creative recipe generation with real-time streaming

### Multi-Image Analysis

- **1-3 Photos**: Analyze multiple angles of your fridge/pantry in one go
- **Smart Combining**: AI automatically combines ingredients from all photos
- **Duplicate Handling**: Automatically merges quantities of the same ingredients
- **Optimized Processing**: All images processed together for better context

### Real-time Recipe Streaming

- **Live Generation**: Watch your recipe appear in real-time as AI writes it
- **No More Waiting**: See content immediately instead of waiting for completion
- **Interactive Experience**: Visual feedback during recipe creation
- **Optimized Performance**: Uses streaming to reduce perceived loading time

### Image Format Support

The app automatically detects and supports various image formats:
- **JPEG/JPG**: Standard format from most cameras
- **PNG**: High quality images with transparency
- **WebP**: Modern efficient format
- **HEIC/HEIF**: Apple's newer format from iPhones
- **GIF, BMP, TIFF**: Additional common formats

Make sure you have:
- Valid API keys for both services
- Sufficient API credits/quota
- Internet connectivity for API calls

## Permissions

The app requires the following permissions:

- **Camera**: To take photos of ingredients
- **Photo Library**: To select existing photos

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **iOS build errors**: Clean build folder in Xcode or run `cd ios && xcodebuild clean`
3. **Android build errors**: Clean gradle with `cd android && ./gradlew clean`

### API Errors

- Check your OpenAI and Gemini API keys are valid
- Ensure you have API credits/quota for both services
- Verify internet connectivity
- Check API service status if calls are failing

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Happy Cooking!** 👨‍🍳👩‍🍳 