# JustChillin 🧊

JustChillin is a real-time messaging and video calling web application. It features a modern, dark-themed UI, instant messaging, and seamless peer-to-peer video calls right from your browser. 

## Features
- **Real-time Chat**: Send and receive messages instantly using WebSockets (`Socket.io`).
- **Video Calling**: High-quality, low-latency peer-to-peer video calling powered by `PeerJS`.
- **Modern UI**: A sleek, fully responsive dark mode interface crafted with `Tailwind CSS`.
- **Robust Backend**: Node.js & Express server connected to MongoDB using Prisma ORM.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, Axios
- **Backend**: Node.js, Express, Socket.io, PeerJS
- **Database**: MongoDB (Replica Set) & Prisma ORM

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (for MongoDB replica set)

### 1. Database Setup
Start the MongoDB Replica Set using Docker Compose:
```bash
docker-compose up -d
```
*(Note: The database is running locally on port 27017 as a replica set `rs0`)*

### 2. Backend Setup
Navigate to the `backend` directory, install dependencies, and configure environment variables.
```bash
cd backend
npm install
cp .env.example .env
```
Run the Prisma migrations to generate the client:
```bash
npx prisma generate
npx prisma db push
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the `frontend` directory and install dependencies.
```bash
cd frontend
npm install
```
Start the development server:
```bash
npm run dev
```

## Usage
- Open `http://localhost:3000` in your browser.
- Create an account or log in.
- Open a second instance (e.g., an incognito window) to create another account to chat/call with.
- Start sending messages, or click the **Video Call** button to test out the video chat!
