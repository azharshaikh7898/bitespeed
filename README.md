# Bitespeed Identity API

## Architecture Explanation
This project uses Node.js, Express, and Prisma ORM for backend logic. The app is containerized with Docker and uses PostgreSQL as the database. The main components are:
- `src/app.ts`: Express app setup
- `src/server.ts`: Server entry point
- `src/services/identify.service.ts`: Identity merging logic
- `prisma/schema.prisma`: Database schema
- Docker Compose for orchestration

## How Identity Merging Works
When a POST request is made to `/identify` with an email and phone number, the service:
1. Searches for existing contacts with the given email or phone number.
2. If found, merges them under a primary contact.
3. If not found, creates a new primary contact.
4. Ensures no duplicate contacts are created.
5. Returns all related emails, phone numbers, and secondary contact IDs.

## Sample curl Request
```
curl -X POST https://your-app-url.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"9999999999"}'
```

## CI/CD Explanation
This project uses GitHub Actions for CI/CD. On every push, tests and builds are run, and deployments are triggered if successful. You can customize workflows in `.github/workflows/`.

## Database Schema Screenshot
![Prisma Schema](docs/Screenshot%20from%202026-02-28%2000-54-36.png)
Add a screenshot of your schema.prisma or an ER diagram here.
# Bitespeed Identity Reconciliation Service

## Overview
Production-ready backend service for identity reconciliation.

### Tech Stack
- Node.js, TypeScript, Express
- PostgreSQL, Prisma ORM
- Dockerized
- CI/CD with GitHub Actions

## Features
- POST `/api/identify` endpoint
- Contact deduplication and linking logic
- Clean architecture
- Error handling and validation

## Getting Started

### Local Development
1. Clone repo
2. `docker-compose up --build`
3. Service: http://localhost:3000

### API Example
```
POST /api/identify
{
  "email": "foo@bar.com",
  "phoneNumber": "+911234567890"
}
```

### Response
```
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["foo@bar.com"],
    "phoneNumbers": ["+911234567890"],
    "secondaryContactIds": []
  }
}
```

## Migrations
- Edit `src/prisma/schema.prisma` as needed
- Run: `docker-compose exec app npx prisma migrate dev`

## Deployment
- See `.github/workflows/deploy.yml`
