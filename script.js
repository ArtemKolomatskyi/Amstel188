// Booking data structure: { "dateString-chair": { name: string, confirmed: boolean } }
// Confirmed bookings per person: { "name": { "dateString-chair": true } }
let bookings = {};
let confirmedBookings = {}; // Legacy object (no longer used for locking)
let selectedBookings = {}; // Legacy (no longer drives saving)
let currentDate = new Date();
let database = null;
let isFirebaseReady = false;
let currentChair = null; // Legacy
let changeLog = []; // List of all add/remove actions
let users = []; // Managed client names (admin only)
let isAdmin = false; // True when correct password entered
let currentClientName = null; // Selected client for whom admin creates bookings
let pendingBookings = {}; // Draft (unconfirmed) bookings: { key: { name, createdAt } }

// Day of week abbreviations
const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ADMIN_PASSWORD = 'Amstel 188';

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
            loadChangeLog();
            loadUsers();
            loadPendingBookings();
        } else {
            console.warn('Firebase not configured. Using localStorage as fallback.');
            loadBookings();
            loadConfirmedBookings();
            loadChangeLog();
            loadUsers();
            loadPendingBookings();
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        console.warn('Falling back to localStorage');
        loadBookings();
        loadConfirmedBookings();
        loadChangeLog();
        loadUsers();
        loadPendingBookings();
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
            renderAdminLog();
        });
    } else {
        const saved = localStorage.getItem('salonBookings');
        if (saved) {
            bookings = JSON.parse(saved);
            renderCalendar();
            renderAdminLog();
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

// Load change log
function loadChangeLog() {
    if (isFirebaseReady && database) {
        const logRef = database.ref('changeLog');
        logRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (Array.isArray(data)) {
                changeLog = data;
            } else {
                changeLog = [];
            }
            renderAdminLog();
        });
    } else {
        const saved = localStorage.getItem('bookingChangeLog');
        if (saved) {
            try {
                changeLog = JSON.parse(saved);
            } catch {
                changeLog = [];
            }
        }
        renderAdminLog();
    }
}

// Load pending (draft) bookings
function loadPendingBookings() {
    if (isFirebaseReady && database) {
        const pendingRef = database.ref('pendingBookings');
        pendingRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                pendingBookings = data;
            } else {
                pendingBookings = {};
            }
            cleanupExpiredDrafts(false);
            renderCalendar();
            renderAdminLog();
        });
    } else {
        const saved = localStorage.getItem('pendingBookings');
        if (saved) {
            try {
                pendingBookings = JSON.parse(saved);
            } catch {
                pendingBookings = {};
            }
        }
        cleanupExpiredDrafts(false);
        renderCalendar();
        renderAdminLog();
    }
}

// Remove expired draft bookings (older than 5 minutes)
function cleanupExpiredDrafts(saveAfter = true) {
    const now = Date.now();
    const maxAgeMs = 5 * 60 * 1000;
    let changed = false;

    for (const [key, pending] of Object.entries(pendingBookings)) {
        if (!pending || !pending.createdAt) continue;
        const created = Date.parse(pending.createdAt);
        if (Number.isNaN(created)) continue;
        if (now - created > maxAgeMs) {
            // Draft expired
            const [dateString, chairStr] = key.split('-');
            const chair = parseInt(chairStr, 10) || 1;
            addLogEntry('expire_draft', dateString, chair, pending.name, pending.name);
            delete pendingBookings[key];
            changed = true;
        }
    }

    if (changed && saveAfter) {
        savePendingBookings();
    }
}

// Load users list
function loadUsers() {
    if (isFirebaseReady && database) {
        const usersRef = database.ref('users');
        usersRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (Array.isArray(data)) {
                users = data;
            } else if (data && typeof data === 'object') {
                users = Object.values(data);
            } else {
                users = [];
            }
            renderUserManager();
            renderUserManagement();
            updateSelectedCount();
        });
    } else {
        const saved = localStorage.getItem('bookingUsers');
        if (saved) {
            try {
                users = JSON.parse(saved);
            } catch {
                users = [];
            }
        }
        if (!Array.isArray(users)) {
            users = [];
        }
        renderUserManager();
        renderUserManagement();
        updateSelectedCount();
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

// Save change log
function saveChangeLog() {
    if (isFirebaseReady && database) {
        database.ref('changeLog').set(changeLog)
            .catch(() => {
                localStorage.setItem('bookingChangeLog', JSON.stringify(changeLog));
            });
    } else {
        localStorage.setItem('bookingChangeLog', JSON.stringify(changeLog));
    }
}

// Save users list
function saveUsers() {
    if (isFirebaseReady && database) {
        database.ref('users').set(users)
            .catch(() => {
                localStorage.setItem('bookingUsers', JSON.stringify(users));
            });
    } else {
        localStorage.setItem('bookingUsers', JSON.stringify(users));
    }
}

// Save pending (draft) bookings
function savePendingBookings() {
    if (isFirebaseReady && database) {
        database.ref('pendingBookings').set(pendingBookings)
            .catch(() => {
                localStorage.setItem('pendingBookings', JSON.stringify(pendingBookings));
            });
    } else {
        localStorage.setItem('pendingBookings', JSON.stringify(pendingBookings));
    }
}

// Add entry to change log
function addLogEntry(action, dateString, chair, actorName, bookingName) {
    const entry = {
        timestamp: new Date().toISOString(),
        action, // 'add' | 'remove'
        date: dateString,
        chair,
        actor: actorName,
        name: bookingName
    };
    changeLog.push(entry);
    // Keep log from growing forever
    if (changeLog.length > 500) {
        changeLog = changeLog.slice(changeLog.length - 500);
    }
    saveChangeLog();
    renderAdminLog();
}

// Render admin log (only visible in admin mode)
function renderAdminLog() {
    const container = document.getElementById('adminLogContainer');
    const list = document.getElementById('adminLog');
    const stats = document.getElementById('adminStats');
    if (!container || !list || !stats) return;

    if (!isAdmin) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // --- Month summary (based on bookings, not just log) ---
    const perNameCounts = {};
    const freePerChair = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Count bookings per name for this month
    for (const [key, booking] of Object.entries(bookings)) {
        if (!booking || !key.startsWith(monthPrefix)) continue;
        const name = booking.name || 'Unknown';
        perNameCounts[name] = (perNameCounts[name] || 0) + 1;
    }

    // Count free slots per chair for this month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        for (let chair = 1; chair <= 5; chair++) {
            const key = getBookingKey(dateString, chair);
            if (!bookings[key]) {
                freePerChair[chair] = (freePerChair[chair] || 0) + 1;
            }
        }
    }

    // Filter log entries to current month only
    const entriesForMonth = changeLog
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.date && entry.date.startsWith(monthPrefix));

    const summaryHtmlParts = [];
    summaryHtmlParts.push('<div class="admin-log-summary-block"><strong>Bookings per name (this month):</strong>');
    if (Object.keys(perNameCounts).length === 0) {
        summaryHtmlParts.push('<div>No bookings yet this month.</div>');
    } else {
        summaryHtmlParts.push('<ul>');
        Object.keys(perNameCounts).sort().forEach((name) => {
            summaryHtmlParts.push(`<li>${name}: ${perNameCounts[name]} day(s)</li>`);
        });
        summaryHtmlParts.push('</ul>');
    }
    summaryHtmlParts.push('</div>');

    summaryHtmlParts.push('<div class="admin-log-summary-block"><strong>Free slots per chair (this month):</strong><ul>');
    for (let chair = 1; chair <= 5; chair++) {
        const label = getChairDisplayName(chair);
        summaryHtmlParts.push(`<li>${label}: ${freePerChair[chair]} free slot(s)</li>`);
    }
    summaryHtmlParts.push('</ul></div>');

    stats.innerHTML = summaryHtmlParts.join('');

    if (!entriesForMonth.length) {
        list.innerHTML = '<div class="admin-log-entry">No changes recorded yet for this month.</div>';
        return;
    }

    const rows = entriesForMonth
        .slice()
        .reverse()
        .map(({ entry, index }) => {
            const time = new Date(entry.timestamp).toLocaleString();
            const chairLabel = getChairDisplayName(entry.chair);
            const actionClass = entry.action === 'add' ? 'log-action-add' : 'log-action-remove';
            const actionText = entry.action === 'add' ? 'added' : 'removed';
            return `
                <div class="admin-log-entry" data-log-index="${index}">
                    <span class="log-time">${time}</span>
                    <span class="${actionClass}">${actionText}</span>
                    <span>${entry.name}</span>
                    <span>on ${entry.date} (${chairLabel})</span>
                    <span>by ${entry.actor}</span>
                    <button class="log-delete-btn" title="Remove this log entry">×</button>
                </div>
            `;
        })
        .join('');

    list.innerHTML = rows;

    // Attach delete handlers
    Array.from(list.querySelectorAll('.log-delete-btn')).forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const parent = btn.closest('.admin-log-entry');
            if (!parent) return;
            const index = parseInt(parent.getAttribute('data-log-index'), 10);
            if (Number.isNaN(index)) return;

            if (!confirm('Remove this log entry?')) {
                return;
            }

            changeLog.splice(index, 1);
            saveChangeLog();
            renderAdminLog();
        });
    });
}

// Render user manager (chips are always visible; adding names is admin-only)
function renderUserManager() {
    const list = document.getElementById('userList');
    if (!list) return;

    if (!users || users.length === 0) {
        list.innerHTML = '<span style="font-size:0.85rem;color:#777;">No names yet. Ask admin to add one at the bottom.</span>';
        return;
    }

    list.innerHTML = users.map((u) => {
        const name = typeof u === 'string' ? u : u.name;
        const isSelected = currentClientName === name;
        const classes = ['user-chip'];
        if (isSelected) {
            classes.push('selected');
        }
        return `<span class="${classes.join(' ')}" data-user="${name}">${name}</span>`;
    }).join('');

    // Attach click handlers
    Array.from(list.querySelectorAll('.user-chip')).forEach((chip) => {
        chip.addEventListener('click', () => {
            const name = chip.getAttribute('data-user');

            // If admin is logged in, allow optional removal of a name
            if (isAdmin) {
                const remove = confirm(`Do you want to remove the name "${name}"?\nPress OK to remove, or Cancel to just select this name.`);
                if (remove) {
                    // Remove name from list
                    users = users.filter((u) => (typeof u === 'string' ? u !== name : u.name !== name));
                    // If we were showing bookings for this name, clear selection
                    if (currentClientName === name) {
                        currentClientName = null;
                    }
                    saveUsers();
                    renderUserManager();
                    updateSelectedCount();
                    updateMonthStatus();
                    return;
                }
            }

            // Normal behaviour: select this name for booking (requires password)
            const userObj = users.find((u) => (typeof u === 'string' ? u === name : u.name === name));
            const expectedPassword = typeof userObj === 'string' ? '' : userObj?.password || '';
            if (expectedPassword) {
                const entered = prompt(`Enter password for ${name}:`);
                if (entered !== expectedPassword) {
                    alert('Incorrect password.');
                    return;
                }
            }
            currentClientName = name;
            updateSelectedCount();
            updateMonthStatus();
            renderUserManager();
        });
    });
}

// Render user management section for admin (shows all users with passwords and management options)
function renderUserManagement() {
    const container = document.getElementById('adminUserManagement');
    const list = document.getElementById('userManagementList');
    if (!container || !list) return;

    if (!isAdmin) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    if (users.length === 0) {
        list.innerHTML = '<p>No users created yet. Add users using the form above.</p>';
        return;
    }

    let html = '<div class="user-management-table">';
    html += '<div class="user-management-header">';
    html += '<div class="user-mgmt-col-name">Name</div>';
    html += '<div class="user-mgmt-col-password">Password</div>';
    html += '<div class="user-mgmt-col-actions">Actions</div>';
    html += '</div>';

    users.forEach((user, index) => {
        html += `<div class="user-management-row" data-index="${index}">`;
        html += `<div class="user-mgmt-col-name"><strong>${escapeHtml(user.name)}</strong></div>`;
        html += `<div class="user-mgmt-col-password"><code>${escapeHtml(user.password || '(no password)')}</code></div>`;
        html += '<div class="user-mgmt-col-actions">';
        html += `<button class="user-mgmt-btn rename-btn" onclick="handleRenameUser(${index})">Rename</button>`;
        html += `<button class="user-mgmt-btn change-password-btn" onclick="handleChangePassword(${index})">Change Password</button>`;
        html += `<button class="user-mgmt-btn remove-btn" onclick="handleRemoveUser(${index})">Remove</button>`;
        html += '</div>';
        html += '</div>';
    });

    html += '</div>';
    list.innerHTML = html;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle rename user
function handleRenameUser(index) {
    if (!isAdmin) return;
    if (index < 0 || index >= users.length) return;

    const oldName = users[index].name;
    const newName = prompt(`Enter new name for "${oldName}":`, oldName);
    
    if (!newName || newName.trim() === '') {
        return;
    }

    const trimmedName = newName.trim();
    
    // Check if name already exists (except for current user)
    if (users.some((u, i) => i !== index && u.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert('A user with this name already exists.');
        return;
    }

    // Update all bookings with the old name to the new name
    for (const [key, booking] of Object.entries(bookings)) {
        if (booking && booking.name === oldName) {
            bookings[key].name = trimmedName;
        }
    }

    // Update pending bookings
    for (const [key, pending] of Object.entries(pendingBookings)) {
        if (pending && pending.name === oldName) {
            pendingBookings[key].name = trimmedName;
        }
    }

    // Update change log
    changeLog.forEach(entry => {
        if (entry.name === oldName) {
            entry.name = trimmedName;
        }
        if (entry.actor === oldName) {
            entry.actor = trimmedName;
        }
    });

    // If this was the currently selected user, update it
    if (currentClientName === oldName) {
        currentClientName = trimmedName;
    }

    // Update the user name
    users[index].name = trimmedName;
    
    saveUsers();
    saveBookings();
    savePendingBookings();
    saveChangeLog();
    
    renderCalendar();
    renderUserManager();
    renderUserManagement();
    updateSelectedCount();
    
    alert(`User "${oldName}" has been renamed to "${trimmedName}". All bookings and logs have been updated.`);
}

// Handle change password
function handleChangePassword(index) {
    if (!isAdmin) return;
    if (index < 0 || index >= users.length) return;

    const userName = users[index].name;
    const newPassword = prompt(`Enter new password for "${userName}":`, users[index].password || '');
    
    if (newPassword === null) {
        return; // User cancelled
    }

    users[index].password = newPassword.trim();
    saveUsers();
    renderUserManagement();
    
    alert(`Password for "${userName}" has been updated.`);
}

// Handle remove user
function handleRemoveUser(index) {
    if (!isAdmin) return;
    if (index < 0 || index >= users.length) return;

    const userName = users[index].name;
    
    if (!confirm(`Are you sure you want to remove user "${userName}"?\n\nThis will remove the user, but their bookings will remain in the calendar.`)) {
        return;
    }

    // Remove the user
    users.splice(index, 1);
    
    // If this was the currently selected user, clear selection
    if (currentClientName === userName) {
        currentClientName = null;
    }
    
    saveUsers();
    renderUserManager();
    renderUserManagement();
    updateSelectedCount();
    renderCalendar();
    
    alert(`User "${userName}" has been removed.`);
}

// Update month status display
function updateMonthStatus() {
    const statusDiv = document.getElementById('monthStatus');
    const confirmBtn = document.getElementById('confirmMonthBtn');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminUserControls = document.getElementById('adminUserControls');
    const password = adminPasswordInput ? adminPasswordInput.value.trim() : '';
    
    // Determine admin mode based on password
    isAdmin = password === ADMIN_PASSWORD;

    // For normal users, keep header quiet – only show selected name counts
    if (!isAdmin) {
        statusDiv.className = 'month-status';
        statusDiv.textContent = '';
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = '';
        }
        if (adminUserControls) {
            adminUserControls.style.display = 'none';
        }
    } else {
        // Admin mode: subtle hint only
        if (!currentClientName) {
            statusDiv.className = 'month-status';
            statusDiv.textContent = 'Admin: select a name chip to manage bookings.';
        } else {
            statusDiv.className = 'month-status confirmed';
            statusDiv.textContent = `Admin: managing bookings for ${currentClientName}.`;
        }
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = '';
        }
        if (adminUserControls) {
            adminUserControls.style.display = 'block';
        }
    }
    updateSelectedCount();
    renderAdminLog();
    renderUserManager();
    renderUserManagement();
    
    // Show/hide user management section
    const adminUserManagement = document.getElementById('adminUserManagement');
    if (adminUserManagement) {
        adminUserManagement.style.display = isAdmin ? 'block' : 'none';
    }
}

// Update selected count display
function updateSelectedCount() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const selectedCount = document.getElementById('selectedCount');
    
    if (!currentClientName) {
        if (userNameDisplay) {
            userNameDisplay.textContent = '';
            userNameDisplay.style.display = 'none';
        }
        selectedCount.textContent = 'No client selected';
        return;
    }

    userNameDisplay.textContent = `${currentClientName}: `;
    userNameDisplay.style.display = 'inline';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    let confirmedCount = 0;
    for (const [key, booking] of Object.entries(bookings)) {
        if (!booking || booking.name !== currentClientName) continue;
        if (key.startsWith(monthPrefix)) {
            confirmedCount++;
        }
    }

    let draftCount = 0;
    for (const [key, pending] of Object.entries(pendingBookings)) {
        if (!pending || pending.name !== currentClientName) continue;
        if (key.startsWith(monthPrefix)) {
            draftCount++;
        }
    }

    if (draftCount > 0) {
        selectedCount.textContent = `${confirmedCount} confirmed, ${draftCount} draft day${draftCount !== 1 ? 's' : ''} this month`;
    } else {
        selectedCount.textContent = `${confirmedCount} working day${confirmedCount !== 1 ? 's' : ''} this month`;
    }
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
    
    // Update status when admin password changes
    const adminPasswordInput = document.getElementById('adminPassword');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('input', () => {
            updateMonthStatus();
            updateSelectedCount();
            selectedBookings = {};
            renderCalendar();
        });
    }

    // Add user button
    const addUserBtn = document.getElementById('addUserBtn');
    const newUserInput = document.getElementById('newUserInput');
    const newUserPasswordInput = document.getElementById('newUserPassword');
    if (addUserBtn && newUserInput && newUserPasswordInput) {
        addUserBtn.addEventListener('click', () => {
            if (!isAdmin) {
                alert('Enter the admin password at the bottom before adding names.');
                return;
            }
            const name = newUserInput.value.trim();
            const password = newUserPasswordInput.value.trim();
            if (!name || !password) return;
            if (users.some((u) => (typeof u === 'string' ? u === name : u.name === name))) {
                alert('This client name already exists.');
                return;
            }
            users.push({ name, password });
            saveUsers();
            newUserInput.value = '';
            newUserPasswordInput.value = '';
            currentClientName = name;
            renderUserManager();
            renderUserManagement();
            updateSelectedCount();
            updateMonthStatus();
        });
    }
}

// Legacy confirmBookings function no longer used (confirmation step removed)
function confirmBookings() {}

// Confirm all draft bookings for the current user in the current month
function confirmCurrentUserDrafts() {
    if (!currentClientName) {
        alert('Select your name first.');
        return;
    }

    const actor = currentClientName;

    let confirmedCount = 0;
    for (const [key, pending] of Object.entries(pendingBookings)) {
        if (!pending || pending.name !== currentClientName) continue;
        // Move draft to confirmed bookings
        bookings[key] = { name: currentClientName };
        delete pendingBookings[key];
        confirmedCount++;
        const [dateString, chairStr] = key.split('-');
        const chair = parseInt(chairStr, 10) || 1;
        addLogEntry('confirm', dateString, chair, actor, currentClientName);
    }

    if (confirmedCount === 0) {
        alert('You have no draft days to confirm this month.');
        return;
    }

    saveBookings();
    savePendingBookings();
    renderCalendar();
    updateSelectedCount();
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
        renderAdminLog();
    }, 100);
}

// Create a chair cell for a specific day and chair
function createChairCell(year, month, day, chair) {
    const cell = document.createElement('td');
    cell.className = 'chair-cell';
    
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Mark weekend cells
    if (isWeekend) {
        cell.classList.add('weekend-cell');
    }
    
    const bookingKey = getBookingKey(dateString, chair);
    const booking = getBooking(dateString, chair);
    const pending = pendingBookings[bookingKey];

    // If this day is booked for this chair, show booking name (confirmed)
    if (booking) {
        cell.classList.add('booked', `chair-${chair}-bg`);
        const nameSpan = document.createElement('span');
        nameSpan.className = 'booking-name';
        nameSpan.textContent = booking.name;
        cell.appendChild(nameSpan);
    } else if (pending) {
        // Draft (unconfirmed) booking
        cell.classList.add('pending');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'booking-name';
        nameSpan.textContent = pending.name;
        cell.appendChild(nameSpan);
    }
    
    // Add click handler
    cell.addEventListener('click', () => {
        handleCellClick(dateString, cell, booking, pending, chair);
    });
    
    return cell;
}

// Handle cell click (for bookings)
function handleCellClick(dateString, cell, existingBooking, pendingBooking, chair) {
    const bookingKey = getBookingKey(dateString, chair);

    // Admin can always remove confirmed or draft bookings
    if (isAdmin) {
        if (existingBooking || pendingBooking) {
            if (!confirm(`Remove booking on ${getChairDisplayName(chair)} for ${existingBooking ? existingBooking.name : pendingBooking.name}?`)) {
                return;
            }
            if (existingBooking) {
                delete bookings[bookingKey];
                saveBookings();
                addLogEntry('admin_remove_confirmed', dateString, chair, 'Admin', existingBooking.name);
            } else if (pendingBooking) {
                delete pendingBookings[bookingKey];
                savePendingBookings();
                addLogEntry('admin_remove_draft', dateString, chair, 'Admin', pendingBooking.name);
            }
            renderCalendar();
            updateSelectedCount();
            updateMonthStatus();
        }
        return;
    }

    // Regular user flow
    if (!currentClientName) {
        alert('Select your name in the gray block to add or remove days.');
        return;
    }

    const actor = currentClientName;

    // If there is a confirmed booking
    if (existingBooking) {
        if (existingBooking.name === currentClientName) {
            alert('These days are already confirmed. Please ask admin if you need changes.');
        } else {
            alert(`This slot already belongs to ${existingBooking.name}.`);
        }
        return;
    }

    // Handle draft bookings
    if (pendingBooking) {
        if (pendingBooking.name !== currentClientName) {
            alert(`This slot is reserved as a draft by ${pendingBooking.name}.`);
            return;
        }
        // Toggle off own draft
        delete pendingBookings[bookingKey];
        savePendingBookings();
        addLogEntry('remove_draft', dateString, chair, actor, pendingBooking.name);
        renderCalendar();
        updateSelectedCount();
        updateMonthStatus();
        return;
    }

    // Create new draft booking for this user
    pendingBookings[bookingKey] = {
        name: currentClientName,
        createdAt: new Date().toISOString()
    };
    savePendingBookings();
    addLogEntry('add_draft', dateString, chair, actor, currentClientName);
    renderCalendar();
    updateSelectedCount();
    updateMonthStatus();
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
