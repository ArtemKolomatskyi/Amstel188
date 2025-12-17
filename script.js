// Booking data structure: { "dateString-chair": { name: string, confirmed: boolean } }
// Confirmed bookings per person: { "name": { "dateString-chair": true } }
let bookings = {};
let confirmedBookings = {}; // Per person confirmed bookings
let selectedBookings = {}; // Temporary selections before confirmation
let currentDate = new Date();
let database = null;
let isFirebaseReady = false;
let currentChair = null; // Currently selected chair for multi-select

// Day of week abbreviations
const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ADMIN_NAME = 'Amstel188';

// Initialize Firebase
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebaseConfig) {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            isFirebaseReady = true;
            console.log('Firebase initialized successfully');
            loadBookings();
            loadConfirmedBookings();
        } else {
            console.warn('Firebase not configured. Using localStorage as fallback.');
            loadBookings();
            loadConfirmedBookings();
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        console.warn('Falling back to localStorage');
        loadBookings();
        loadConfirmedBookings();
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
        const bookingsRef = database.ref('bookings');
        bookingsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                bookings = data;
            } else {
                bookings = {};
            }
            renderCalendar();
        });
    } else {
        const saved = localStorage.getItem('salonBookings');
        if (saved) {
            bookings = JSON.parse(saved);
            renderCalendar();
        }
    }
}

// Load confirmed bookings (per person)
function loadConfirmedBookings() {
    if (isFirebaseReady && database) {
        const confirmedRef = database.ref('confirmedBookings');
        confirmedRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                confirmedBookings = data;
            } else {
                confirmedBookings = {};
            }
            renderCalendar();
        });
    } else {
        const saved = localStorage.getItem('confirmedBookings');
        if (saved) {
            confirmedBookings = JSON.parse(saved);
        }
    }
}

// Save confirmed bookings
function saveConfirmedBookings() {
    if (isFirebaseReady && database) {
        database.ref('confirmedBookings').set(confirmedBookings)
            .catch((error) => {
                console.error('Error saving confirmed bookings:', error);
                localStorage.setItem('confirmedBookings', JSON.stringify(confirmedBookings));
            });
    } else {
        localStorage.setItem('confirmedBookings', JSON.stringify(confirmedBookings));
    }
}

// Check if booking is confirmed for a person
function isBookingConfirmed(dateString, chair, name) {
    if (!confirmedBookings[name]) {
        return false;
    }
    const bookingKey = getBookingKey(dateString, chair);
    return confirmedBookings[name][bookingKey] === true;
}

// Check if user has any confirmed bookings this month
function hasConfirmedBookingsThisMonth(name) {
    if (!confirmedBookings[name]) {
        return false;
    }
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    for (const key in confirmedBookings[name]) {
        if (key.startsWith(monthPrefix)) {
            return true;
        }
    }
    return false;
}

// Update month status display
function updateMonthStatus() {
    const statusDiv = document.getElementById('monthStatus');
    const confirmBtn = document.getElementById('confirmMonthBtn');
    const nameInput = document.getElementById('nameInput');
    const name = nameInput ? nameInput.value.trim() : '';
    
    if (!name) {
        statusDiv.className = 'month-status';
        statusDiv.textContent = '';
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Enter your name to confirm';
        updateSelectedCount();
        return;
    }
    
    if (name === ADMIN_NAME) {
        statusDiv.className = 'month-status';
        statusDiv.textContent = 'Admin mode: You can only remove bookings, not create them.';
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Admin Mode';
        updateSelectedCount();
        return;
    }
    
    if (hasConfirmedBookingsThisMonth(name)) {
        statusDiv.className = 'month-status confirmed';
        statusDiv.textContent = `✓ Your bookings for this month are confirmed and locked. Only admin can make changes.`;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Your Bookings Confirmed';
    } else {
        statusDiv.className = 'month-status';
        statusDiv.textContent = '';
        confirmBtn.disabled = Object.keys(selectedBookings).length === 0;
        confirmBtn.textContent = 'Confirm My Bookings';
    }
    updateSelectedCount();
}

// Update selected count display
function updateSelectedCount() {
    const count = Object.keys(selectedBookings).length;
    const nameInput = document.getElementById('nameInput');
    const name = nameInput ? nameInput.value.trim() : '';
    const userNameDisplay = document.getElementById('userNameDisplay');
    const selectedCount = document.getElementById('selectedCount');
    
    if (name) {
        userNameDisplay.textContent = `${name}: `;
        userNameDisplay.style.display = 'inline';
    } else {
        userNameDisplay.textContent = '';
        userNameDisplay.style.display = 'none';
    }
    
    selectedCount.textContent = `${count} day${count !== 1 ? 's' : ''} selected`;
}

// Get booking key for a specific date and chair
function getBookingKey(dateString, chair) {
    return `${dateString}-${chair}`;
}

// Get booking for a specific date and chair
function getBooking(dateString, chair) {
    const key = getBookingKey(dateString, chair);
    // Return confirmed booking first, then selected booking
    if (bookings[key]) {
        return bookings[key];
    }
    return selectedBookings[key];
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
        database.ref('bookings').set(bookings)
            .then(() => {
                console.log('Bookings saved to Firebase');
            })
            .catch((error) => {
                console.error('Error saving to Firebase:', error);
                localStorage.setItem('salonBookings', JSON.stringify(bookings));
            });
    } else {
        localStorage.setItem('salonBookings', JSON.stringify(bookings));
    }
}

// Setup event listeners
function setupEventListeners() {
    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        selectedBookings = {};
        currentChair = null;
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        selectedBookings = {};
        currentChair = null;
        renderCalendar();
    });
    
    // Confirm month button
    document.getElementById('confirmMonthBtn').addEventListener('click', () => {
        confirmBookings();
    });
    
    // Update status when name changes
    const nameInput = document.getElementById('nameInput');
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            updateMonthStatus();
            updateSelectedCount();
            selectedBookings = {};
            currentChair = null;
            renderCalendar();
        });
    }
}

// Confirm bookings for current user
function confirmBookings() {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name first!');
        return;
    }
    
    if (name === ADMIN_NAME) {
        alert('Admin cannot create bookings. You can only remove existing bookings.');
        return;
    }
    
    if (Object.keys(selectedBookings).length === 0) {
        alert('Please select at least one day to book!');
        return;
    }
    
    if (!confirm(`Confirm ${Object.keys(selectedBookings).length} booking(s)? You won't be able to change them after confirmation.`)) {
        return;
    }
    
    // Check for conflicts
    const conflicts = [];
    for (const [key, booking] of Object.entries(selectedBookings)) {
        const existing = bookings[key];
        if (existing && existing.name !== name) {
            conflicts.push(key);
        }
    }
    
    if (conflicts.length > 0) {
        alert('Some days are already booked by others. Please select different days.');
        return;
    }
    
    // Initialize confirmed bookings for this person if needed
    if (!confirmedBookings[name]) {
        confirmedBookings[name] = {};
    }
    
    // Save all selected bookings and mark as confirmed
    for (const [key, booking] of Object.entries(selectedBookings)) {
        bookings[key] = { name: booking.name, confirmed: true };
        confirmedBookings[name][key] = true;
    }
    
    // Clear selections
    selectedBookings = {};
    currentChair = null;
    
    saveBookings();
    saveConfirmedBookings();
    renderCalendar();
    updateMonthStatus();
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
    
    // Update status after rendering
    setTimeout(() => {
        updateMonthStatus();
    }, 100);
}

// Create a chair cell for a specific day and chair
function createChairCell(year, month, day, chair) {
    const cell = document.createElement('td');
    cell.className = 'chair-cell';
    
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const booking = getBooking(dateString, chair);
    const bookingKey = getBookingKey(dateString, chair);
    const isSelected = selectedBookings[bookingKey] !== undefined;
    const nameInput = document.getElementById('nameInput');
    const currentName = nameInput ? nameInput.value.trim() : '';
    const isConfirmed = currentName && isBookingConfirmed(dateString, chair, currentName);
    
    // If this day is booked for this chair, show booking name
    if (booking) {
        cell.classList.add('booked', `chair-${chair}-bg`);
        const nameSpan = document.createElement('span');
        nameSpan.className = 'booking-name';
        nameSpan.textContent = booking.name;
        cell.appendChild(nameSpan);
    }
    
    // Show selection state
    if (isSelected) {
        cell.classList.add('selected');
    }
    
    // Add click handler
    cell.addEventListener('click', () => {
        if (isConfirmed && currentName !== ADMIN_NAME) {
            // Booking is confirmed - only admin can modify
            handleConfirmedCellClick(dateString, cell, booking, chair);
        } else {
            // Booking not confirmed or admin - allow selection/removal
            handleCellClick(dateString, cell, booking, chair);
        }
    });
    
    return cell;
}

// Handle cell click (for unconfirmed bookings)
function handleCellClick(dateString, cell, existingBooking, chair) {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name first!');
        return;
    }
    
    // Admin cannot book, only remove
    if (name === ADMIN_NAME) {
        if (existingBooking) {
            if (!confirm(`Remove booking by ${existingBooking.name} on ${getChairDisplayName(chair)}?`)) {
                return;
            }
            const bookingKey = getBookingKey(dateString, chair);
            delete bookings[bookingKey];
            // Remove from confirmed bookings if it was confirmed
            if (existingBooking.name && confirmedBookings[existingBooking.name]) {
                delete confirmedBookings[existingBooking.name][bookingKey];
            }
            saveBookings();
            saveConfirmedBookings();
            renderCalendar();
        }
        return;
    }
    
    // Check if user's bookings are confirmed
    if (isBookingConfirmed(dateString, chair, name)) {
        alert('This booking is confirmed and locked. Only admin can remove it.');
        return;
    }
    
    const bookingKey = getBookingKey(dateString, chair);
    const isSelected = selectedBookings[bookingKey] !== undefined;
    
    // If already booked by someone else, can't select
    if (bookings[bookingKey]) {
        if (bookings[bookingKey].name !== name) {
            alert(`${getChairDisplayName(chair)} is already booked by ${bookings[bookingKey].name}.`);
            return;
        }
        // If it's their own booking but not confirmed, they can deselect it
        if (bookings[bookingKey].name === name && !isBookingConfirmed(dateString, chair, name)) {
            // Allow removing their own unconfirmed booking
            delete bookings[bookingKey];
            saveBookings();
            renderCalendar();
            return;
        }
    }
    
    // Set current chair if not set
    if (!currentChair) {
        currentChair = chair;
    }
    
    // Only allow selecting same chair
    if (currentChair !== chair) {
        alert(`Please select days for ${getChairDisplayName(currentChair)} only. Clear selections to choose a different chair.`);
        return;
    }
    
    // Toggle selection
    if (isSelected) {
        // Deselect
        delete selectedBookings[bookingKey];
        cell.classList.remove('selected');
    } else {
        // Select
        selectedBookings[bookingKey] = { name: name };
        cell.classList.add('selected');
    }
    
    updateSelectedCount();
    updateMonthStatus();
    renderCalendar();
}

// Handle cell click for confirmed bookings (admin only)
function handleConfirmedCellClick(dateString, cell, existingBooking, chair) {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name first!');
        return;
    }
    
    // Only admin can modify confirmed bookings
    if (name !== ADMIN_NAME) {
        alert('This booking is confirmed and locked. Only admin can make changes.');
        return;
    }
    
    // Admin can remove bookings
    if (existingBooking) {
        if (!confirm(`Remove booking by ${existingBooking.name} on ${getChairDisplayName(chair)}?`)) {
            return;
        }
        const bookingKey = getBookingKey(dateString, chair);
        delete bookings[bookingKey];
        // Remove from confirmed bookings
        if (existingBooking.name && confirmedBookings[existingBooking.name]) {
            delete confirmedBookings[existingBooking.name][bookingKey];
        }
        saveBookings();
        saveConfirmedBookings();
        renderCalendar();
    }
}
