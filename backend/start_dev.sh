#!/bin/bash

# Recipe GPT Backend Development Startup Script

echo "🚀 Starting Recipe GPT Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from example..."
    echo "# Database (optional - defaults to SQLite)" > .env
    echo "DATABASE_URL=sqlite:///./recipe_gpt.db" >> .env
    echo "" >> .env
    echo "# Google Gemini API" >> .env
    echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env
    echo "" >> .env
    echo "# App Settings" >> .env
    echo "SECRET_KEY=dev_secret_key_$(date +%s)" >> .env
    echo "DEBUG=True" >> .env
    echo ""
    echo "📝 Please edit .env file and add your GEMINI_API_KEY"
    echo "💡 You can get a Gemini API key from: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo "🌟 Starting FastAPI server on http://localhost:8000"
echo "📖 API Documentation will be available at http://localhost:8000/docs"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000 