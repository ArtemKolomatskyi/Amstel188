## Amstel 188 Chair Booking – App Functionality Overview

### **Core Concepts**
- **Booking units**: Each booking is a combination of **date + chair (1–4) or Nails (5)**.
- **States**:
  - **Unconfirmed bookings** – selected by a user but not yet locked.
  - **Confirmed bookings** – locked per user for a month; only admin can change them.
- **Storage backends**:
  - **Firebase Realtime Database** if `firebase-config.js` is present and valid.
  - **`localStorage` fallback** if Firebase is not available.

---

### **Initialization & Data Loading**
- **`initFirebase()`**
  - Tries to initialize Firebase with `firebaseConfig`.
  - On success: sets up database reference and loads `bookings` and `confirmedBookings` from Firebase.
  - On failure / missing config: falls back to `localStorage` and loads stored data.

- **`loadBookings()`**
  - Reads all bookings from `bookings` path (Firebase) or from `localStorage` key `salonBookings`.
  - Keeps `bookings` object in sync and re-renders the calendar on data changes.

- **`loadConfirmedBookings()`**
  - Reads per-person confirmed bookings from `confirmedBookings` path (Firebase) or `localStorage`.
  - Keeps `confirmedBookings` object updated for lock‑state checks.

- **`saveBookings()`**
  - Persists `bookings` to Firebase (with error fallback to `localStorage`).

- **`saveConfirmedBookings()`**
  - Persists `confirmedBookings` to Firebase (with error fallback to `localStorage`).

---

### **User & Month Status Logic**
- **`isBookingConfirmed(dateString, chair, name)`**
  - Returns whether a specific **user** has a **confirmed booking** on a given date/chair.

- **`hasConfirmedBookingsThisMonth(name)`**
  - Checks if the user has **any confirmed bookings in the currently displayed month**.

- **`updateMonthStatus()`**
  - Controls the **status banner** and **Confirm button**:
    - No name → disables confirmation and prompts for a name.
    - `ADMIN_NAME` (`Amstel188`) → admin mode; can only remove, not book.
    - User with confirmed bookings → shows locked message and disables confirmation.
    - Otherwise → enables/disables confirm button based on current selections.

- **`updateSelectedCount()`**
  - Updates the UI display: `"Name: X days selected"`, counting current temporary selections.

---

### **Booking Helpers**
- **`getBookingKey(dateString, chair)`**
  - Builds a unique key `"YYYY-MM-DD-chair"` used across all data structures.

- **`getBooking(dateString, chair)`**
  - Returns the existing booking object for a cell, preferring saved bookings over temporary selections.

- **`hasBookingOnDate(dateString, name)`**
  - Checks if a user already has any chair booked on a given date (used for conflict/UX checks).

- **`getChairDisplayName(chair)`**
  - Maps chair numbers to display labels: `"Chair 1–4"` or `"Nails"` for chair 5.

---

### **Event Wiring & Confirmation Flow**
- **`setupEventListeners()`**
  - Adds click handlers for **previous/next month** arrow buttons.
  - Connects **Confirm My Bookings** button to `confirmBookings()`.
  - Reacts to **name input changes** by resetting selections, updating status, and re‑rendering the calendar.

- **`confirmBookings()`**
  - Validates:
    - Name is entered and is **not** the admin name.
    - At least one day is selected.
    - User confirms via browser `confirm()` dialog.
    - No conflicts with other users’ existing bookings.
  - On success:
    - Copies all `selectedBookings` into `bookings`.
    - Marks them as confirmed for the current user in `confirmedBookings`.
    - Clears selections, saves to backend, updates calendar and status.

---

### **Calendar Rendering**
- **`renderCalendar()`**
  - Builds the monthly table UI:
    - Computes days in the current month and day of week for each date.
    - Creates one row per day with:
      - Day-of-week + day number cell.
      - Five cells for **Chair 1–4 + Nails** using `createChairCell()`.
  - After rendering, calls `updateMonthStatus()` to sync status with the new view.

- **`createChairCell(year, month, day, chair)`**
  - Creates a clickable cell for a specific **date + chair**.
  - Reads booking and selection state to:
    - Show booked user name and chair‑color background.
    - Add `"selected"` class when the current user has that cell selected.
  - On click:
    - If current user has that booking confirmed and is **not admin** → routes to `handleConfirmedCellClick()`.
    - Otherwise → routes to `handleCellClick()` (normal selection/removal logic).

---

### **Cell Interaction Logic**
- **`handleCellClick(dateString, cell, existingBooking, chair)`**
  - Main user interaction handler for **unconfirmed** bookings:
    - Requires a name; prompts if missing.
    - If name is `ADMIN_NAME`, only allows removing existing bookings (no new bookings).
    - Blocks changes to cells where the user already has a **confirmed** booking.
    - Prevents selecting a cell already booked by another person.
    - Enforces **single-chair multi‑select**:
      - First selection chooses `currentChair`.
      - All subsequent selections must use the same chair until selections are cleared.
    - Toggles selection in `selectedBookings` and updates UI, selected count, and status.

- **`handleConfirmedCellClick(dateString, cell, existingBooking, chair)`**
  - Handles clicks on cells that are **confirmed for the current user**:
    - Only admin (`Amstel188`) can remove these bookings.
    - On admin confirm, removes booking from both `bookings` and `confirmedBookings`, then saves and re-renders.

---

### **App Lifecycle**
- On `DOMContentLoaded`:
  - `initFirebase()` → initializes storage and loads data.
  - `setupEventListeners()` → wires UI controls.
  - `renderCalendar()` → draws the current month view.

This file is a high‑level map of what the app does and which functions power each piece of behavior.

