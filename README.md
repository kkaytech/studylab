# 📚 StudyLab — Personal Study Dashboard

A productivity web app built for students to manage their study sessions,
tasks, goals, and schedule — all in one place. No sign-up, no backend,
everything saves locally in your browser.

🔗 **[Live Demo  →](https://kkaytech.github.io/studylab/)**

## Features

| Feature | Description |
|---|---|
| ⏱️ Pomodoro Timer | Custom timer with progress ring, short & long breaks |
| 🔔 Smart Notifications | Browser notifications + wind chime sound when timer ends |
| ✅ To-Do List | Add tasks with Low / Medium / High priority tags |
| 🎯 Goals Tracker | Set and mark goals as achieved |
| 📅 Calendar | Click any date to add reminders and daily to-dos |
| 📊 Stats Dashboard | Tracks tasks completed, study time, goals achieved, focus sessions |
| 🌙 Dark Mode | Persistent theme preference saved across sessions |


## How It Works

- All data (tasks, goals, reminders, study time) persists via **localStorage**
- Timer uses the **Web Audio API** to play a wind chime sequence on completion
- Calendar highlights dates that have reminders or to-dos attached
- Stats update in real time as you complete tasks and finish focus sessions

## Built With

`HTML` · `CSS` · `Vanilla JavaScript` · `Web Audio API` · `localStorage`

> No frameworks. No dependencies. No backend. Pure front-end.

## Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/studylab
cd studylab
# Open index.html in your browser
```

Or just open `index.html` directly — no build step needed.

## Project Structure
studylab/
├── assets
├── index.html # Main dashboard
├── calendar.html 
├── calendar.js
├── help.ml 
├── dashb.css # Styles
└── dashb.js # All functionality
