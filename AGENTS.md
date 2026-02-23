# Repository Guidelines

## Project Structure & Module Organization
This repository is a monorepo with two main apps:
- `crm-si-front/`: Next.js frontend (App Router). Core UI lives in `app/`, reusable components in `components/`, API client helpers in `lib/api/`, shared state in `store/`, and types/constants in `data/`.
- `crm-si-back/`: Laravel backend API. Business logic is in `app/`, routes in `routes/`, schema changes in `database/migrations/`, and tests in `tests/`.

Top-level `README.md` also defines branch flow (`feature/*` -> `dev` -> `test` -> `main`).

## Build, Test, and Development Commands
Frontend (`crm-si-front`):
- `npm run dev`: start local Next.js dev server.
- `npm run lint`: run Next.js lint checks.
- `npm run build && npm run start`: production build and serve.

Backend (`crm-si-back`):
- `composer install`: install PHP dependencies.
- `composer dev`: run API, queue worker, logs, and frontend dev pipeline together.
- `php artisan serve`: run API only.
- `composer test` or `php artisan test`: execute PHPUnit tests.

Docker options exist in each app (`docker-compose.yaml` / `docker-compose.yml`) for containerized runs.

## Coding Style & Naming Conventions
- Frontend: TypeScript + React function components, path aliases via `@/`, PascalCase for components (`ChatHeader.tsx`), camelCase for hooks/utilities (`useFacebookSDK.ts`), and route folders in lowercase (`app/chats/page.tsx`).
- Backend: Follow Laravel/PSR-12 conventions (4-space indentation, class-based controllers/services, FormRequest validation).
- Keep files focused; colocate helpers with their module when possible.

## Testing Guidelines
- Backend uses PHPUnit (Laravel test runner). Add feature tests for API behavior and unit tests for isolated logic.
- Frontend currently has no formal test suite configured; at minimum, run lint and verify key flows manually (auth, chats, channel onboarding).
- Test files should be descriptive, e.g. `tests/Feature/ConversationStageUpdateTest.php`.

## Commit & Pull Request Guidelines
- Prefer Conventional Commit prefixes seen in history: `feat:`, `fix:`, `ci:`, `refactor:`.
- Use branch names like `feature/<short-topic>` (example: `feature/chat-improvements`).
- Merge Requests should target `dev`, include:
  1. concise change summary,
  2. impacted modules (`crm-si-front` / `crm-si-back`),
  3. test evidence (command output and UI screenshots for frontend changes),
  4. related issue/task reference.
