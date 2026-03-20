# Contributing & Local Development Guide

This guide explains how to get the latest changes from GitHub into your local copy of the project in VS Code, and how to keep your environment up to date after each update.

---

## Table of Contents

1. [First-time setup – clone the repository](#1-first-time-setup--clone-the-repository)
2. [Pull the latest changes from GitHub](#2-pull-the-latest-changes-from-github)
   - [Using VS Code's built-in Source Control UI](#option-a-vs-code-source-control-ui-recommended)
   - [Using the integrated terminal](#option-b-integrated-terminal)
3. [After pulling – update your dependencies](#3-after-pulling--update-your-dependencies)
4. [Run the project locally](#4-run-the-project-locally)
5. [Common issues](#5-common-issues)

---

## 1. First-time setup – clone the repository

If you have not cloned the project yet, open a terminal and run:

```bash
git clone https://github.com/GilbertAshivaka/LibroWeb.git
cd LibroWeb
```

Then open the folder in VS Code:

```bash
code .
```

---

## 2. Pull the latest changes from GitHub

### Option A: VS Code Source Control UI (recommended)

1. Click the **Source Control** icon in the left sidebar (the branch icon, or press `Ctrl+Shift+G` / `Cmd+Shift+G` on macOS).
2. At the top of the Source Control panel, click the **⋯ (More Actions)** menu (three dots).
3. Select **Pull** (or **Pull from… → origin → main/master**).
4. VS Code will fetch and merge the latest commits from GitHub into your local branch.

Alternatively, use the **status bar** at the very bottom of the VS Code window:
- Click the **sync icon** (circular arrows) next to the branch name. This runs `git pull` automatically.

### Option B: Integrated terminal

Open the VS Code terminal (`Ctrl+`` ` / `Cmd+`` `) and run:

```bash
# Make sure you are on the correct branch first
git checkout main          # or whichever branch you work on

# Fetch all remote changes and merge them
git pull origin main
```

If you want to pull a specific feature branch (e.g., a Copilot PR branch):

```bash
git fetch origin
git checkout <branch-name>
git pull origin <branch-name>
```

---

## 3. After pulling – update your dependencies

Every time you pull, check whether any dependency files changed and re-install if needed.

### Frontend (Node.js / npm)

```bash
cd frontend
npm install
```

Run this whenever `package.json` or `package-lock.json` has changed.

### Backend (Python / pip)

```bash
cd backend

# Activate your virtual environment first
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Run this whenever `requirements.txt` has changed.

---

## 4. Run the project locally

### Using Docker (easiest)

```bash
docker-compose up -d
```

| Service | URL |
|---------|-----|
| Admin portal (React) | http://localhost:5173 |
| API & Swagger docs   | http://localhost:8000/api/docs |

### Without Docker

**Backend:**

```bash
cd backend
source venv/bin/activate   # Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

**Frontend** (open a second terminal):

```bash
cd frontend
npm run dev
```

---

## 5. Common issues

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `git pull` says *"Your local changes would be overwritten"* | You have uncommitted local edits | Stash or commit your changes first: `git stash` then `git pull`, then `git stash pop` |
| `git pull` says *"Already up to date"* but changes are missing | You are on the wrong branch | `git branch` to check; `git checkout main` to switch |
| Frontend shows old content after pull | Browser cache | Hard-refresh: `Ctrl+Shift+R` / `Cmd+Shift+R` |
| `npm install` fails | Node version mismatch | Requires **Node.js 20+**. Check with `node -v` |
| Backend import errors after pull | New Python dependency added | Re-run `pip install -r requirements.txt` inside your virtual environment |
| Database errors after pull | New migration / model change | Restart the backend; tables are auto-created on startup via `init_db()` |

---

## Branch naming convention

| Branch type | Pattern | Example |
|-------------|---------|---------|
| Main/stable | `main` | `main` |
| Feature | `feature/<description>` | `feature/email-notifications` |
| Bug fix | `fix/<description>` | `fix/subscription-tiers` |
| Copilot-generated | `copilot/<description>` | `copilot/inspect-subscription-module-issue` |

---

For questions or issues, contact the Libro development team.
