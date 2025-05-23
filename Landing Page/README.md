# BioBloom Chatbot

A smart chatbot assistant for the BioBloom website that helps users with agricultural solutions, including crop rotation, biofuel efficiency, and crop disease detection.

## Features

- Interactive chat interface
- Powered by Google's Gemini AI
- Responsive design
- Real-time responses
- Specialized in agricultural solutions

## Setup

1. Clone this repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
5. Run the application:
   ```bash
   python app.py
   ```
6. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Type your question in the chat input
2. Press Enter or click the Send button
3. The chatbot will respond with relevant information about:
   - Crop rotation recommendations
   - Biofuel efficiency optimization
   - Crop disease detection and prevention

## Technologies Used

- Flask (Backend)
- Google Gemini AI
- HTML/CSS/JavaScript (Frontend)
- Tailwind CSS (Styling) 