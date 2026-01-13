# 📌 Live-Sync Classroom - Collaborative Digital Sticky Notes

**Global Hack Week Submission**  
Challenge: The Live-Sync Classroom  
Participant: Sebas ([@heysebitas](https://github.com/heysebitas))  
Event: [MLH Global Hack Week](https://github.com/MLH)

## ✨ What It Does

A real-time collaborative sticky note wall where multiple users can create, edit, and delete notes simultaneously. Everyone sees changes instantly without refreshing - perfect for classroom brainstorming, team retrospectives, or study groups.

## 🚀 How It Works

Uses Firebase Realtime Database to sync notes across all connected users:
1. Create colored sticky notes with your ideas (random colors for variety!)
2. Drag and drop notes anywhere on an infinite scrollable board
3. Real-time sync - All users see updates in < 100ms latency
4. No login required - Just share the link and start collaborating
5. 100% responsive - Works perfectly on desktop, tablets, and mobile devices

## 🌐 Try It Live

**[https://heysebitas.github.io/live-sync-classroom/](https://heysebitas.github.io/live-sync-classroom/)**

## 📱 Features

- Real-time sync - See everyone's notes as they type
- Infinite scrollable board - No space limitations
- Drag & drop - Organize notes visually with smooth interactions
- Random color selection - Each new note gets a random color from 6 beautiful gradients
- Anonymous - No accounts needed, just share the URL
- Fully responsive - Beautiful design on any device (mobile, tablet, desktop)
- Live user count - See how many people are connected in real-time
- Instant updates - Changes appear immediately for all users

## 🔧 Tech Stack

- Frontend: Pure HTML5/CSS3/JavaScript (ES6 modules)
- Database: Firebase Realtime Database v10.7.1
- Styling: CSS Grid, Flexbox, Gradients, Responsive Media Queries
- Interactions: Native Drag & Drop API
- Hosting: GitHub Pages

## 🛠️ Setup & Installation

### Firebase Configuration

**Note:** This repository includes Firebase configuration directly in `script.js` for demo purposes. The live version is already configured and ready to use at the GitHub Pages URL above.

If you want to create your own instance:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (free Spark tier is sufficient)
3. Enable **Realtime Database**:
   - Navigate to Build → Realtime Database → Create Database
   - Start in **test mode** (for development/demo)
   - Set security rules if needed for production
4. Get your Firebase config:
   - Go to Project Settings → General → Your apps
   - Select Web app and copy the `firebaseConfig` object
5. Replace the config in `script.js` (lines 4-11) with your own credentials

### Run Locally

1. **Clone this repository:**
   ```bash
   git clone https://github.com/heysebitas/live-sync-classroom.git
   cd live-sync-classroom
   ```

2. **Start a local server** (required for ES6 modules):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server
   
   # Or using PHP
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

4. **Share the URL** with your team and start collaborating!

## 🔒 Privacy & Security

- Notes are stored in Firebase Realtime Database
- Current demo uses public database - don't share sensitive information
- Data persists until manually deleted by users
- No personal information is collected
- For production use, configure proper Firebase security rules

## ⚠️ Known Limitations

- Demo database is in test mode (open to all)
- No authentication system (anyone can edit/delete)
- No undo functionality
- Maximum note storage depends on Firebase free tier limits

## 📄 License

This project is open source under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Created for **MLH Global Hack Week**
- Built with ❤️ by [Sebas](https://github.com/heysebitas)
- Interface in Spanish, but works for any language
- Thanks to Firebase for the real-time database infrastructure

---
