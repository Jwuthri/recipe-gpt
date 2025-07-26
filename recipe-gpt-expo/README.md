# Recipe GPT Expo App

A React Native/Expo mobile app for recipe generation and cooking assistance.

## Setup

### Prerequisites
- Node.js and npm
- Expo CLI (`npm install -g @expo/cli`)
- The backend-refactored service running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Use the Expo Go app on your phone to scan the QR code, or run on an emulator:
```bash
npm run ios     # For iOS simulator
npm run android # For Android emulator
```

## Backend Connection

This app connects to the **backend-refactored** service. Make sure to:

1. Start the backend-refactored service first:
```bash
cd ../backend-refactored
./run.sh
```

2. The backend will run on `http://localhost:8000` with API routes under `/api/v1`

3. The app automatically detects if it's in development mode and uses `localhost:8000`

## Features

- **Image Analysis**: Take photos of ingredients and get AI-powered ingredient recognition
- **Recipe Generation**: Generate recipes based on available ingredients  
- **Chat Interface**: Interactive cooking assistant
- **Session Management**: Persistent chat sessions

## API Endpoints Used

- `POST /api/v1/users/` - Create/get user
- `POST /api/v1/sessions/` - Create chat session
- `GET /api/v1/users/{user_id}/sessions/` - Get user sessions
- `POST /api/v1/analyze-images` - Analyze ingredient images
- `POST /api/v1/chat` - Send chat messages

## Troubleshooting

- Make sure the backend-refactored service is running on port 8000
- Check that your device/emulator can reach localhost (use your computer's IP address if needed)
- Ensure you have camera permissions enabled for image analysis features 