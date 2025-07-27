# 🍳 Recipe GPT Flutter

A beautiful, AI-powered recipe generation app built with Flutter and clean architecture. Upload photos of your ingredients and get personalized recipes with real-time AI streaming!

![Flutter](https://img.shields.io/badge/Flutter-3.0+-blue.svg)
![Dart](https://img.shields.io/badge/Dart-3.0+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

- 📷 **Smart Ingredient Detection** - Take photos of ingredients and let AI identify them
- 🤖 **Real-time AI Streaming** - Watch recipes generate in real-time with streaming responses
- 🎨 **Beautiful Material 3 Design** - Modern UI with dynamic colors and smooth animations
- 💬 **AI Chat Assistant** - Ask cooking questions and get personalized advice
- 🏗️ **Clean Architecture** - Scalable, maintainable codebase following best practices
- 🌙 **Dark/Light Themes** - Automatic theme switching with system preferences
- 📱 **Responsive Design** - Works beautifully on all screen sizes

## 🚀 Quick Start

### Prerequisites

- Flutter 3.0+ installed
- Google Gemini API key

### Setup

0. Run sim
```
xcrun simctl list devices | grep iPhone
xcrun simctl boot "iPhone 16 Pro"
flutter clean
flutter build ios --release && flutter install --release -d "00008110-00014D4E340A801E"
```

1. **Clone and navigate**
   ```bash
   git clone <your-repo>
   cd recipe_gpt_flutter
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure environment**
   ```bash
   cp env.template .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Generate code**
   ```bash
   flutter packages pub run build_runner build
   ```

5. **Run the app**
   ```bash
   flutter run
   ```

## 🏗️ Architecture

Built with **Clean Architecture** principles:

```
lib/
├── core/               # Core functionality
│   ├── constants/      # App constants
│   ├── di/            # Dependency injection
│   ├── errors/        # Error handling
│   ├── network/       # Network layer
│   └── utils/         # Utilities
├── data/              # Data layer
│   ├── datasources/   # Remote data sources
│   ├── models/        # Data models
│   └── repositories/  # Repository implementations
├── domain/            # Business logic layer
│   ├── entities/      # Business entities
│   ├── repositories/  # Repository contracts
│   └── usecases/      # Business use cases
└── presentation/      # UI layer
    ├── blocs/         # State management (Cubit)
    ├── routes/        # Navigation
    ├── screens/       # UI screens
    ├── themes/        # App theming
    └── widgets/       # Reusable widgets
```

## 🎯 Key Components

### State Management
- **BLoC/Cubit** pattern for predictable state management
- **Stream support** for real-time AI responses
- **Immutable states** with Equatable

### AI Integration
- **Google Gemini API** for recipe generation and chat
- **Server-Sent Events (SSE)** for streaming responses
- **Smart ingredient detection** from images

### UI/UX
- **Material 3** design system
- **Dynamic colors** that adapt to system theme
- **Smooth animations** and transitions
- **Responsive design** for all screen sizes

## 📱 Screens

1. **Camera Screen** - Capture or select ingredient photos
2. **Ingredients Screen** - Review detected ingredients and select cooking style
3. **Recipe Screen** - Watch AI generate recipes in real-time
4. **Chat Screen** - Conversational AI cooking assistant

## 🛠️ Development

### Code Generation
```bash
# Run code generation
flutter packages pub run build_runner build

# Watch for changes
flutter packages pub run build_runner watch
```

### Testing
```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test/
```

### Build
```bash
# Debug build
flutter build apk --debug

# Release build
flutter build apk --release
```

## 🎨 Customization

### Themes
Modify `lib/presentation/themes/app_theme.dart` to customize colors and styling.

### Constants
Update `lib/core/constants/app_constants.dart` for app-wide configuration.

### API Configuration
Adjust API endpoints in `lib/config/app_config.dart`.

## 📦 Dependencies

### Core
- **flutter_bloc** - State management
- **get_it** - Dependency injection
- **go_router** - Navigation
- **dio** - HTTP client

### UI
- **dynamic_color** - Material 3 theming
- **google_fonts** - Typography
- **flutter_markdown** - Recipe rendering

### Camera & Images
- **camera** - Camera functionality
- **image_picker** - Image selection
- **permission_handler** - Permissions

### Utilities
- **flutter_dotenv** - Environment configuration
- **equatable** - Value equality
- **uuid** - Unique identifiers

## 🔧 Configuration

### Environment Variables
Create `.env` file with:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash
GEMINI_STREAM_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent
DEBUG_MODE=true
```

### Permissions

#### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

#### iOS (`ios/Runner/Info.plist`)
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan ingredients</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to select ingredient images</string>
```

## 🚀 Deployment

### Android
1. Update `android/app/build.gradle` with signing config
2. Run `flutter build apk --release`
3. Upload to Google Play Store

### iOS
1. Configure signing in Xcode
2. Run `flutter build ipa`
3. Upload to App Store Connect

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Flutter team for the amazing framework
- Material Design team for design guidelines

---

**Made with ❤️ and Flutter** 