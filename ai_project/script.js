// Initialize map
let map;
let marker;
let userLocation = { lat: 20.5937, lng: 78.9629 }; // Default to India's center

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    setupFormHandling();
    setupMobileMenu();
    setupSmoothScroll();
    setupNavHighlight();
    setupIntersectionObserver();
    setupLoadingOverlay();
});

function setupMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !navLinks.contains(e.target)) {
            mobileMenu.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                document.querySelector('.nav-links').style.display = '';
            }
        });
    });
}

function setupNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop - 60) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });
}

function initializeMap() {
    map = L.map('map').setView([userLocation.lat, userLocation.lng], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Get user's location if they allow it
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setView([userLocation.lat, userLocation.lng], 13);
                setMarker(userLocation);
            },
            (error) => {
                console.log('Error getting location:', error);
                setMarker(userLocation);
            }
        );
    }

    // Add click event to map with animation
    map.on('click', (e) => {
        userLocation = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
        };
        setMarker(userLocation);
        
        // Animate the marker drop
        if (marker) {
            marker.element.style.transition = 'transform 0.3s ease-out';
            marker.element.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                marker.element.style.transform = 'translateY(0)';
            }, 50);
        }
    });
}

function setMarker(location) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([location.lat, location.lng]).addTo(map);
    document.getElementById('latitude').value = location.lat.toFixed(6);
    document.getElementById('longitude').value = location.lng.toFixed(6);
}

function setupFormHandling() {
    const form = document.getElementById('wasteForm');
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        // Add placeholder for animation
        if (input.type !== 'hidden') {
            input.setAttribute('placeholder', ' ');
        }

        // Add focused class for animation
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });

        // Add validation feedback
        input.addEventListener('input', () => {
            validateInput(input);
        });
    });

    form.addEventListener('submit', handleFormSubmit);
}

function validateInput(input) {
    const isValid = input.checkValidity();
    input.parentElement.classList.toggle('invalid', !isValid);
    
    if (!isValid && input.value) {
        showNotification('Please check your input values.', 'error');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Validate all inputs
    const inputs = form.querySelectorAll('input:not([type="hidden"]), select');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
            validateInput(input);
        }
    });

    if (!isValid) {
        showNotification('Please fill in all required fields correctly.', 'error');
        return;
    }

    // Show loading state
    showLoading();
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        const formData = {
            cropType: document.getElementById('cropType').value,
            quantity: document.getElementById('quantity').value,
            latitude: document.getElementById('latitude').value,
            longitude: document.getElementById('longitude').value
        };

        const recommendations = await getRecommendations(
            formData.cropType,
            formData.quantity,
            formData.latitude,
            formData.longitude
        );

        displayResults(recommendations);
        showNotification('Recommendations generated successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
        hideLoading();
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);
    
    // Add click handler for close button
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });

    // Show notification with animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

async function getRecommendations(cropType, quantity, latitude, longitude) {
    const API_KEY = 'AIzaSyDgbtvActovGzl0n5FYEi2lOGzJbPP64vE';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    const prompt = `Given the following agricultural waste details:
    - Crop Type: ${cropType}
    - Quantity: ${quantity} tons
    - Location: Latitude ${latitude}, Longitude ${longitude}

    Please provide detailed recommendations for sustainable waste management solutions including:
    1. Composting potential and process
    2. Biogas generation possibilities
    3. Other sustainable uses
    4. Estimated environmental impact
    5. Economic benefits
    
    Respond with a JSON object in this exact format (no markdown, no code blocks, just pure JSON):
    {
        "solutions": [
            {
                "type": "string",
                "description": "string",
                "process": "string",
                "environmentalImpact": "string",
                "economicBenefit": "string"
            }
        ]
    }`;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Response:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        
        // Clean up the response text
        let cleanedText = rawText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            console.log('Raw response:', rawText);
            console.log('Cleaned text:', cleanedText);
            
            return {
                solutions: [{
                    type: "Error Processing Response",
                    description: "The AI model provided a response in an unexpected format. Please try again.",
                    process: "Error in processing the response",
                    environmentalImpact: "Unable to determine",
                    economicBenefit: "Unable to determine"
                }]
            };
        }
    } catch (error) {
        console.error('API Error:', error);
        throw new Error('Failed to get recommendations: ' + error.message);
    }
}

function displayResults(recommendations) {
    const resultsContainer = document.querySelector('.results-container');
    const solutionsGrid = resultsContainer.querySelector('.solutions-grid');
    
    // Clear previous results
    solutionsGrid.innerHTML = '';

    // Show skeleton loading while preparing results
    for (let i = 0; i < 3; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'solution-card skeleton';
        solutionsGrid.appendChild(skeleton);
    }

    // Add new results with staggered animation
    setTimeout(() => {
        solutionsGrid.innerHTML = '';
        recommendations.solutions.forEach((solution, index) => {
            const card = document.createElement('div');
            card.className = 'solution-card';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.innerHTML = `
                <h3><i class="fas fa-lightbulb"></i> ${solution.type}</h3>
                <div class="solution-content">
                    <p><strong>Description:</strong> ${solution.description}</p>
                    <p><strong>Process:</strong> ${solution.process}</p>
                    <p><strong>Environmental Impact:</strong> ${solution.environmentalImpact}</p>
                    <p><strong>Economic Benefit:</strong> ${solution.economicBenefit}</p>
                </div>
            `;
            solutionsGrid.appendChild(card);

            // Animate card entrance
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });

        // Show results section with smooth scroll
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1000); // Show skeleton for 1 second
}

function setupIntersectionObserver() {
    const sections = document.querySelectorAll('section');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    sections.forEach(section => observer.observe(section));
}

function setupLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
}

function showLoading() {
    document.querySelector('.loading-overlay').classList.add('active');
}

function hideLoading() {
    document.querySelector('.loading-overlay').classList.remove('active');
} 