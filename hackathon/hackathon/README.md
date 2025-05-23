# Bio Bloom Smart Farming Chatbot

A Flask-based chatbot that provides expert advice on sustainable farming practices, crop recommendations, smart irrigation, and organic farming techniques.

## Features

- Real-time chat interface
- Expert advice on:
  - Crop recommendations based on soil type and weather
  - Smart irrigation suggestions
  - Organic fertilizer usage
  - Sustainability tips
- Modern, responsive UI
- Powered by Google's Gemini AI

## Setup

1. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the application:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

Simply type your farming-related questions into the chat interface and press Enter or click the Send button. The chatbot will provide detailed, context-aware responses to help with your sustainable farming needs.

## Security Note

The API key is stored in the `.env` file which should never be committed to version control. Make sure to keep your API key secure and never expose it publicly.

## Technology Stack

- Flask
- Google Gemini AI
- TailwindCSS
- HTML/CSS/JavaScript 