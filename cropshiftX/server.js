const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini AI with safety settings
const genAI = new GoogleGenerativeAI('AIzaSyATYXzUlwIlyW8fO7fbwVPqA8n-gK8fxBA');

// Helper function to generate crop rotation suggestions
async function generateCropRotationPlan(currentCrop, soilType, region, location) {
    try {
        // Use Gemini-1.5-pro model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        });
        
        const prompt = `As an agricultural expert, generate a detailed 3-year crop rotation plan based on the following information:
        Current Crop: ${currentCrop}
        Soil Type: ${soilType}
        Region: ${region}
        Location Coordinates: Latitude ${location.lat}, Longitude ${location.lng}

        Please provide a detailed response in the following format:

        CURRENT SITUATION (YEAR 1):
        - Current Crop: ${currentCrop}
        - Current Soil Conditions
        - Regional Climate Considerations

        YEAR 2 RECOMMENDATION:
        - Recommended Crop
        - Rationale for Selection
        - Expected Benefits
        - Planting and Management Tips

        YEAR 3 RECOMMENDATION:
        - Recommended Crop
        - Rationale for Selection
        - Expected Benefits
        - Planting and Management Tips

        ROTATION BENEFITS:
        - Soil Health Impact
        - Pest Management Benefits
        - Nutrient Cycling
        - Economic Considerations

        SPECIAL CONSIDERATIONS:
        - Soil Type Specific Recommendations
        - Regional Climate Adaptations
        - Sustainable Farming Practices`;

        // Generate content with retry mechanism
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;

        while (attempts < maxAttempts) {
            try {
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                });

                const response = await result.response;
                return response.text();
            } catch (error) {
                lastError = error;
                attempts++;
                if (attempts === maxAttempts) {
                    throw new Error('Failed to generate plan after multiple attempts: ' + error.message);
                }
                // Wait for 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error('Error generating content:', error);
        throw new Error('Failed to generate crop rotation plan: ' + error.message);
    }
}

app.post('/generate-plan', async (req, res) => {
    try {
        const { currentCrop, soilType, region, location } = req.body;

        // Input validation
        if (!currentCrop || !soilType || !region || !location) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (!location.lat || !location.lng) {
            return res.status(400).json({
                success: false,
                error: 'Invalid location coordinates'
            });
        }

        // Generate the crop rotation plan
        const plan = await generateCropRotationPlan(currentCrop, soilType, region, location);

        if (!plan) {
            throw new Error('No plan was generated');
        }

        res.json({
            success: true,
            plan: plan
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while generating the plan'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'An unexpected error occurred'
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 