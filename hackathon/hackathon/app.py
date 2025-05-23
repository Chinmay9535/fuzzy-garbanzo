from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

app = Flask(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyA9I0BuxAIXG8ZspOOgc0hdRquYUr-6iAc')
client = genai.Client(api_key=GEMINI_API_KEY)

def create_prompt(user_query):
    """Create a context-aware prompt for the Gemini model."""
    base_prompt = """You are Sam, a friendly farming expert at Bio Bloom. Keep your responses short, practical, and conversational. 
    Speak like a real person chatting with a friend, not like an AI. Use simple language and avoid technical jargon unless necessary.
    
    Guidelines:
    - Keep responses under 3-4 sentences unless more detail is specifically requested
    - Use casual, friendly language (like "hey", "sure thing", etc.)
    - Include only the most relevant information
    - If suggesting products or techniques, give 1-2 specific recommendations
    - Use bullet points only when listing multiple items
    
    The farmer's question is: """
    return base_prompt + user_query

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message', '')
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Create prompt with context
        prompt = create_prompt(user_message)
        
        # Generate response using Gemini with enhanced parameters
        response = client.models.generate_content(
            model='gemini-2.0-flash-001',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.9,  # Increased for more natural language
                top_p=0.8,
                top_k=40,
                max_output_tokens=150,  # Reduced to encourage conciseness
                safety_settings=[
                    types.SafetySetting(
                        category='HARM_CATEGORY_HARASSMENT',
                        threshold='BLOCK_MEDIUM_AND_ABOVE'
                    ),
                    types.SafetySetting(
                        category='HARM_CATEGORY_HATE_SPEECH',
                        threshold='BLOCK_MEDIUM_AND_ABOVE'
                    ),
                    types.SafetySetting(
                        category='HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold='BLOCK_MEDIUM_AND_ABOVE'
                    ),
                    types.SafetySetting(
                        category='HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold='BLOCK_MEDIUM_AND_ABOVE'
                    )
                ]
            )
        )
        
        # Format and return the response
        return jsonify({
            'response': response.text,
            'status': 'success'
        })

    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)