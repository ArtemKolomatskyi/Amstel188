// Booking data structure: { "dateString-chair": { name: string } }
// Example: { "2024-11-15-1": { name: "John" }, "2024-11-15-2": { name: "Jane" } }
let bookings = {};
let currentDate = new Date();
let database = null;
let isFirebaseReady = false;

// Day of week abbreviations
const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Initialize Firebase
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebaseConfig) {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            isFirebaseReady = true;
            console.log('Firebase initialized successfully');
            loadBookings();
        } else {
            console.warn('Firebase not configured. Using localStorage as fallback.');
            loadBookings();
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        console.warn('Falling back to localStorage');
        loadBookings();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
    setupEventListeners();
    renderCalendar();
});

// Load bookings from Firebase or localStorage
function loadBookings() {
    if (isFirebaseReady && database) {
        // Load from Firebase
        const bookingsRef = database.ref('bookings');
        bookingsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                bookings = data;
            } else {
                bookings = {};
            }
            renderCalendar();
        }, (error) => {
            console.error('Error loading bookings:', error);
            // Fallback to localStorage
            loadFromLocalStorage();
        });
    } else {
        // Fallback to localStorage
        loadFromLocalStorage();
    }
}

// Fallback: Load from localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('salonBookings');
    if (saved) {
        const loaded = JSON.parse(saved);
        // Migrate old format to new format if needed
        bookings = {};
        for (const [key, value] of Object.entries(loaded)) {
            if (value.chair !== undefined) {
                // Old format: { dateString: { name, chair } }
                const newKey = `${key}-${value.chair}`;
                bookings[newKey] = { name: value.name };
            } else {
                // New format: { "dateString-chair": { name } }
                bookings[key] = value;
            }
        }
        renderCalendar();
    }
}

// Get booking key for a specific date and chair
function getBookingKey(dateString, chair) {
    return `${dateString}-${chair}`;
}

// Get booking for a specific date and chair
function getBooking(dateString, chair) {
    return bookings[getBookingKey(dateString, chair)];
}

// Check if person has booking on this date (any chair)
function hasBookingOnDate(dateString, name) {
    for (let chair = 1; chair <= 5; chair++) {
        const booking = getBooking(dateString, chair);
        if (booking && booking.name === name) {
            return chair;
        }
    }
    return null;
}

// Get display name for chair/nails
function getChairDisplayName(chair) {
    if (chair === 5) {
        return 'Nails';
    }
    return `Chair ${chair}`;
}

// Save bookings to Firebase or localStorage
function saveBookings() {
    if (isFirebaseReady && database) {
        // Save to Firebase
        const bookingsRef = database.ref('bookings');
        bookingsRef.set(bookings)
            .then(() => {
                console.log('Bookings saved to Firebase');
            })
            .catch((error) => {
                console.error('Error saving to Firebase:', error);
                // Fallback to localStorage
                localStorage.setItem('salonBookings', JSON.stringify(bookings));
            });
    } else {
        // Fallback to localStorage
        localStorage.setItem('salonBookings', JSON.stringify(bookings));
    }
}

// Setup event listeners
function setupEventListeners() {
    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

// Render the calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonthYear').textContent = 
        `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Clear calendar body
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = '';
    
    // Create rows for each day
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dayAbbr = dayAbbreviations[dayOfWeek];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const row = document.createElement('tr');
        
        // Day cell
        const dayCell = document.createElement('td');
        dayCell.className = `day-cell ${isWeekend ? 'weekend' : ''}`;
        const dayInfo = document.createElement('div');
        dayInfo.className = 'day-info';
        
        const dayOfWeekSpan = document.createElement('span');
        dayOfWeekSpan.className = 'day-of-week';
        dayOfWeekSpan.textContent = dayAbbr;
        
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.className = 'day-number';
        dayNumberSpan.textContent = day;
        
        dayInfo.appendChild(dayOfWeekSpan);
        dayInfo.appendChild(dayNumberSpan);
        dayCell.appendChild(dayInfo);
        row.appendChild(dayCell);
        
        // Chair cells (including Nails)
        for (let chair = 1; chair <= 5; chair++) {
            const chairCell = createChairCell(year, month, day, chair);
            row.appendChild(chairCell);
        }
        
        calendarBody.appendChild(row);
    }
}

// Create a chair cell for a specific day and chair
function createChairCell(year, month, day, chair) {
    const cell = document.createElement('td');
    cell.className = 'chair-cell';
    
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const booking = getBooking(dateString, chair);
    
    // If this day is booked for this chair, show booking name
    if (booking) {
        cell.classList.add('booked', `chair-${chair}-bg`);
        const nameSpan = document.createElement('span');
        nameSpan.className = 'booking-name';
        nameSpan.textContent = booking.name;
        cell.appendChild(nameSpan);
    }
    
    // Add click handler
    cell.addEventListener('click', () => {
        handleCellClick(dateString, cell, booking, chair);
    });
    
    return cell;
}

// Handle cell click
function handleCellClick(dateString, cell, existingBooking, chair) {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    const ADMIN_NAME = 'Amstel188';
    
    if (!name) {
        alert('Please enter your name first!');
        return;
    }
    
    // If this specific chair is already booked
    if (existingBooking) {
        // If booked by someone else
        if (existingBooking.name !== name) {
            // Only admin can replace other people's bookings
            if (name === ADMIN_NAME) {
                if (!confirm(`This day is already booked by ${existingBooking.name} on ${getChairDisplayName(chair)}. Do you want to replace it?`)) {
                    return;
                }
            } else {
                // Regular users cannot replace other people's bookings
                alert(`${getChairDisplayName(chair)} is already booked by ${existingBooking.name}.`);
                return;
            }
        } else {
            // If booked by the same person on this chair, only admin can remove
            if (name !== ADMIN_NAME) {
                alert('Ask admin to remove your booking.');
                return;
            }
            // Admin can remove their own booking
            const bookingKey = getBookingKey(dateString, chair);
            delete bookings[bookingKey];
            cell.classList.remove('booked', `chair-${chair}-bg`);
            cell.innerHTML = '';
            saveBookings();
            renderCalendar();
            return;
        }
    }
    
    // Check if this day is already booked by the same person on a different chair
    const existingChair = hasBookingOnDate(dateString, name);
    if (existingChair && existingChair !== chair) {
        // Only admin can move/replace their own bookings
        if (name === ADMIN_NAME) {
            if (!confirm(`You already have this day booked on ${getChairDisplayName(existingChair)}. Do you want to move it to ${getChairDisplayName(chair)}?`)) {
                return;
            }
            // Remove from old chair
            const oldBookingKey = getBookingKey(dateString, existingChair);
            delete bookings[oldBookingKey];
            saveBookings();
            // Re-render to update the old chair's cell
            renderCalendar();
            return;
        } else {
            // Regular users cannot replace their own bookings
            alert(`You already have this day booked on ${getChairDisplayName(existingChair)}. Ask admin to change your booking.`);
            return;
        }
    }
    
    // Book the day (cell is empty or we're replacing with admin permission)
    const bookingKey = getBookingKey(dateString, chair);
    bookings[bookingKey] = {
        name: name
    };
    
    cell.classList.add('booked', `chair-${chair}-bg`);
    const nameSpan = document.createElement('span');
    nameSpan.className = 'booking-name';
    nameSpan.textContent = name;
    cell.innerHTML = '';
    cell.appendChild(nameSpan);
    
    saveBookings();
    
    // Re-render to update all cells (in case booking moved between chairs)
    renderCalendar();
}
