#!/bin/bash

echo "Installing Desktop JP Translator dependencies..."

# Install Node.js dependencies
npm install

echo "Dependencies installed successfully!"
echo ""
echo "To get started:"
echo "1. Run 'npm start' to launch the application"
echo "2. Click 'Settings' to configure your translation provider"
echo "3. For best results, set up a paid API (Google Cloud or DeepL)"
echo ""
echo "Available translation options:"
echo "- Free (No API key required, but less reliable)"
echo "- Google Cloud Translate API (Recommended for accuracy)"
echo "- DeepL API (Excellent for European languages + Japanese)"
echo ""
echo "For Google Cloud Translate:"
echo "1. Visit https://cloud.google.com/translate/docs/setup"
echo "2. Create a project and enable the Translation API"
echo "3. Create an API key and enter it in Settings"
echo ""
echo "For DeepL API:"
echo "1. Visit https://www.deepl.com/pro-api"
echo "2. Sign up for a DeepL Pro account"
echo "3. Get your API key and enter it in Settings"
