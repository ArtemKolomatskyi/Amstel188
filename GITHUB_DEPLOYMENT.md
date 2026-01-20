# Deploy to GitHub Pages - Step by Step Guide

## What You Need:
- Your 4 files: `index.html`, `script.js`, `styles.css`, `firebase-config.js`
- A GitHub account (free)

---

## Step 1: Create GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click "Sign up"
3. Create your account (it's free)

---

## Step 2: Create a New Repository

1. **After logging in**, click the **"+"** icon in the top right corner
2. Click **"New repository"**
3. Fill in:
   - **Repository name**: `amstel188-booking` (or any name you like)
   - **Description**: "Amstel 188 Chair Booking System" (optional)
   - **Visibility**: Choose **"Public"** (required for free GitHub Pages)
   - **DO NOT** check "Add a README file" (we'll upload files manually)
   - **DO NOT** add .gitignore or license
4. Click **"Create repository"**

---

## Step 3: Upload Your Files to GitHub

After creating the repository, you'll see a page with instructions. Choose **"uploading an existing file"**:

1. Click the link that says **"uploading an existing file"**
2. **Drag and drop** these 4 files into the upload area:
   - `index.html`
   - `script.js`
   - `styles.css`
   - `firebase-config.js`
3. Scroll down and click **"Commit changes"** button
4. Wait for files to upload (takes a few seconds)

---

## Step 4: Enable GitHub Pages

1. In your repository page, click **"Settings"** tab (top of the page)
2. Scroll down to **"Pages"** section (in the left sidebar)
3. Under **"Source"**, click the dropdown
4. Select **"main"** branch (or "master" if that's what you see)
5. Click **"Save"** button
6. Wait 1-2 minutes for GitHub to build your site

---

## Step 5: Get Your Live Link

1. After saving, refresh the Settings page
2. Scroll back to **"Pages"** section
3. You'll see a message: **"Your site is live at..."**
4. Your link will be: `https://YOUR_USERNAME.github.io/amstel188-booking`
5. **Copy this link** - this is your live app!

---

## Step 6: Test Your Live App

1. Open the link in a new browser tab
2. The app should load exactly like it does locally
3. Try making a booking
4. Open the same link in another browser/device
5. You should see the same booking! 🎉

---

## Important Notes:

### ⚠️ Security Note:
Your `firebase-config.js` file is now public on GitHub. This is **OKAY** for Firebase Realtime Database with the rules we set, but:
- Anyone can see your Firebase config
- Make sure your database rules only allow read/write to the "bookings" path (which we did)
- Your Firebase API key is meant to be public for web apps

### 🔄 Updating Your App:
If you make changes to your files:
1. Go to your repository on GitHub
2. Click on the file you want to update
3. Click the pencil icon ✏️ to edit
4. Make your changes
5. Scroll down and click **"Commit changes"**
6. Changes will be live in 1-2 minutes

### 📁 File Structure:
Your repository should look like this:
```
amstel188-booking/
├── index.html
├── script.js
├── styles.css
└── firebase-config.js
```

---

## Troubleshooting:

**Q: I don't see "Pages" in Settings**
- Make sure you're in the Settings tab
- Scroll down - it's in the left sidebar
- If you still don't see it, make sure your repository is Public

**Q: My site shows "404 Not Found"**
- Wait 2-3 minutes after enabling Pages
- Make sure `index.html` is in the root of your repository
- Check that you selected the correct branch (main or master)

**Q: Changes aren't showing up**
- GitHub Pages can take 1-2 minutes to update
- Try hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Clear your browser cache

**Q: Firebase not working on live site**
- Make sure `firebase-config.js` was uploaded
- Check browser console for errors
- Make sure database rules are set correctly in Firebase Console

---

## Quick Checklist:

- [ ] Created GitHub account
- [ ] Created new repository (Public)
- [ ] Uploaded 4 files (index.html, script.js, styles.css, firebase-config.js)
- [ ] Enabled GitHub Pages (Settings → Pages → main branch)
- [ ] Got the live link
- [ ] Tested the app
- [ ] Shared the link with others! 🎉

---

## Need Help?

If you get stuck at any step, let me know which step and what error you see!

