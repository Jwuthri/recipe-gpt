#!/bin/bash

# Recipe GPT Flutter Setup Script
echo "🍳 Setting up Recipe GPT Flutter..."

# Check if Flutter is installed
if ! command -v flutter &> /dev/null
then
    echo "❌ Flutter is not installed. Please install Flutter first:"
    echo "   Visit: https://docs.flutter.dev/get-started/install"
    exit 1
fi

echo "✅ Flutter found"

# Check Flutter doctor
echo "🔍 Running Flutter doctor..."
flutter doctor

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp env.template .env
    echo "⚠️  Please edit .env file and add your GEMINI_API_KEY"
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
else
    echo "✅ .env file already exists"
fi

# Run code generation
echo "🔧 Running code generation..."
flutter packages pub run build_runner build

# Check if we can run the app
echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your GEMINI_API_KEY"
echo "2. Run: flutter run"
echo ""
echo "For Android emulator: flutter run"
echo "For iOS simulator: flutter run"
echo "For specific device: flutter run -d [device-id]"
echo ""
echo "List devices: flutter devices" 