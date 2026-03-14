# SiliconSentry

A full-stack complaint and incident management application with:

- `backend`: Express API with in-memory storage for login, complaint submission, location capture, reviews, and heat map data
- `frontend`: React app for users and admins

## Project Structure

```text
grievance-platform
|- backend
|  |- config
|  |  |- db.js
|  |- controllers
|  |  |- authController.js
|  |  |- complaintController.js
|  |- data
|  |  |- store.js
|  |- models
|  |  |- Complaint.js
|  |- routes
|  |  |- authRoutes.js
|  |  |- complaintRoutes.js
|  |- services
|  |  |- nlpService.js
|  |- package.json
|  |- server.js
|- frontend
|  |- public
|  |  |- index.html
|  |- src
|  |  |- components
|  |  |  |- Charts.js
|  |  |  |- ComplaintForm.js
|  |  |  |- HeatMap.js
|  |  |  |- ReviewForm.js
|  |  |- pages
|  |  |  |- AdminDashboard.js
|  |  |  |- Home.js
|  |  |  |- Login.js
|  |  |  |- SubmitComplaint.js
|  |  |- App.js
|  |  |- index.js
|  |  |- styles.css
|  |- package.json
|- package.json
|- README.md
```

## Prerequisites

- Node.js
- npm

## Installation

Run these commands once:

```powershell
cd C:\Users\Monish Raj.R\Desktop\FP\grievance-platform
npm install

cd .\backend
npm install

cd ..\frontend
npm install
```

The backend uses in-memory seeded data for demo users, complaints, and reviews.

## Supabase Storage Setup

If you are using Supabase for complaint photo uploads, run the SQL in
[backend/sql/supabase-storage.sql](C:\Users\Monish Raj.R\Desktop\FP\grievance-platform\backend\sql\supabase-storage.sql).

That script:

- creates or updates the `complaint-photos` bucket
- makes the bucket public for image viewing
- recreates the `Public can view complaint photos` policy safely

It is written to be rerunnable, so it will not fail if the policy or bucket already exists.

## Run The Project

Start both frontend and backend from the project root:

```powershell
cd C:\Users\Monish Raj.R\Desktop\FP\grievance-platform
npm run dev
```

## URLs

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5000](http://localhost:5000)
- Complaint API: [http://localhost:5000/api/complaints](http://localhost:5000/api/complaints)
- Heat map API: [http://localhost:5000/api/complaints/heatmap](http://localhost:5000/api/complaints/heatmap)
- Login API: [http://localhost:5000/api/auth/login](http://localhost:5000/api/auth/login)

## Available Scripts

From the root folder:

```powershell
npm run dev
npm run backend
npm run frontend
```

## Features

- SiliconSentry branding and a more polished operations-oriented UI
- Separate login flow for users and admins
- Location-aware issue submission with map preview
- In-memory complaint, user, and review storage
- Basic NLP-style category and priority detection
- Admin dashboard with charts, issue cards, and a heat map
- Review system for submitted issues

## Demo Login Credentials

Use these seeded in-memory accounts for local testing:

- User: `user@siliconsentry.local` / `user123`
- Admin: `admin@siliconsentry.local` / `admin123`

## Notes

- Data resets when the backend restarts because storage is in memory.
- The frontend is configured to call the backend at `http://localhost:5000`.
# Silicon-Sentry
