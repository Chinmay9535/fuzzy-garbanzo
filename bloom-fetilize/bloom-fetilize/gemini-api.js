// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyATYXzUlwIlyW8fO7fbwVPqA8n-gK8fxBA';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Function to analyze crop, soil, and location combination
window.analyzeCropAndSoil = async function(crop, soil, coords) {
    try {
        let locationText = '';
        if (coords && coords.lat && coords.lng) {
            locationText = `\nLocation: Latitude ${coords.lat.toFixed(5)}, Longitude ${coords.lng.toFixed(5)}`;
        }
        const prompt = `Analyze the following crop and soil combination in brief:${locationText}
Crop: ${crop}
Soil Type: ${soil}

Provide a concise analysis with these key points (maximum 2-3 points per section):

1. Soil Nutrient Analysis:
• [Key nutrients and pH level]

2. Recommended Fertilizer Schedule:
• [Main fertilizer type and timing]

3. Recommended Pesticide Application:
• [Key pesticides and application timing]

Keep each point brief and to the point.`;

        console.log('Sending prompt to API:', prompt);

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 500, // Reduced token limit for shorter responses
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Raw API Response:', data);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from API');
        }

        const resultText = data.candidates[0].content.parts[0].text;
        console.log('Parsed API Result Text:', resultText);
        return resultText;
    } catch (error) {
        console.error('Error analyzing crop, soil, and location:', error);
        throw error;
    }
};

// Function to display analysis results
window.displayAnalysisResults = function(results) {
    // Show the results section
    const resultsSection = document.querySelector('.results-section');
    resultsSection.style.display = 'block';
    
    // Update selected options
    const cropSelect = document.getElementById('crop-select');
    const soilSelect = document.getElementById('soil-select');
    document.querySelector('.selected-crop').textContent = cropSelect.options[cropSelect.selectedIndex].text;
    document.querySelector('.selected-soil').textContent = soilSelect.options[soilSelect.selectedIndex].text;
    
    // Split the results into sections
    const sections = results.split(/\d+\.\s+/).filter(section => section.trim());
    
    // Map for section titles and their display order
    const sectionMap = {
        'Soil Nutrient Analysis': { cardClass: 'nutrient-analysis', icon: 'fa-flask' },
        'Recommended Fertilizer Schedule': { cardClass: 'fertilizer', icon: 'fa-seedling' },
        'Recommended Pesticide Application': { cardClass: 'pesticide', icon: 'fa-shield-alt' }
    };
    const displayOrder = [
        'Soil Nutrient Analysis',
        'Recommended Fertilizer Schedule',
        'Recommended Pesticide Application'
    ];

    // Parse sections into a dictionary
    const parsedSections = {};
    sections.forEach(section => {
        const sectionTitle = section.split(':')[0].trim();
        const sectionContent = section.split(':').slice(1).join(':').trim();
        if (sectionMap[sectionTitle] && sectionContent && sectionContent !== '**') {
            parsedSections[sectionTitle] = sectionContent;
        }
    });

    let formattedHTML = `<div class="results-grid">`;
    displayOrder.forEach(title => {
        if (parsedSections[title]) {
            const { cardClass, icon } = sectionMap[title];
            formattedHTML += `
                <div class="result-card ${cardClass}">
                    <h3><i class="fas ${icon}"></i> ${title}</h3>
                    <div class="card-content">${formatSectionContent(parsedSections[title])}</div>
                </div>
            `;
        }
    });
    formattedHTML += `</div>`;

    // Update the results content
    const resultsContent = document.querySelector('.results-content');
    resultsContent.innerHTML = formattedHTML;

    // Scroll to results section
    resultsSection.scrollIntoView({ behavior: 'smooth' });
};

// Helper function to format section content
function formatSectionContent(content) {
    // Split content into lines and format each line
    return content.split('\n')
        .filter(line => line.trim())
        .map(line => {
            if (line.trim().startsWith('•')) {
                return `<div class="bullet-point">${line.trim()}</div>`;
            }
            return `<p>${line.trim()}</p>`;
        })
        .join('');
} 