#!/bin/bash

# Recipe GPT iOS Deployment Script
# This script automates the iOS build process for App Store submission

set -e  # Exit on any error

echo "🚀 Recipe GPT - iOS Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "pubspec.yaml" ]; then
    print_error "Please run this script from the Flutter project root directory"
    exit 1
fi

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    print_error "Flutter is not installed or not in PATH"
    exit 1
fi

# Check if iOS development is set up
print_status "Checking Flutter environment..."
flutter doctor

# Step 1: Clean the project
print_status "Cleaning Flutter project..."
flutter clean

# Step 2: Get dependencies
print_status "Getting Flutter dependencies..."
flutter pub get

# Step 3: Run code analysis
print_status "Running code analysis..."
flutter analyze

# Step 4: Run tests (if any exist)
if [ -d "test" ] && [ "$(ls -A test)" ]; then
    print_status "Running tests..."
    flutter test
else
    print_warning "No tests found, skipping test execution"
fi

# Step 5: Build for iOS release
print_status "Building iOS release..."
flutter build ios --release

# Step 6: Check if build was successful
if [ $? -eq 0 ]; then
    print_success "iOS build completed successfully!"
    print_status "Build location: build/ios/iphoneos/Runner.app"
else
    print_error "iOS build failed!"
    exit 1
fi

# Step 7: Open Xcode for archiving
print_status "Opening Xcode workspace for archiving..."
open ios/Runner.xcworkspace

echo ""
echo "🎉 Build process completed!"
echo ""
echo "Next steps:"
echo "1. In Xcode, select 'Any iOS Device' as target"
echo "2. Go to Product → Archive"
echo "3. Wait for archive to complete"
echo "4. Use Xcode Organizer to upload to App Store Connect"
echo ""
echo "For detailed instructions, see: deploy_guide.md"

# Step 8: Display app information
echo ""
echo "📱 App Information:"
echo "-------------------"
echo "App Name: Recipe GPT"
echo "Bundle ID: com.julienwuthrich.recipegpt"
echo "Version: $(grep '^version:' pubspec.yaml | sed 's/version: //')"
echo ""

print_success "Deployment script completed! 🚀" 