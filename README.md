# 🇱🇰 GovQueue — Sri Lanka Virtual Queue System

> Eliminate wasted waiting days at government offices. Citizens take virtual tokens, track their live queue position, and get SMS alerts — from anywhere.

## Live Demo
- Frontend: *coming soon*
- Backend API: *coming soon*

##  Features
- Virtual token system — no physical queuing
- Real-time queue updates with Socket.io
- SMS alerts when 3 positions away
- 4-role system: Citizen · Officer · Admin · Super Admin
- Analytics dashboard for office admins
- Browse offices by district and type

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| State | Redux Toolkit |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| SMS | Dialog SMS API |

## Project Structure
queue-system/
├── backend/     # Node.js + Express API
└── frontend/    # React + Vite app

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/Bingu2002/queue-system.git
cd queue-system
```

Backend setup:
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend setup (open a new terminal):
```bash
cd frontend
npm install
npm run dev
```

##  Author
**Bingusari Dissanayaka** — University of Peradeniya