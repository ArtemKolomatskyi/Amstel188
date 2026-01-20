## Amstel 188 – Chair Booking Web App

This repository hosts a **single-page web app** for booking chairs in the Amstel 188 salon.
It is designed to run directly from GitHub Pages on any device (phone, tablet, desktop).

---

### Live App (after you enable GitHub Pages)

Once GitHub Pages is enabled for this repository, your app will be available at:

`https://ArtemKolomatskyi.github.io/Amstel188/`

> If you change the repository name or owner, the URL will change accordingly.

---

### Files

- `index.html` – main page and layout
- `styles.css` – all visual styling and responsive layout
- `script.js` – booking logic, per-name calendar, admin tools, and logging
- `firebase-config.js` – your Firebase configuration (not in this repo for security; create it locally)

The same app code also lives in the `Booking Amstel 188/` folder, which you can use as a
development copy. The **root `index.html` / `script.js` / `styles.css`** are the ones that
GitHub Pages will serve.

---

### How the App Works (Short)

- Admin adds client names at the bottom (password: `Amstel 188`).
- All names appear as **chips at the top**; anyone can pick their name.
- With a name selected, a user can:
  - Click empty cells to **book days**.
  - Click their own booked cells to **remove** them.
- Every booking change is written to an **admin-only change log** with date, time, chair, and name.
- The admin log also shows, per month:
  - How many days each name has booked.
  - How many free slots remain per chair.

---

### Deploy / Update to GitHub Pages

1. Commit your changes locally:
   ```bash
   git add .
   git commit -m "Update Amstel 188 booking app"
   ```
2. Push to GitHub:
   ```bash
   git push
   ```
3. In GitHub → **Settings → Pages**:
   - Set **Source** to `main` branch, root (`/`) folder.
   - Save; wait 1–2 minutes.

Your app will be live at the Pages URL shown there.

---

### Local Development

You can open `index.html` directly in a browser, or run a small local server:

```bash
python -m http.server 8000
# then visit http://localhost:8000 in your browser
```

Make sure you have a valid `firebase-config.js` file next to `index.html`
if you want cloud sync; otherwise the app will fall back to `localStorage`.

