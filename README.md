# Live-Sync Classroom - Collaborative Digital Sticky Notes

**Global Hack Week Submission**  
Challenge: The Live-Sync Classroom  
Participant: Sebas (Spanish speaker, documentation in English)  
Event: [MLH Global Hack Week](https://github.com/MLH)

## What It Does

A real-time collaborative sticky note wall where multiple users can create, edit, and delete notes simultaneously. Everyone sees changes instantly without refreshing - perfect for classroom brainstorming, team retrospectives, or study groups.

## How It Works

Uses Firebase Realtime Database to sync notes across all connected users:
1. Create colored sticky notes with your ideas
2. Drag and drop notes anywhere on the board
3. All users see updates in real-time (< 100ms latency)
4. No login required - just share the link
5. Works on desktop and mobile

## Try It Live

https://heysebitas.github.io/live-sync-classroom/

## Run Locally

1. Clone this repository
2. Open `index.html` in your browser
3. Share the URL with your team
4. Start collaborating!

No build process or dependencies needed - pure HTML/CSS/JavaScript with Firebase.

## Features

- **Real-time sync** - See everyone's notes as they type
- **Drag & drop** - Organize notes visually
- **Color coding** - 6 colors to categorize ideas
- **Anonymous** - No accounts needed
- **Mobile-friendly** - Works on phones and tablets

## Tech Stack

- Pure HTML/CSS/JavaScript
- Firebase Realtime Database (real-time sync)
- CSS Grid & Flexbox (responsive layout)
- Drag & Drop API

## Privacy

Notes are stored in a public Firebase database for demo purposes. Don't share sensitive information. Data persists until manually deleted.

## Notes

Created for Global Hack Week as a simple but powerful collaboration tool for classrooms and teams. The interface is in Spanish but works for any language.
