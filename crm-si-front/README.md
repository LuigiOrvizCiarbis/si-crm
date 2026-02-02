## Running the Project with Docker

This project is containerized using Docker and Docker Compose for consistent development and deployment. Below are the project-specific instructions and requirements for running the application in a Dockerized environment.

### Project-Specific Docker Requirements
- **Node.js version:** 22.14.0 (as specified by `NODE_VERSION` build arg)
- **pnpm version:** 10.4.1 (as specified by `PNPM_VERSION` build arg)
- **Build system:** Uses `pnpm` for dependency management and build scripts
- **Build output:** The application is built into the `dist/` directory and started with `node dist/server.js`
- **User:** Runs as a non-root user (`appuser`) for security

### Environment Variables
- No required environment variables are specified in the Dockerfile or compose file by default.
- For WebSockets (Laravel Reverb) add the following to your `.env.local` or Docker `env_file`:

```bash
NEXT_PUBLIC_REVERB_APP_KEY=local-key
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

These mirror the backend `.env` Reverb values. Frontend uses them to initialize Laravel Echo.

### Build and Run Instructions
1. **Build and start the application:**
   ```sh
   docker compose up --build
   ```
   This will build the Docker image using the provided `Dockerfile` and start the service defined in `docker-compose.yaml`.

2. **Access the application:**
   - The main application will be available at [http://localhost:3000](http://localhost:3000) (port 3000 is exposed and mapped).

### Ports
- **3000:** Main application port (exposed by the Dockerfile and mapped in `docker-compose.yaml`)

### Special Configuration
- If your application requires additional services (e.g., databases, caches), add them to the `docker-compose.yaml` under `services:` and configure `depends_on` as needed.
- For persistent data or custom networks, uncomment and configure the `volumes:` and `networks:` sections in the compose file.

---

### Reverb Local Testing

After starting the backend with its `composer dev` script (which launches `reverb:start`), you can visit `/admin/reverb-test` (once created) to verify live events. Ensure you are authenticated so the broadcasting auth endpoint returns 200.

_These instructions are specific to this project's Docker setup. For further customization, refer to the comments in the provided `docker-compose.yaml` and `Dockerfile`._
