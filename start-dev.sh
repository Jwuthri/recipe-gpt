#!/bin/bash

# Recipe GPT Development Startup Script
# This script helps you start both the backend and frontend services

set -e

echo "🚀 Recipe GPT Development Startup"
echo "================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Node.js/npm is required but not installed."
    exit 1
fi

if ! command_exists expo; then
    echo "⚠️  Expo CLI not found. Installing globally..."
    npm install -g @expo/cli
fi

echo "✅ Prerequisites check passed"

# Ask user what to start
echo ""
echo "What would you like to start?"
echo "1) Backend only (backend-refactored)"
echo "2) Frontend only (recipe-gpt-expo)"  
echo "3) Both backend and frontend"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🔧 Starting backend only..."
        cd backend-refactored
        if [ ! -f ".env" ]; then
            echo "⚠️  No .env file found. Make sure to set up your GEMINI_API_KEY"
        fi
        ./run.sh install
        ./run.sh
        ;;
    2)
        echo "📱 Starting frontend only..."
        cd recipe-gpt-expo
        npm install
        npm start
        ;;
    3)
        echo "🚀 Starting both services..."
        
        # Start backend in background
        echo "🔧 Starting backend-refactored..."
        cd backend-refactored
        if [ ! -f ".env" ]; then
            echo "⚠️  No .env file found. Make sure to set up your GEMINI_API_KEY"
        fi
        ./run.sh install
        ./run.sh &
        BACKEND_PID=$!
        cd ..
        
        # Wait a moment for backend to start
        echo "⏳ Waiting for backend to start..."
        sleep 5
        
        # Start frontend
        echo "📱 Starting recipe-gpt-expo..."
        cd recipe-gpt-expo
        npm install
        npm start &
        FRONTEND_PID=$!
        
        # Wait for user to stop
        echo ""
        echo "✅ Both services are starting!"
        echo "🔧 Backend: http://localhost:8000"
        echo "📱 Frontend: Expo dev server will open"
        echo ""
        echo "Press Ctrl+C to stop both services"
        
        # Trap Ctrl+C to kill both processes
        trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
        
        # Wait for processes
        wait
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1, 2, or 3."
        exit 1
        ;;
esac

echo "✅ Done!" 