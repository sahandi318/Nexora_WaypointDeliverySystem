# Nexora Waypoint Delivery System

Nexora Waypoint Delivery System is a delivery planning and operations platform developed for the **Tech-Triathlon 2026 Hackathon**.

The system supports delivery operations between depots and retail outlets while providing dedicated interfaces and workflows for different operational roles.

---

## User Roles

The system supports five main user roles:

- Store Manager
- Dispatcher
- Loader
- Driver
- Admin

Each user will authenticate using a User ID and password. Their role and assigned outlet or depot will be determined by the backend.

---

# Technology Stack

## Frontend

- React
- JavaScript
- Vite
- Tailwind CSS
- Lucide React
- React Router
- Axios

## Backend

- Node.js
- Express.js
- Prisma ORM 7
- JWT Authentication
- bcryptjs
- Socket.IO

## Database

- MySQL 8
- Dockerized MySQL development environment
- Prisma Migrations

## Offline Support

- IndexedDB
- Dexie.js

Offline support is mainly intended for the Driver workflow.

## Mapping

Planned mapping technologies:

- MapLibre
- OpenStreetMap

## Development and Deployment

- Docker
- Docker Compose
- Git
- GitHub

---

# Project Structure

```text
Nexora_WaypointDeliverySystem/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── .env.example
│   ├── package.json
│   ├── prisma.config.ts
│   └── server.js
│
├── database/
│
├── docs/
│
├── frontend/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── contexts/
│       └── hooks/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md