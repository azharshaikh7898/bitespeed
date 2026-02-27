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
