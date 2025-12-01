# Absent Platform

Full-stack starter that pairs an Express (TypeScript) API with an Angular + Tailwind UI.

## Local Development

- Install dependencies once: `npm install` inside `src/backend` and `src/frontend`.
- Populate environment defaults with the provided `.env.development` file.
- Start everything with Docker Compose:
	```powershell
	docker compose --env-file .env.development up --build
	```
- The dev compose file builds from per-service `Dockerfile` definitions that mount source code for live reloading.
- Angular dev server runs on `http://localhost:4200`; API is proxied through `/api`.

## Production Images

- Build and push production-ready images (also used by the GitHub Actions templates):
	```powershell
	docker compose -f docker-compose.prod.yml build
	docker compose -f docker-compose.prod.yml push
	```
- `docker-compose.prod.yml` publishes two images per release: `${APP_NAME}-backend` and `${APP_NAME}-frontend`.
- Production builds use `Dockerfile.prod` inside each service directory so local dev images remain lightweight.

## Environment Variables

- `.env.development` holds local defaults for Docker Compose and services.
- CI pipelines overwrite `.env` on the fly to inject the project slug and registry settings.
- Both compose files fall back to sane defaults if variables are missing, so interactive use remains simple.