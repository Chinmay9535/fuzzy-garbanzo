// Navigation handling
document.addEventListener('DOMContentLoaded', () => {
    // Update active nav link on scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });

        // Add shadow to navbar on scroll
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });
});

// Initialize map with Bangalore coordinates
let map = L.map('map').setView([12.9716, 77.5946], 11); // Bangalore coordinates with zoom level 11
let marker = null;
let selectedLocation = null;

// Define base layers
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

// Google Satellite with Labels
const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '© Google Maps'
});

// Add the satellite layer as default
satelliteLayer.addTo(map);

// Create layer control
const baseLayers = {
    "Satellite View": satelliteLayer,
    "Street View": streetLayer
};

// Add layer control to map
L.control.layers(baseLayers, null, {
    position: 'topright',
    collapsed: false
}).addTo(map);

// Add initial marker for Bangalore
marker = L.marker([12.9716, 77.5946]).addTo(map);
selectedLocation = { lat: 12.9716, lng: 77.5946 };

// Add location control button
const locationControl = L.control({ position: 'bottomright' });
locationControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'location-control');
    div.innerHTML = `
        <button class="location-button" title="Find my location">
            <i class="fas fa-location-crosshairs"></i>
        </button>
    `;
    
    div.onclick = function() {
        if (navigator.geolocation) {
            // Show loading state
            const button = div.querySelector('.location-button');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            button.style.backgroundColor = '#3498db';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Update map and marker
                    map.setView([lat, lng], 13);
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    marker = L.marker([lat, lng]).addTo(map);
                    selectedLocation = { lat, lng };
                    
                    // Reset button state
                    button.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
                    button.style.backgroundColor = '#fff';
                },
                (error) => {
                    // Reset button state and show error
                    button.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
                    button.style.backgroundColor = '#fff';
                    alert('Unable to find your location. Please try again or select manually.');
                    console.error('Geolocation error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };
    return div;
};
locationControl.addTo(map);

map.on('click', function(e) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(map);
    selectedLocation = e.latlng;
});

// Form elements
const form = document.querySelector('.form-container');
const generateBtn = document.getElementById('generateBtn');
const resultContainer = document.querySelector('.result-container');
const planResult = document.getElementById('planResult');
const downloadBtn = document.getElementById('downloadBtn');
const loadingOverlay = document.querySelector('.loading-overlay');

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .benefit-card, .contact-item').forEach(el => {
    observer.observe(el);
});

// Generate plan
generateBtn.addEventListener('click', async () => {
    const currentCrop = document.getElementById('currentCrop').value.trim();
    const soilType = document.getElementById('soilType').value;
    const region = document.getElementById('region').value;

    // Validate inputs
    const errors = [];
    if (!currentCrop) errors.push('Please enter your current crop');
    if (!soilType) errors.push('Please select a soil type');
    if (!region) errors.push('Please select your region');
    if (!selectedLocation) errors.push('Please select your location on the map');

    if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
    }

    try {
        loadingOverlay.style.display = 'flex';
        setTimeout(() => loadingOverlay.classList.add('visible'), 0);

        const response = await fetch('/generate-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentCrop,
                soilType,
                region,
                location: {
                    lat: selectedLocation.lat,
                    lng: selectedLocation.lng
                }
            })
        });

        const data = await response.json();

        if (data.success) {
            displayPlan(data.plan);
        } else {
            throw new Error(data.error || 'Failed to generate plan');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + (error.message || 'Failed to generate crop rotation plan. Please try again.'));
    } finally {
        loadingOverlay.classList.remove('visible');
        setTimeout(() => loadingOverlay.style.display = 'none', 300);
    }
});

// Update download button event listener
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'downloadBtn') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set default font styles
        doc.setFont("helvetica");
        
        // Add logo and company name
        doc.setFontSize(24);
        doc.setTextColor(52, 152, 219); // #3498db
        doc.text('CropShiftX', 20, 20);
        
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80); // #2c3e50
        doc.text('Crop Rotation Planning System', 20, 30);
        
        // Add horizontal line
        doc.setDrawColor(52, 152, 219);
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);
        
        // Report title
        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text('Crop Rotation Plan Report', 105, 50, { align: 'center' });
        
        // Metadata section with improved formatting
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create metadata table
        doc.setFontSize(10);
        const metadata = [
            ['Date:', currentDate],
            ['Current Crop:', document.getElementById('currentCrop').value],
            ['Soil Type:', document.getElementById('soilType').value],
            ['Region:', document.getElementById('region').value],
            ['Location:', `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lng.toFixed(4)}°`]
        ];
        
        // Draw metadata table
        let yPos = 70;
        metadata.forEach(([label, value]) => {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(52, 152, 219);
            doc.text(label, 20, yPos);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(44, 62, 80);
            doc.text(value, 60, yPos);
            
            yPos += 8;
        });
        
        // Add horizontal line after metadata
        doc.setDrawColor(52, 152, 219);
        doc.line(20, yPos + 5, 190, yPos + 5);
        
        // Plan content with sections
        const planText = document.getElementById('planResult').textContent;
        const sections = [
            'CURRENT SITUATION',
            'YEAR 2 RECOMMENDATION',
            'YEAR 3 RECOMMENDATION',
            'ROTATION BENEFITS',
            'SPECIAL CONSIDERATIONS'
        ];
        
        yPos += 20;
        
        sections.forEach((section, index) => {
            // Section header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(52, 152, 219);
            doc.text(section, 20, yPos);
            yPos += 7;
            
            // Section content
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(44, 62, 80);
            
            // Extract section content
            let sectionContent = '';
            const startIdx = planText.indexOf(section);
            const endIdx = index < sections.length - 1 ? 
                          planText.indexOf(sections[index + 1]) : 
                          planText.length;
            
            if (startIdx !== -1) {
                sectionContent = planText.substring(startIdx + section.length, endIdx).trim();
                const lines = doc.splitTextToSize(sectionContent, 150);
                
                // Check if we need a new page
                if (yPos + (lines.length * 5) > 280) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.text(lines, 25, yPos);
                yPos += (lines.length * 5) + 10;
            }
        });
        
        // Add footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(52, 152, 219);
            doc.line(20, 285, 190, 285);
            
            // Footer text
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(44, 62, 80);
            doc.text('Generated by CropShiftX - Smart Crop Rotation Planning System', 105, 292, { align: 'center' });
            
            // Page numbers
            doc.text(`Page ${i} of ${pageCount}`, 185, 292, { align: 'right' });
        }
        
        // Save the PDF
        doc.save('crop-rotation-plan.pdf');
    }
});

function displayPlan(plan) {
    const resultContainer = document.querySelector('.result-container');
    resultContainer.innerHTML = '';
    
    // Make sure the container is visible
    resultContainer.style.display = 'block';
    resultContainer.style.opacity = '1';

    // Add the title
    const title = document.createElement('h2');
    title.textContent = 'Your 3-Year Crop Rotation Plan';
    resultContainer.appendChild(title);

    // Create plan container
    const planContainer = document.createElement('div');
    planContainer.className = 'plan-result-container';

    // Parse the plan text into sections
    const sections = {
        'current': {
            title: 'Current Situation (Year 1)',
            icon: 'fa-seedling',
            content: extractSection(plan, 'CURRENT SITUATION', 'YEAR 2 RECOMMENDATION')
        },
        'year2': {
            title: 'Year 2 Recommendation',
            icon: 'fa-leaf',
            content: extractSection(plan, 'YEAR 2 RECOMMENDATION', 'YEAR 3 RECOMMENDATION')
        },
        'year3': {
            title: 'Year 3 Recommendation',
            icon: 'fa-tree',
            content: extractSection(plan, 'YEAR 3 RECOMMENDATION', 'ROTATION BENEFITS')
        },
        'benefits': {
            title: 'Rotation Benefits',
            icon: 'fa-chart-line',
            content: extractSection(plan, 'ROTATION BENEFITS', 'SPECIAL CONSIDERATIONS')
        },
        'considerations': {
            title: 'Special Considerations',
            icon: 'fa-lightbulb',
            content: extractSection(plan, 'SPECIAL CONSIDERATIONS', null)
        }
    };

    // Create sections
    Object.entries(sections).forEach(([key, section]) => {
        const sectionElement = createSection(section.title, section.icon, section.content);
        planContainer.appendChild(sectionElement);
    });

    resultContainer.appendChild(planContainer);

    // Add download button
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'downloadBtn';
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = 'Download Report';
    resultContainer.appendChild(downloadBtn);

    // Store the plan text for PDF generation
    const planTextElement = document.createElement('div');
    planTextElement.id = 'planResult';
    planTextElement.style.display = 'none';
    planTextElement.textContent = plan;
    resultContainer.appendChild(planTextElement);

    // Scroll to results with some offset for the fixed header
    const offset = 80; // Height of the fixed header
    const topPosition = resultContainer.offsetTop - offset;
    window.scrollTo({
        top: topPosition,
        behavior: 'smooth'
    });
}

function extractSection(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    const endIndex = endMarker ? text.indexOf(endMarker) : text.length;
    if (startIndex === -1) return '';
    
    let content = text.substring(startIndex + startMarker.length, endIndex !== -1 ? endIndex : undefined).trim();
    return formatContent(content);
}

function formatContent(content) {
    // Remove asterisks and clean up the content
    content = content.replace(/\*\*/g, '');
    
    // Split into bullet points
    const points = content.split('\n').filter(line => line.trim());
    
    const formattedPoints = points.map(point => {
        const [label, ...value] = point.split(':');
        if (value.length) {
            return {
                label: label.trim().replace(/^\*\s*/, ''),
                value: value.join(':').trim()
            };
        }
        return {
            value: point.trim().replace(/^\*\s*/, '')
        };
    });

    return formattedPoints;
}

function createSection(title, iconName, content) {
    const section = document.createElement('div');
    section.className = 'plan-section';

    const header = document.createElement('div');
    header.className = 'plan-section-header';

    const icon = document.createElement('div');
    icon.className = 'plan-section-icon';
    icon.innerHTML = `<i class="fas ${iconName}"></i>`;

    const titleElement = document.createElement('h3');
    titleElement.className = 'plan-section-title';
    titleElement.textContent = title;

    header.appendChild(icon);
    header.appendChild(titleElement);

    const contentContainer = document.createElement('div');
    contentContainer.className = 'plan-content';

    content.forEach(item => {
        const group = document.createElement('div');
        group.className = 'info-group';

        if (item.label) {
            const label = document.createElement('div');
            label.className = 'info-label';
            label.textContent = item.label;
            group.appendChild(label);
        }

        const value = document.createElement('p');
        value.className = 'info-value';
        value.textContent = item.value;
        group.appendChild(value);

        contentContainer.appendChild(group);
    });

    section.appendChild(header);
    section.appendChild(contentContainer);

    return section;
} 