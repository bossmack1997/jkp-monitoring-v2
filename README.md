# JKP Monitoring System
**Jollibee Kids Party Monitoring System v2.0**

A production-ready, enterprise-level Progressive Web App (PWA) for managing and monitoring Jollibee Kids Party bookings. Built with Firebase, vanilla JavaScript ES6 modules, and a professional Jollibee-themed UI.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Folder Structure](#folder-structure)
5. [Firebase Setup](#firebase-setup)
6. [Installation & Deployment](#installation--deployment)
7. [Cloud Functions Setup](#cloud-functions-setup)
8. [Firestore Security Rules](#firestore-security-rules)
9. [User Roles & Access](#user-roles--access)
10. [PWA Features](#pwa-features)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

This is an **internal web application** for Jollibee staff to manage Kids Party bookings. Customers visit the branch in person; staff manually encode booking information. No online booking, no online payment, no checkout.

**Booking Flow:**
1. Customer visits branch
2. Staff assists and fills out booking form
3. Booking number auto-generates (e.g. `JKP-2026-00001`)
4. Booking saves to Firestore with status `PENDING`
5. MIC receives real-time notification
6. MIC reviews and clicks `CONFIRM`
7. Cloud Function auto-sends confirmation email to customer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6 Modules) |
| **Backend** | Firebase Auth, Firestore, Storage, Cloud Functions |
| **Deployment** | GitHub Pages + Firebase Hosting |
| **No PHP / No MySQL / No Laravel / No React / No Express** |

---

## Features

### Full Authentication & Authorization
- Email/password login
- Role-based access control (Admin, MIC, Staff)
- Session timeout
- Password change

### Dashboard
- Today's Parties, Upcoming, Pending, Confirmed, Cancelled, Completed stats
- Revenue chart (last 7 days)
- Status donut chart
- Recent activity timeline
- Notifications panel (Today, Tomorrow, This Week)
- Real-time live updates via Firestore listeners
- CSV export

### Bookings Management
- Create, edit, view, delete bookings
- Auto-generate booking numbers
- Search by customer, celebrant, contact, theme, status, date, branch
- Filter by status and date range
- Booking details modal with activity logs
- Status transitions (Pending → Confirmed → Completed / Cancelled)

### Calendar
- Interactive monthly calendar
- Color-coded booking items
- Click to view booking details
- Month navigation and Today button

### Reports & Analytics
- Daily, Weekly, Monthly, Yearly reports
- Booking trends chart
- Room distribution chart
- Status breakdown
- Top themes analysis
- PDF/Excel export (CSV)

### Users Management (Admin Only)
- Create, edit, deactivate users
- Assign roles: Admin, MIC, Staff
- Firebase Auth integration

### Settings
- Dark mode toggle
- Notification preferences
- App information

### Email Notifications
- Auto-send confirmation email when MIC confirms booking
- HTML email with booking details, package inclusions, terms & conditions
- "View Booking" secure link

### Public Customer View
- Secure read-only page (no login required)
- Token-based access
- Booking details display
- Terms and Conditions acknowledgment checkbox
- Saves acknowledgment timestamp to Firestore

### Terms & Conditions
- Admin manages latest version
- Versioned documents
- Automatically included in confirmation emails
- Link in customer email

### PWA Features
- Installable on Android and iOS
- Offline support via Service Worker
- App icon and splash screen
- Manifest.json
- Native app-like experience

---

## Folder Structure

```
C:\jkp-monitoring-v2\
├── index.html                    # Landing page
├── login.html                    # Login page
├── dashboard.html                # Dashboard
├── bookings.html                 # Bookings management
├── calendar.html                 # Calendar view
├── reports.html                  # Reports & analytics
├── users.html                    # User management (Admin)
├── settings.html                 # Settings (Admin)
├── profile.html                  # User profile & password change
├── view-booking.html             # Public customer booking view
├── manifest.json                 # PWA manifest
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Storage security rules
├── firebase.json                 # Firebase hosting config
├── .firebaserc                   # Firebase project config
│
├── css/
│   ├── style.css                 # Base styles, login, sidebar, theme
│   └── dashboard.css             # Dashboard-specific styles
│
├── js/
│   ├── firebase.js               # Firebase initialization
│   ├── auth.js                   # Authentication & role guards
│   ├── utils.js                  # Toast notifications, currency formatter
│   ├── bookings.js               # Booking CRUD operations
│   ├── dashboard.js              # Dashboard stats, charts, realtime listener
│   ├── calendar.js               # Calendar rendering & data loading
│   ├── notifications.js          # Realtime & scheduled notifications
│   ├── activityLogs.js           # Activity log tracking
│   ├── themes.js                 # Theme management (Admin)
│   ├── mealBundles.js            # Meal bundle management (Admin)
│   ├── terms.js                  # Terms & conditions management
│   ├── service-worker.js         # PWA service worker
│   └── settings.js               # Settings page logic
│
├── cloud-functions/
│   ├── package.json
│   ├── index.js                  # Email & booking triggers
│   ├── .gitignore
│   └── .env.example
│
├── assets/
│   ├── icons/                    # PWA icons (icon-192.png, icon-512.png)
│   └── images/                   # Theme images, brochures
│
├── .github/
│   └── workflows/
│       ├── firebase-hosting.yml  # GitHub Actions: deploy frontend
│       └── firebase-functions.yml # GitHub Actions: deploy functions
│
└── README.md                     # This file
```

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project named `jkp-monitoring`
3. Enable **Authentication** → **Email/Password** sign-in provider
4. Create **Firestore Database** → Start in **Test Mode** (we'll deploy rules later)
5. Create **Storage** → Start in **Test Mode**
6. Go to **Project Settings** → **General** → Scroll to **Your apps** → Add web app

### 2. Configure Firebase

Update `js/firebase.js` with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Create Initial Admin User

In Firebase Console → Authentication → Users → Add User:
```
Email: admin@jkp.com
Password: admin123
```

Then in Firestore → `users` collection → Add document:
```
Document ID: (same as Firebase Auth UID)
Fields:
  name: "System Admin"
  email: "admin@jkp.com"
  role: "admin"
  status: "active"
  createdAt: (timestamp)
```

### 4. Add MIC and Staff Users

Repeat for other roles:
```
MIC: role = "mic"
Staff: role = "staff"
```

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 6. Deploy Storage Rules

```bash
firebase deploy --only storage
```

---

## Installation & Deployment

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged into Firebase: `firebase login`

### Deploy Frontend to Firebase Hosting

```bash
# From project root
firebase deploy --only hosting
```

### Deploy Cloud Functions

```bash
cd cloud-functions
npm install
cd ..
firebase deploy --only functions
```

### GitHub Pages Deployment

1. Push to GitHub repository
2. Enable GitHub Pages in repo Settings → Pages → Source: `main` branch
3. Site will be available at `https://username.github.io/repo-name/`

### GitHub Actions (CI/CD)

Configure GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT_JKP_MONITORING`: JSON service account key from Firebase Console

Push to `main` branch triggers automated deployment.

---

## Cloud Functions Setup

### Configure Gmail for Email Notifications

1. Enable 2FA on Gmail account
2. Generate App Password at: https://myaccount.google.com/apppasswords
3. Set Firebase config:

```bash
firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
firebase deploy --only functions
```

### Functions Overview

| Function | Trigger | Purpose |
|----------|---------|---------|
| `sendConfirmationEmail` | Firestore `onUpdate` | Sends email when booking status changes to confirmed |
| `onCreateBooking` | Firestore `onCreate` | Logs activity when new booking is created |
| `api` | HTTPS | Health check endpoint |

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.keys().hasAll(['customerName','celebrant','date','time','branch','guests','room']);
      allow update: if request.auth != null && resource.data.status in ['pending','confirmed','cancelled','completed'];
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /themes/{themeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /mealBundles/{bundleId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /partyPackages/{packageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    match /activityLogs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    match /termsConditions/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /emailTemplates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /settings/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## User Roles & Access

| Role | Access |
|------|--------|
| **ADMIN** | Full system access: Dashboard, Bookings, Calendar, Reports, Users, Settings, Profile |
| **MIC** | Dashboard, Bookings, Calendar, Reports, Profile |
| **STAFF/CREW** | Dashboard, Bookings, Calendar, Profile |

| Page | Admin | MIC | Staff |
|------|-------|-----|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Bookings | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ |
| Users Management | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Profile | ✅ | ✅ | ✅ |

---

## PWA Features

The system is installable as a native app:

- **manifest.json**: App name, icons, theme color, display mode
- **service-worker.js**: Offline caching, background sync, push notifications
- **Offline Support**: Core assets cached for offline access
- **Install Prompts**: Browser install banner on supported devices

### Adding PWA Icons

Place icons in `assets/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Use any image editor or online tool to generate from the SVG logo.

---

## Troubleshooting

### "Permission denied" errors
- Check Firestore rules are deployed
- Verify user role in `users` collection matches Auth UID

### Emails not sending
- Verify Gmail App Password is set: `firebase functions:config:get`
- Check Cloud Function logs: `firebase functions:log`

### Service Worker not registering
- Ensure HTTPS is used (required for SW)
- Check browser DevTools → Application → Service Workers

### Dark mode not persisting
- Check `localStorage` for `jkp_theme` key
- Clear browser cache if corrupted

### Real-time updates not working
- Verify Firestore is in production mode (not test mode)
- Check network tab for Firestore connection

---

## Security

- Firebase Authentication (email/password)
- Firestore Security Rules enforce role-based access
- Input validation on all forms
- XSS prevention via textContent where possible
- Audit logs via ActivityLogs module
- Session timeout (sessionStorage)
- Firebase App Check recommended for production

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

For PWA install: Chrome (Android), Safari (iOS - Add to Home Screen)

---

**© 2026 Jollibee Kids Party. JKP Monitoring System v2.0 — Built for branches, by branches.**
