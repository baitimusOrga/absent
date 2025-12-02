# Absent Project Guide for Agents

## Project Overview
Absent aims to give students a web app where they submit their Schulnetz calendar URL and receive an automatically prepared absence form ready to hand to their teachers. The platform consists of a TypeScript backend service and an Angular frontend application, orchestrated with Docker. MongoDB provides persistent storage. The project ships with development and production Docker Compose configurations to simplify local development, testing, and deployment.

## Architecture
- **Backend**: Node.js + TypeScript (Express-style API) located in `src/backend`, exposes HTTP APIs and connects to MongoDB.
- **Frontend**: Angular SPA located in `src/frontend`, communicates with the backend through REST endpoints.
- **Database**: MongoDB container defined under `src/database` for local development and production deployment.
- **Container Orchestration**: Docker Compose files at the repository root (`docker-compose.yml`, `docker-compose.prod.yml`) describe multi-service environments.

## Repository Structure
```
.
├── docker-compose.yml                # Development compose stack
├── docker-compose.prod.yml           # Production compose stack
├── README.md                         # High-level project instructions
└── src/
    ├── backend/
    │   ├── Dockerfile                # Dev image for backend service
    │   ├── Dockerfile.prod           # Production image for backend
    │   ├── package.json              # Backend dependencies and scripts
    │   ├── tsconfig.json             # TypeScript configuration for backend
    │   └── src/
    │       ├── app.ts                # Express app configuration
    │       ├── server.ts             # Backend entry point
    │       ├── db/mongo.ts           # MongoDB connection helper
    │       └── routes/health.ts      # Health check route
    ├── database/
    │   ├── Dockerfile                # Dev image for MongoDB
    │   └── Dockerfile.prod           # Production image for MongoDB
    └── frontend/
        ├── Dockerfile                # Dev image for Angular
        ├── Dockerfile.prod           # Production image for Angular
        ├── angular.json              # Angular workspace config
        ├── package.json              # Frontend dependencies and scripts
        ├── src/                      # Angular application source
        │   ├── main.ts               # Angular bootstrap file
        │   └── app/                  # App components, routes, tests
        └── environments/             # Environment-specific configuration
```

## Agent Rules & Responsibilities
1. **Maintain Consistency**: Follow existing patterns for coding style, project structure, and dependency management in both backend (`src/backend`) and frontend (`src/frontend`).
2. **Document Changes**: Update relevant README or configuration notes when modifying build commands, infrastructure, or environment variables.
3. **Preserve Docker Compatibility**: Ensure any new services or dependencies integrate cleanly with the Dockerfiles and Compose stacks.
4. **Testing Discipline**: Run unit and integration tests pertinent to modified areas. Add new tests for new logic and keep existing tests green.
5. **Security Awareness**: Avoid committing secrets. Configure sensitive values through environment variables consumed by Docker Compose files.
6. **Code Review Readiness**: Keep commits focused and provide clear descriptions of changes, impacts, and testing performed.

## Development Workflow
- **Backend**: Use `npm install` and `npm run start:dev` (or Docker) to iterate on APIs.
- **Frontend**: Use Angular CLI commands (`npm run start` or `ng serve`) or the frontend Docker setup.
- **Database**: MongoDB container is available via Docker Compose; ensure connection strings match `mongo.ts` expectations.

## Deployment Notes
- Production images rely on `Dockerfile.prod` files for backend, frontend, and database.
- `docker-compose.prod.yml` orchestrates the production-ready stack; ensure environment variables and networking match target infrastructure.

For additional details, consult the root `README.md` and service-specific documentation within each directory.
