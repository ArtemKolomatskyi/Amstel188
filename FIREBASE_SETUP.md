# Firebase Setup Guide for Shared Bookings

Follow these steps to set up Firebase so all users see the same bookings.

## Step 1: Create Firebase Account

1. Go to https://console.firebase.google.com
2. Click "Get started" or "Add project"
3. Sign in with your Google account (or create one)

## Step 2: Create a New Project

1. Click "Create a project"
2. Enter project name: `amstel188-booking` (or any name you like)
3. **Disable** Google Analytics (not needed for this app)
4. Click "Create project"
5. Wait for project to be created, then click "Continue"

## Step 3: Enable Realtime Database

1. In the left sidebar, click **"Realtime Database"**
2. Click **"Create Database"**
3. Choose a location (pick the closest to you)
4. Click "Next"
5. **IMPORTANT**: Choose **"Start in test mode"** (we'll secure it later)
6. Click "Enable"

## Step 4: Get Your Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the **Web icon** `</>` (or "Add app" → Web)
5. Register app:
   - App nickname: `Amstel188 Booking` (or any name)
   - **Do NOT** check "Also set up Firebase Hosting"
   - Click "Register app"
6. You'll see your Firebase config code - **COPY IT!**

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Add Config to Your App

1. In your project folder, create a file named `firebase-config.js`
2. Copy the template from `firebase-config.js.template`
3. Replace all the values with your actual Firebase config values
4. Save the file

**Example:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...",
    authDomain: "amstel188-booking.firebaseapp.com",
    databaseURL: "https://amstel188-booking-default-rtdb.firebaseio.com",
    projectId: "amstel188-booking",
    storageBucket: "amstel188-booking.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};
```

## Step 6: Secure Your Database (Important!)

1. Go back to Firebase Console
2. Click "Realtime Database" in the sidebar
3. Click the "Rules" tab
4. Replace the rules with this:

```json
{
  "rules": {
    "bookings": {
      ".read": true,
      ".write": true
    }
  }
}
```

5. Click "Publish"

⚠️ **Note**: These rules allow anyone to read/write. For production, you might want to add authentication, but this works for now.

## Step 7: Test Your App

1. Open `index.html` in your browser
2. Open browser console (F12)
3. You should see: "Firebase initialized successfully"
4. Try booking a day
5. Open the same page in another browser/device
6. You should see the same booking! 🎉

## Troubleshooting

### "Firebase not configured" error
- Make sure `firebase-config.js` exists
- Check that all values are correct (no quotes around the values themselves)
- Make sure the file is in the same folder as `index.html`

### Bookings not syncing
- Check browser console for errors
- Verify database rules are published
- Make sure database URL in config matches your database URL

### Still using localStorage?
- The app will fall back to localStorage if Firebase isn't configured
- Check that `firebase-config.js` is loaded correctly

## Deploying with Firebase

Once everything works locally, you can deploy to Firebase Hosting:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

Or use Netlify/Vercel as described in DEPLOYMENT_GUIDE.md

---

## Need Help?

If you get stuck, check:
- Browser console for error messages
- Firebase console → Realtime Database → Data tab (to see if data is saving)
- Make sure your database URL is correct in the config

