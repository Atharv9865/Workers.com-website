// Enhanced Workers.com Application with Realistic Worker Movement

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeAuth = document.getElementById('closeAuth');
const authSection = document.getElementById('authSection');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');
const backBtn = document.getElementById('backBtn');
const findWorkerBtn = document.getElementById('findWorkerBtn');
const confirmBookingBtn = document.getElementById('confirmBookingBtn');
const callWorkerBtn = document.getElementById('callWorkerBtn');
const multipleWorkerForm = document.getElementById('multipleWorkerForm');
const contactForm = document.getElementById('contactForm');
const submitRatingBtn = document.getElementById('submitRatingBtn');
const bookingHistoryCard = document.getElementById('bookingHistoryCard');
const rateWorkersCard = document.getElementById('rateWorkersCard');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const loadingOverlay = document.getElementById('loadingOverlay');

// Map variables
let bookingMap, trackingMap;
let workerMarker, homeMarker, routingControl;
let currentWorker;
let currentSection = 'home-section';
let currentService = 'default';
let selectedRating = 0;

// Location tracking variables
let userLocation = null;
let userAddress = "Your current location";
let locationWatchId = null;
let routeCoordinates = [];
let currentRouteIndex = 0;
let moveInterval = null;

// Application state
let currentUser = null;
let userBookings = [];
let workers = [];

// Real-world timing constants (in milliseconds)
const REAL_WORLD_TIMING = {
    PREP_TIME: 300000, // 5 minutes preparation time
    MOVEMENT_INTERVAL: 2000, // Update every 2 seconds
    MIN_TRAVEL_TIME: 600000, // Minimum 10 minutes travel time
    MAX_TRAVEL_TIME: 1800000, // Maximum 30 minutes travel time
    TRAFFIC_DELAYS: [0, 60000, 120000, 180000] // Possible traffic delays
};

// Service backgrounds
const serviceBackgrounds = {
    'plumbing': 'bg-plumbing',
    'painting': 'bg-painting',
    'shifting': 'bg-shifting',
    'electrical': 'bg-electrical',
    'carpentry': 'bg-carpentry',
    'other': 'bg-other',
    'default': 'bg-default'
};

const sectionBackgrounds = {
    'plumbing': 'section-plumbing',
    'painting': 'section-painting',
    'shifting': 'section-shifting',
    'electrical': 'section-electrical',
    'carpentry': 'section-carpentry',
    'other': 'section-other',
    'default': 'section-default'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    console.log('Initializing Workers.com application...');
    
    // Set minimum date for multiple worker booking to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const projectDate = document.getElementById('projectDate');
    if (projectDate) {
        projectDate.min = tomorrow.toISOString().split('T')[0];
    }

    // Load initial data
    loadUserData();
    
    // Get user location when page loads - this will also load workers for that location
    getUserLocation();
    
    // Set home as active section by default
    showSection('home-section');
    
    // Initialize event listeners
    initializeEventListeners();
    
    console.log('Workers.com application initialized successfully');
}

// Initialize all event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Authentication events
    if (loginBtn) loginBtn.addEventListener('click', () => showAuthSection('login'));
    if (signupBtn) signupBtn.addEventListener('click', () => showAuthSection('signup'));
    if (closeAuth) closeAuth.addEventListener('click', () => hideAuthSection());
    if (loginTab) loginTab.addEventListener('click', () => switchAuthTab('login'));
    if (signupTab) signupTab.addEventListener('click', () => switchAuthTab('signup'));
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (dashboardLogoutBtn) dashboardLogoutBtn.addEventListener('click', handleLogout);

    // Navigation events
    if (backBtn) backBtn.addEventListener('click', handleBackNavigation);
    if (findWorkerBtn) findWorkerBtn.addEventListener('click', () => showSection('find-worker-section'));
    
    // Form submissions
    if (multipleWorkerForm) multipleWorkerForm.addEventListener('submit', handleMultipleWorkerBooking);
    if (contactForm) contactForm.addEventListener('submit', handleContactForm);
    
    // Booking and tracking events
    if (confirmBookingBtn) confirmBookingBtn.addEventListener('click', handleBookingConfirmation);
    if (callWorkerBtn) callWorkerBtn.addEventListener('click', handleCallWorker);
    if (submitRatingBtn) submitRatingBtn.addEventListener('click', handleRatingSubmission);
    
    // Dashboard events
    if (bookingHistoryCard) bookingHistoryCard.addEventListener('click', toggleBookingHistory);
    if (rateWorkersCard) rateWorkersCard.addEventListener('click', () => showSection('rating-section'));
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });
    
    // Section switching elements
    document.querySelectorAll('[data-section]').forEach(element => {
        if (element.classList.contains('nav-link')) return;

        element.addEventListener('click', () => {
            if (element.hasAttribute('data-service')) {
                const service = element.getAttribute('data-service');
                changeBackground(service);
            }
            showSection(element.dataset.section);
        });
    });
    
    // Rating stars
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            updateRatingDisplay();
        });
        
        star.addEventListener('mouseover', () => {
            highlightStars(parseInt(star.getAttribute('data-rating')));
        });
        
        star.addEventListener('mouseout', () => {
            resetStarHighlight();
        });
    });
    
    console.log('Event listeners initialized successfully');
}

// Authentication Functions
function showAuthSection(type) {
    authSection.style.display = 'flex';
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
}

function hideAuthSection() {
    authSection.style.display = 'none';
}

function switchAuthTab(tab) {
    if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simulate API call
    showLoading(true);
    setTimeout(() => {
        showLoading(false);
        
        // For demo purposes - in real app, validate against stored users
        if (email && password) {
            // If user exists or credentials are valid
            if (!currentUser) {
                currentUser = {
                    id: Date.now(),
                    name: email.split('@')[0],
                    email: email
                };
                saveUserData();
            }

            hideAuthSection();
            showSection('dashboard-section');
            updateUserInterface();
            showNotification('Login successful!', 'success');
        } else {
            showNotification('Please enter valid credentials', 'error');
        }
    }, 1000);
}

function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;

    // Simulate API call
    showLoading(true);
    setTimeout(() => {
        showLoading(false);
        
        // Store user data
        currentUser = {
            id: Date.now(),
            name: name,
            email: email,
            phone: phone
        };
        
        saveUserData();

        // Show success message and redirect to dashboard
        hideAuthSection();
        showSection('dashboard-section');
        updateUserInterface();
        showNotification('Account created successfully!', 'success');
    }, 1000);
}

function handleLogout() {
    currentUser = null;
    // Reset forms
    loginForm.reset();
    signupForm.reset();
    showSection('home-section');
    updateUserInterface();
    showNotification('Logged out successfully', 'info');
}

// User Interface Functions
function updateUserInterface() {
    if (currentUser) {
        // Show user menu, hide auth buttons
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('signupBtn').style.display = 'none';
        userMenu.style.display = 'flex';
        
        // Update user info
        userName.textContent = currentUser.name;
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Update dashboard
        updateDashboardGreeting();
    } else {
        // Show auth buttons, hide user menu
        document.getElementById('loginBtn').style.display = 'inline-flex';
        document.getElementById('signupBtn').style.display = 'inline-flex';
        userMenu.style.display = 'none';
    }
}

function updateDashboardGreeting() {
    const userName = currentUser ? currentUser.name : 'User';
    const dashboardGreeting = document.getElementById('dashboard-greeting');
    if (dashboardGreeting) {
        dashboardGreeting.textContent = `Welcome, ${userName}!`;
    }

    // Update user avatar with first letter of name
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && currentUser) {
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
}

// Section Navigation with Map Fixes
function showSection(sectionId) {
    console.log(`Showing section: ${sectionId}`);
    
    // Check if trying to access dashboard without login
    if ((sectionId === 'dashboard-section' || sectionId === 'booking-history') && !currentUser) {
        showAuthSection('login');
        return;
    }

    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update back button visibility
    updateBackButtonVisibility(sectionId);

    currentSection = sectionId;

    // Scroll to top of the page
    window.scrollTo(0, 0);

    // Section-specific initializations with proper timing
    setTimeout(() => {
        switch(sectionId) {
            case 'worker-list-section':
                populateWorkerList();
                break;
            case 'dashboard-section':
                loadBookingHistory();
                break;
            case 'rating-section':
                initializeRatingSection();
                break;
            case 'booking-section':
                // Ensure booking map is properly sized and visible
                if (currentWorker) {
                    setTimeout(() => {
                        initBookingMap(currentWorker.lat, currentWorker.lng);
                    }, 100);
                }
                break;
            case 'tracking-section':
                // Ensure tracking map is properly sized and visible
                setTimeout(() => {
                    initTrackingMap();
                }, 100);
                break;
        }
    }, 50);

    // Update section background based on current service
    changeSectionBackground(sectionId, currentService);
}

function updateBackButtonVisibility(sectionId) {
    if (sectionId === 'home-section') {
        backBtn.classList.remove('show');
    } else {
        backBtn.classList.add('show');
    }
}

function handleBackNavigation() {
    if (currentSection === 'find-worker-section' || 
        currentSection === 'worker-selection-section' || 
        currentSection === 'worker-list-section') {
        showSection('home-section');
    } else if (currentSection === 'booking-section') {
        showSection('worker-list-section');
    } else if (currentSection === 'tracking-section') {
        showSection('booking-section');
    } else {
        showSection('home-section');
    }
}

// Worker Management - Now loads workers based on user's location
function loadWorkers(userLat, userLng) {
    console.log('Loading workers data for user location...', userLat, userLng);
    
    // Generate workers based on user's location with realistic nearby areas
    const nearbyAreas = generateNearbyAreas(userLat, userLng);
    
    workers = [
        {
            id: 1,
            name: "Rajesh Kumar",
            specialty: "Plumbing",
            rating: 4.8,
            reviews: 127,
            price: "₹800",
            image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            currentLocation: nearbyAreas[0],
            transport: "Bike",
            eta: calculateDynamicETA(userLat, userLng, 0.5, 2),
            lat: userLat + (Math.random() * 0.02 - 0.01),
            lng: userLng + (Math.random() * 0.02 - 0.01),
            service: "plumbing"
        },
        {
            id: 2,
            name: "Amit Sharma",
            specialty: "Painting",
            rating: 4.6,
            reviews: 89,
            price: "₹1200",
            image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            currentLocation: nearbyAreas[1],
            transport: "Scooter",
            eta: calculateDynamicETA(userLat, userLng, 1, 3),
            lat: userLat + (Math.random() * 0.03 - 0.015),
            lng: userLng + (Math.random() * 0.03 - 0.015),
            service: "painting"
        },
        {
            id: 3,
            name: "Vikram Singh",
            specialty: "Electrical Work",
            rating: 4.9,
            reviews: 156,
            price: "₹1000",
            image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            currentLocation: nearbyAreas[2],
            transport: "Car",
            eta: calculateDynamicETA(userLat, userLng, 2, 5),
            lat: userLat + (Math.random() * 0.04 - 0.02),
            lng: userLng + (Math.random() * 0.04 - 0.02),
            service: "electrical"
        },
        {
            id: 4,
            name: "Sanjay Patel",
            specialty: "Shifting",
            rating: 4.7,
            reviews: 203,
            price: "₹1500",
            image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            currentLocation: nearbyAreas[3],
            transport: "Truck",
            eta: calculateDynamicETA(userLat, userLng, 3, 8),
            lat: userLat + (Math.random() * 0.05 - 0.025),
            lng: userLng + (Math.random() * 0.05 - 0.025),
            service: "shifting"
        },
        {
            id: 5,
            name: "Ramesh Joshi",
            specialty: "Carpentry",
            rating: 4.5,
            reviews: 94,
            price: "₹900",
            image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            currentLocation: nearbyAreas[4],
            transport: "Bike",
            eta: calculateDynamicETA(userLat, userLng, 1, 4),
            lat: userLat + (Math.random() * 0.035 - 0.0175),
            lng: userLng + (Math.random() * 0.035 - 0.0175),
            service: "carpentry"
        },
        {
            id: 6,
            name: "Deepak Verma",
            specialty: "General Repairs",
            rating: 4.7,
            reviews: 78,
            price: "₹700",
            image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            currentLocation: nearbyAreas[5],
            transport: "Scooter",
            eta: calculateDynamicETA(userLat, userLng, 0.3, 1.5),
            lat: userLat + (Math.random() * 0.015 - 0.0075),
            lng: userLng + (Math.random() * 0.015 - 0.0075),
            service: "other"
        }
    ];
    
    console.log(`Loaded ${workers.length} workers for current location`);
}

// Generate realistic nearby area names based on coordinates
function generateNearbyAreas(lat, lng) {
    // Common area name suffixes
    const suffixes = ['North', 'South', 'East', 'West', 'Central', 'Nagar', 'Pur', 'Vihar', 'Enclave'];
    const prefixes = ['Green', 'Sun', 'River', 'Lake', 'Mountain', 'City', 'Royal', 'Peace'];
    
    const areas = [];
    for (let i = 0; i < 6; i++) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        areas.push(`${prefix} ${suffix}`);
    }
    return areas;
}

// Calculate dynamic ETA based on distance from user
function calculateDynamicETA(userLat, userLng, minDistance, maxDistance) {
    // Calculate approximate distance (simplified)
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    
    // Base calculation with traffic factors
    const baseTime = distance * 12; // 12 minutes per km average
    const trafficFactor = 1.2 + (Math.random() * 0.4); // 20-60% traffic delay
    const prepTime = 5 + Math.random() * 5; // 5-10 minutes preparation
    
    return Math.max(10, Math.round((baseTime * trafficFactor) + prepTime));
}

function populateWorkerList() {
    const workersGrid = document.getElementById('workersGrid');
    if (!workersGrid) {
        console.error('Workers grid container not found');
        return;
    }

    workersGrid.innerHTML = '';

    // Filter workers by current service
    const filteredWorkers = workers.filter(worker => worker.service === currentService);

    // If no workers for current service, show all workers
    const workersToShow = filteredWorkers.length > 0 ? filteredWorkers : workers;

    workersToShow.forEach(worker => {
        const workerCard = document.createElement('div');
        workerCard.className = 'worker-card';
        workerCard.innerHTML = `
            <div class="worker-img" style="background-image: url('${worker.image}')"></div>
            <div class="worker-info">
                <div class="worker-name">${worker.name}</div>
                <div class="worker-specialty">${worker.specialty}</div>
                <div class="worker-rating">
                    <i class="fas fa-star"></i> ${worker.rating} (${worker.reviews} reviews)
                </div>
                <div class="worker-price">${worker.price}</div>
                <div style="margin-bottom: 1rem; font-size: 0.9rem;">
                    <i class="fas fa-clock"></i> Available Now • ETA: ${worker.eta} min
                </div>
                <button class="btn btn-primary book-worker-btn" data-worker-id="${worker.id}">
                    Book Immediately
                </button>
            </div>
        `;
        workersGrid.appendChild(workerCard);
    });

    // Add event listeners to book buttons
    document.querySelectorAll('.book-worker-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const workerId = e.target.getAttribute('data-worker-id');
            const worker = workers.find(w => w.id == workerId);

            if (worker) {
                bookWorker(worker);
            }
        });
    });
    
    console.log(`Populated ${workersToShow.length} workers in the grid`);
}

function bookWorker(worker) {
    console.log(`Booking worker: ${worker.name}`);
    
    if (!currentUser) {
        showAuthSection('login');
        showNotification('Please login to book a worker', 'info');
        return;
    }

    currentWorker = worker;

    // Update booking details
    document.getElementById('booking-worker-name').textContent = worker.name;
    document.getElementById('booking-worker-specialty').textContent = worker.specialty;
    document.getElementById('booking-service').textContent = worker.specialty;
    document.getElementById('booking-charges').textContent = worker.price;

    // Set current time
    const now = new Date();
    document.getElementById('booking-time').textContent =
        'Right Now (' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')';

    // Update tracking details
    document.getElementById('tracking-worker-name').textContent = worker.name;
    document.getElementById('tracking-worker-specialty').textContent = worker.specialty;
    document.getElementById('eta-time').textContent = worker.eta;
    document.getElementById('worker-location').textContent = worker.currentLocation;
    document.getElementById('transport-mode').textContent = worker.transport;

    // Update rating section
    document.getElementById('rate-worker-name').textContent = worker.name;

    // Show booking section first
    showSection('booking-section');

    // Initialize booking map after section is visible
    setTimeout(() => {
        initBookingMap(worker.lat, worker.lng);
    }, 300);
}

// Fixed Map Functions
function initBookingMap(workerLat, workerLng) {
    console.log('Initializing booking map...');
    
    const mapContainer = document.getElementById('booking-map');
    if (!mapContainer) {
        console.error('Booking map container not found');
        return;
    }

    // Show loading state
    const loadingElement = mapContainer.querySelector('.location-loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }

    // Clear existing map
    if (bookingMap) {
        console.log('Removing existing booking map');
        bookingMap.remove();
        bookingMap = null;
    }

    // Ensure container is visible and has proper dimensions
    mapContainer.style.display = 'block';
    mapContainer.style.height = '300px';
    mapContainer.style.minHeight = '300px';

    // Small delay to ensure DOM is ready and visible
    setTimeout(() => {
        try {
            console.log('Creating new booking map...');
            
            // Use user location if available, otherwise use worker location
            const centerLat = userLocation ? userLocation.lat : workerLat;
            const centerLng = userLocation ? userLocation.lng : workerLng;

            // Initialize map with proper options
            bookingMap = L.map('booking-map', {
                zoomControl: true,
                attributionControl: true,
                preferCanvas: true
            }).setView([centerLat, centerLng], 13);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(bookingMap);

            // Create custom icons
            const workerIcon = L.divIcon({
                className: 'worker-marker',
                html: '<i class="fas fa-hard-hat"></i>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            const homeIcon = L.divIcon({
                className: 'home-marker',
                html: '<i class="fas fa-home"></i>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            // Add worker marker
            L.marker([workerLat, workerLng], { icon: workerIcon })
                .addTo(bookingMap)
                .bindPopup('<strong>Worker Location</strong><br>Available for service')
                .openPopup();

            // Add user location marker if available
            if (userLocation) {
                L.marker([userLocation.lat, userLocation.lng], { icon: homeIcon })
                    .addTo(bookingMap)
                    .bindPopup('<strong>Your Location</strong>')
                    .openPopup();

                // Fit map to show both markers
                const bounds = L.latLngBounds([
                    [workerLat, workerLng],
                    [userLocation.lat, userLocation.lng]
                ]);
                bookingMap.fitBounds(bounds, { padding: [20, 20] });
                
                // Calculate initial route
                calculateInitialRoute(workerLat, workerLng, userLocation.lat, userLocation.lng);
            }

            // Hide loading state
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Trigger resize to ensure map renders properly
            setTimeout(() => {
                if (bookingMap) {
                    console.log('Invalidating booking map size');
                    bookingMap.invalidateSize(true);
                }
            }, 200);

            console.log('Booking map initialized successfully');

        } catch (error) {
            console.error('Error initializing booking map:', error);
            if (loadingElement) {
                loadingElement.innerHTML = '<p>Error loading map. Please refresh the page.</p>';
            }
        }
    }, 100);
}

function calculateInitialRoute(workerLat, workerLng, userLat, userLng) {
    if (!bookingMap) return;

    // Remove existing routing control
    if (routingControl) {
        bookingMap.removeControl(routingControl);
    }

    // Initialize routing control
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(workerLat, workerLng),
            L.latLng(userLat, userLng)
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        lineOptions: {
            styles: [{ color: '#4361ee', weight: 6, opacity: 0.8 }]
        },
        createMarker: function() { return null; },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false
    }).addTo(bookingMap);

    // Handle route found event
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
            const route = routes[0];
            
            // Store route coordinates for later use
            routeCoordinates = route.coordinates;
            
            // Calculate realistic ETA based on distance and traffic
            const distanceKm = (route.summary.totalDistance / 1000);
            const realisticETA = calculateRealisticETA(distanceKm, currentWorker.transport);
            
            // Update display
            document.getElementById('arrival-time').textContent = `Estimated arrival: ${realisticETA} minutes`;
            document.getElementById('eta-time').textContent = realisticETA;
            document.getElementById('distance').textContent = distanceKm.toFixed(1) + ' km';
            document.getElementById('route-time').textContent = realisticETA + ' min';
        }
    });
}

function initTrackingMap() {
    console.log('Initializing tracking map...');
    
    const mapContainer = document.getElementById('tracking-map');
    if (!mapContainer || !userLocation || !currentWorker) {
        console.error('Tracking map container or location data not available');
        return;
    }

    // Show loading state
    const loadingElement = mapContainer.querySelector('.location-loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }

    // Clear existing map and routing
    if (trackingMap) {
        console.log('Removing existing tracking map');
        trackingMap.remove();
        trackingMap = null;
    }
    if (routingControl) {
        routingControl.remove();
        routingControl = null;
    }

    // Ensure container is visible and has proper dimensions
    mapContainer.style.display = 'block';
    mapContainer.style.height = '400px';
    mapContainer.style.minHeight = '400px';

    // Small delay to ensure DOM is ready and visible
    setTimeout(() => {
        try {
            console.log('Creating new tracking map...');
            
            // Center map between worker and customer
            const centerLat = (currentWorker.lat + userLocation.lat) / 2;
            const centerLng = (currentWorker.lng + userLocation.lng) / 2;

            // Initialize map with proper options
            trackingMap = L.map('tracking-map', {
                zoomControl: true,
                attributionControl: true,
                preferCanvas: true
            }).setView([centerLat, centerLng], 12);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(trackingMap);

            // Create custom icons
            const workerIcon = L.divIcon({
                className: 'worker-marker',
                html: '<i class="fas fa-hard-hat"></i>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            const homeIcon = L.divIcon({
                className: 'home-marker',
                html: '<i class="fas fa-home"></i>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            // Add worker marker
            workerMarker = L.marker([currentWorker.lat, currentWorker.lng], { icon: workerIcon })
                .addTo(trackingMap)
                .bindPopup('<strong>Worker</strong><br>On the way to your location')
                .openPopup();

            // Add home marker
            homeMarker = L.marker([userLocation.lat, userLocation.lng], { icon: homeIcon })
                .addTo(trackingMap)
                .bindPopup('<strong>Your Location</strong>')
                .openPopup();

            // Calculate and display route with live tracking
            calculateLiveRoute();

            // Hide loading state
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Trigger resize to ensure map renders properly
            setTimeout(() => {
                if (trackingMap) {
                    console.log('Invalidating tracking map size');
                    trackingMap.invalidateSize(true);
                }
            }, 200);

            console.log('Tracking map initialized successfully');

        } catch (error) {
            console.error('Error initializing tracking map:', error);
            if (loadingElement) {
                loadingElement.innerHTML = '<p>Error loading map. Please refresh the page.</p>';
            }
        }
    }, 100);
}

function calculateLiveRoute() {
    if (!trackingMap || !currentWorker || !userLocation) return;

    // Remove existing routing control
    if (routingControl) {
        trackingMap.removeControl(routingControl);
    }

    // Initialize routing control
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(currentWorker.lat, currentWorker.lng),
            L.latLng(userLocation.lat, userLocation.lng)
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        lineOptions: {
            styles: [{ color: '#4361ee', weight: 6, opacity: 0.8 }]
        },
        createMarker: function() { return null; },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false
    }).addTo(trackingMap);

    // Handle route found event
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
            const route = routes[0];
            
            // Store route coordinates for animation
            routeCoordinates = route.coordinates;
            currentRouteIndex = 0;
            
            // Calculate realistic ETA and distance
            const distanceKm = (route.summary.totalDistance / 1000);
            const realisticETA = calculateRealisticETA(distanceKm, currentWorker.transport);
            
            // Update display
            document.getElementById('eta-time').textContent = realisticETA;
            document.getElementById('distance').textContent = distanceKm.toFixed(1) + ' km';
            document.getElementById('route-time').textContent = realisticETA + ' min';
            
            // Start realistic live tracking
            startRealisticTracking(realisticETA);
        }
    });
}

// Realistic timing calculations
function calculateRealisticETA(distanceKm, transport) {
    // Base speed in km/h based on transport type
    const baseSpeeds = {
        'Bike': 15,
        'Scooter': 20,
        'Car': 25,
        'Truck': 18
    };
    
    const baseSpeed = baseSpeeds[transport] || 20;
    
    // Calculate base time in minutes
    let baseTime = (distanceKm / baseSpeed) * 60;
    
    // Add preparation time (5-10 minutes)
    const prepTime = 5 + Math.random() * 5;
    
    // Add traffic factor (can add 20-50% time)
    const trafficFactor = 1.2 + (Math.random() * 0.3);
    
    // Add random delays (0-5 minutes)
    const randomDelay = Math.random() * 5;
    
    // Calculate final ETA
    const finalETA = Math.round((baseTime * trafficFactor) + prepTime + randomDelay);
    
    // Ensure minimum travel time of 10 minutes
    return Math.max(10, finalETA);
}

function startRealisticTracking(totalETA) {
    if (!routeCoordinates.length || !workerMarker) return;

    // Clear any existing interval
    if (moveInterval) {
        clearInterval(moveInterval);
    }

    const progressBar = document.querySelector('.progress');
    const totalPoints = routeCoordinates.length;
    let currentPoint = 0;
    
    // Convert ETA from minutes to milliseconds
    const totalTimeMs = totalETA * 60 * 1000;
    
    // Calculate points per interval for realistic movement
    const pointsPerInterval = Math.max(1, Math.floor(totalPoints / (totalTimeMs / REAL_WORLD_TIMING.MOVEMENT_INTERVAL)));
    
    // Add initial preparation time
    showNotification(`${currentWorker.name} is preparing to leave...`, 'info');
    
    setTimeout(() => {
        showNotification(`${currentWorker.name} is on the way!`, 'success');
        
        // Start movement after preparation
        moveInterval = setInterval(() => {
            if (currentPoint >= totalPoints) {
                clearInterval(moveInterval);
                // Worker has arrived
                setTimeout(() => {
                    showCompletion();
                }, 2000);
                return;
            }

            // Update worker position along the route
            const newPosition = routeCoordinates[currentPoint];
            workerMarker.setLatLng(newPosition);

            // Update progress
            const progress = (currentPoint / totalPoints) * 100;
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }

            // Update ETA based on progress (realistically)
            const remainingProgress = 100 - progress;
            const remainingETA = Math.max(1, Math.round((remainingProgress / 100) * totalETA));
            document.getElementById('eta-time').textContent = remainingETA;
            document.getElementById('route-time').textContent = remainingETA + ' min';

            // Add occasional small delays to simulate real traffic
            if (Math.random() < 0.1) { // 10% chance of small delay
                const delay = REAL_WORLD_TIMING.TRAFFIC_DELAYS[Math.floor(Math.random() * REAL_WORLD_TIMING.TRAFFIC_DELAYS.length)];
                if (delay > 0) {
                    console.log(`Traffic delay: ${delay/1000} seconds`);
                }
            }

            currentPoint += pointsPerInterval;
        }, REAL_WORLD_TIMING.MOVEMENT_INTERVAL);
        
    }, REAL_WORLD_TIMING.PREP_TIME);
}

// Booking and Tracking Functions
function handleBookingConfirmation() {
    console.log('Confirming booking...');
    
    if (!userLocation) {
        showNotification("Please allow location access to continue with booking.", "error");
        return;
    }

    if (!currentUser) {
        showAuthSection('login');
        return;
    }

    // Create booking record
    const booking = {
        id: Date.now(),
        workerId: currentWorker.id,
        workerName: currentWorker.name,
        service: currentWorker.specialty,
        price: currentWorker.price,
        date: new Date().toISOString(),
        status: 'in-progress'
    };
    
    userBookings.push(booking);
    saveUserData();

    // Show live tracking section
    showSection('tracking-section');
    
    showNotification('Worker booked successfully! Tracking started.', 'success');
}

function handleCallWorker() {
    showNotification('Calling worker... This would connect to the worker\'s phone in a real application.', 'info');
}

// Enhanced Location Functions with Reverse Geocoding
function getUserLocation() {
    console.log('Getting user location...');
    
    if (!navigator.geolocation) {
        showNotification("Geolocation is not supported by this browser.", "error");
        // Use IP-based location fallback
        getLocationByIP();
        return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log('User location obtained:', userLocation);
            
            // Get address from coordinates
            getAddressFromCoordinates(userLocation.lat, userLocation.lng);
            
            // Load workers for this location
            loadWorkers(userLocation.lat, userLocation.lng);
            
            // Start watching position for live updates
            startWatchingLocation();
        },
        (error) => {
            console.error("Error getting location:", error);
            // Use IP-based location fallback
            getLocationByIP();
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

// Fallback: Get location by IP address
function getLocationByIP() {
    console.log('Getting location by IP...');
    
    showNotification("Getting your approximate location...", "info");
    
    // Using a free IP geolocation service
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            userLocation = {
                lat: data.latitude,
                lng: data.longitude
            };
            userAddress = `${data.city}, ${data.region}, ${data.country_name}`;
            
            console.log('IP-based location obtained:', userLocation);
            updateAddressDisplay();
            
            // Load workers for this location
            loadWorkers(userLocation.lat, userLocation.lng);
        })
        .catch(error => {
            console.error("Error getting IP location:", error);
            // Final fallback - use a random major city in India
            const indianCities = [
                { name: "Delhi", lat: 28.6139, lng: 77.2090 },
                { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
                { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
                { name: "Chennai", lat: 13.0827, lng: 80.2707 },
                { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
                { name: "Pune", lat: 18.5204, lng: 73.8567 }
            ];
            
            const randomCity = indianCities[Math.floor(Math.random() * indianCities.length)];
            userLocation = { lat: randomCity.lat, lng: randomCity.lng };
            userAddress = `${randomCity.name}, India`;
            
            updateAddressDisplay();
            loadWorkers(userLocation.lat, userLocation.lng);
            
            showNotification(`Using ${randomCity.name} as default location. Please enable location services for accurate results.`, "info");
        });
}

// Get address from coordinates using reverse geocoding
function getAddressFromCoordinates(lat, lng) {
    // Using OpenStreetMap Nominatim API for reverse geocoding
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                const address = data.address;
                // Build a readable address
                let readableAddress = '';
                
                if (address.road) readableAddress += address.road + ', ';
                if (address.suburb) readableAddress += address.suburb + ', ';
                if (address.city) readableAddress += address.city + ', ';
                else if (address.town) readableAddress += address.town + ', ';
                else if (address.village) readableAddress += address.village + ', ';
                if (address.state) readableAddress += address.state;
                
                userAddress = readableAddress || 'Your current location';
            } else {
                userAddress = 'Your current location';
            }
            updateAddressDisplay();
        })
        .catch(error => {
            console.error("Error reverse geocoding:", error);
            userAddress = 'Your current location';
            updateAddressDisplay();
        });
}

function startWatchingLocation() {
    if (!navigator.geolocation) return;

    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update user location
            userLocation = newLocation;
            
            // Update home marker if it exists
            if (homeMarker) {
                homeMarker.setLatLng([newLocation.lat, newLocation.lng]);
            }
            
            // Update address display
            updateAddressDisplay();
        },
        (error) => {
            console.error("Error watching location:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

function updateAddressDisplay() {
    if (userAddress) {
        document.getElementById('booking-address').textContent = userAddress;
        document.getElementById('customer-location').textContent = userAddress;
        
        // Update location in UI elements
        const locationElements = document.querySelectorAll('.user-location-display');
        locationElements.forEach(element => {
            element.textContent = userAddress;
        });
    }
}

// Rating System
function initializeRatingSection() {
    selectedRating = 0;
    resetStarHighlight();
    document.getElementById('rating-value').textContent = '0';
    document.getElementById('review-comment').value = '';
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function resetStarHighlight() {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateRatingDisplay() {
    document.getElementById('rating-value').textContent = selectedRating;
}

function handleRatingSubmission() {
    if (selectedRating === 0) {
        showNotification('Please select a rating', 'error');
        return;
    }

    const comment = document.getElementById('review-comment').value;
    
    // In a real app, this would send the rating to the server
    showLoading(true);
    setTimeout(() => {
        showLoading(false);
        
        // Update worker rating (in a real app, this would be done on the server)
        if (currentWorker) {
            const worker = workers.find(w => w.id === currentWorker.id);
            if (worker) {
                // Simple average calculation for demo
                worker.rating = ((worker.rating * worker.reviews) + selectedRating) / (worker.reviews + 1);
                worker.reviews += 1;
            }
        }
        
        showNotification('Thank you for your rating!', 'success');
        showSection('dashboard-section');
    }, 1000);
}

// Booking History
function toggleBookingHistory() {
    const historySection = document.getElementById('bookingHistory');
    if (historySection.style.display === 'none') {
        historySection.style.display = 'block';
        loadBookingHistory();
    } else {
        historySection.style.display = 'none';
    }
}

function loadBookingHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (userBookings.length === 0) {
        historyList.innerHTML = '<p>No booking history found.</p>';
        return;
    }
    
    userBookings.forEach(booking => {
        const bookingItem = document.createElement('div');
        bookingItem.className = 'booking-item';
        
        const statusClass = `status-${booking.status}`;
        
        bookingItem.innerHTML = `
            <div class="booking-info">
                <h4>${booking.service} - ${booking.workerName}</h4>
                <div class="booking-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(booking.date).toLocaleDateString()}</span>
                    <span><i class="fas fa-clock"></i> ${new Date(booking.date).toLocaleTimeString()}</span>
                    <span><i class="fas fa-rupee-sign"></i> ${booking.price}</span>
                </div>
            </div>
            <div class="booking-status ${statusClass}">
                ${booking.status.replace('-', ' ')}
            </div>
        `;
        
        historyList.appendChild(bookingItem);
    });
}

// Form Handlers
function handleMultipleWorkerBooking(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAuthSection('login');
        return;
    }
    
    showLoading(true);
    setTimeout(() => {
        showLoading(false);
        showNotification('Your request for multiple workers has been submitted. Contractors will contact you shortly.', 'success');
        showSection('dashboard-section');
    }, 1500);
}

function handleContactForm(e) {
    e.preventDefault();
    
    showLoading(true);
    setTimeout(() => {
        showLoading(false);
        showNotification('Your message has been sent successfully! We will get back to you soon.', 'success');
        document.getElementById('contactForm').reset();
    }, 1500);
}

// Utility Functions
function changeBackground(service) {
    // Remove all service background classes
    document.body.classList.remove(...Object.values(serviceBackgrounds));

    // Add the new service background class
    document.body.classList.add(serviceBackgrounds[service] || serviceBackgrounds.default);

    // Update current service
    currentService = service;
}

function changeSectionBackground(sectionId, service) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Remove all section background classes
        section.classList.remove(...Object.values(sectionBackgrounds));

        // Add the new section background class
        section.classList.add(sectionBackgrounds[service] || sectionBackgrounds.default);
    }
}

function showCompletion() {
    document.getElementById('confirmed-worker').textContent =
        document.getElementById('tracking-worker-name').textContent;
    document.getElementById('confirmed-service').textContent =
        document.getElementById('tracking-worker-specialty').textContent;

    const now = new Date();
    document.getElementById('completion-time').textContent =
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    document.getElementById('total-charges').textContent =
        document.getElementById('booking-charges').textContent;

    // Update booking status to completed
    if (userBookings.length > 0) {
        userBookings[userBookings.length - 1].status = 'completed';
        saveUserData();
    }

    showSection('confirmation-section');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Data Persistence (localStorage for demo)
function saveUserData() {
    if (currentUser) {
        const userData = {
            user: currentUser,
            bookings: userBookings
        };
        localStorage.setItem('workersAppData', JSON.stringify(userData));
    }
}

function loadUserData() {
    const savedData = localStorage.getItem('workersAppData');
    if (savedData) {
        const data = JSON.parse(savedData);
        currentUser = data.user;
        userBookings = data.bookings || [];
        updateUserInterface();
    }
}

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
    }
    if (moveInterval) {
        clearInterval(moveInterval);
    }
});

// Export for debugging
window.workersApp = {
    currentUser,
    userLocation,
    currentWorker,
    bookingMap,
    trackingMap,
    showSection,
    initBookingMap,
    initTrackingMap
};

console.log('Workers.com JavaScript loaded successfully');