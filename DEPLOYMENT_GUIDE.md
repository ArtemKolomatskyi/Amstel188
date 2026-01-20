# How to Deploy Amstel 188 Chair Booking App

## Option 1: Netlify (Easiest - Recommended) ⭐

### Step-by-Step:

1. **Create a Netlify Account**
   - Go to https://www.netlify.com
   - Click "Sign up" (you can use GitHub, Google, or email)

2. **Prepare Your Files**
   - Make sure you have these 3 files in a folder:
     - `index.html`
     - `styles.css`
     - `script.js`

3. **Deploy to Netlify**
   - Log into Netlify
   - Click "Add new site" → "Deploy manually"
   - Drag and drop your folder containing the 3 files
   - Wait for deployment (takes ~30 seconds)
   - You'll get a URL like: `https://random-name-123.netlify.app`

4. **Customize Your URL (Optional)**
   - Go to Site settings → Change site name
   - You can change it to something like: `amstel188-booking.netlify.app`

**✅ Done!** Share your link with anyone.

---

## Option 2: GitHub Pages (Free)

### Step-by-Step:

1. **Create GitHub Account**
   - Go to https://github.com
   - Sign up for free

2. **Create a New Repository**
   - Click "+" → "New repository"
   - Name it: `amstel188-booking` (or any name)
   - Make it Public
   - Click "Create repository"

3. **Upload Your Files**
   - Click "uploading an existing file"
   - Upload: `index.html`, `styles.css`, `script.js`
   - Click "Commit changes"

4. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Under "Source", select "main" branch
   - Click "Save"
   - Wait 1-2 minutes

5. **Get Your Link**
   - Your site will be at: `https://yourusername.github.io/amstel188-booking`

**✅ Done!** Share your link.

---

## Option 3: Vercel (Also Easy)

### Step-by-Step:

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub (easiest)

2. **Deploy**
   - Click "Add New Project"
   - Import your GitHub repository (or drag & drop files)
   - Click "Deploy"

3. **Get Your Link**
   - You'll get: `https://your-project.vercel.app`

**✅ Done!**

---

## Quick Comparison:

| Service | Ease | Speed | Custom Domain |
|---------|------|-------|---------------|
| **Netlify** | ⭐⭐⭐⭐⭐ | Fast | Free |
| **GitHub Pages** | ⭐⭐⭐⭐ | Medium | Free |
| **Vercel** | ⭐⭐⭐⭐⭐ | Fast | Free |

---

## Important Notes:

⚠️ **Data Storage**: Your bookings are stored in each user's browser (localStorage). This means:
- Each user sees their own bookings
- Bookings are NOT shared between users
- If you want shared bookings, you'll need a backend/database

💡 **Recommendation**: Start with **Netlify** - it's the easiest and fastest!

---

## Need Help?

If you get stuck, let me know which step you're on and I'll help you!

