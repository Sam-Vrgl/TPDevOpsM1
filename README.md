# DevOps Task Tracker — Full-Toolchain DevOps Deployment

A minimal CRUD task tracker used as a vehicle to demonstrate an end-to-end DevOps
toolchain: **containerization → CI/CD → Infrastructure as Code → observability**.

| Layer        | Tech                                              |
|--------------|---------------------------------------------------|
| Frontend     | React + Vite (TypeScript), served by Nginx        |
| Backend      | Bun + TypeScript, `bun:sqlite`                     |
| Containers   | Docker + Docker Compose                            |
| CI/CD        | GitHub Actions → GitHub Container Registry (GHCR)  |
| IaC          | Terraform (Docker-over-SSH) + Ansible             |
| Monitoring   | Prometheus, Grafana, Node Exporter, cAdvisor      |

## Architecture

```
Browser ──▶ Nginx (frontend :8080) ──/api──▶ Bun backend (:3000) ──▶ SQLite
                                                     │
Prometheus (:9090) ◀── scrapes ── node-exporter (:9100), cadvisor (:8081), backend /metrics
        │
        ▼
   Grafana (:3001)  ── auto-provisioned dashboard
```

## Repository layout

```
backend/      Bun API (CRUD + /health + /metrics) and its Dockerfile
frontend/     React SPA, multi-stage Dockerfile (Bun build → Nginx)
monitoring/   Prometheus config + Grafana datasource/dashboard provisioning
terraform/    Deploy containers to an existing VPS over SSH
ansible/      Configure the VPS (Docker, firewall, deploy) + prod compose file
.github/workflows/ci-cd.yml   Build → test → push to GHCR → optional SSH deploy
docker-compose.yml            Local full stack + monitoring
```

## Run locally

Prerequisites: Docker + Docker Compose.

```bash
docker compose up --build -d
```

| Service     | URL                          | Notes               |
|-------------|------------------------------|---------------------|
| Frontend    | http://localhost:8080        | the app UI          |
| Backend     | http://localhost:3000        | API (`/api/tasks`)  |
| Prometheus  | http://localhost:9090        | check `/targets`    |
| Grafana     | http://localhost:3001        | login `admin`/`admin` |
| cAdvisor    | http://localhost:8081        | container metrics   |

Open Grafana → **DevOps Task Tracker** dashboard (auto-provisioned) for host +
container metrics. This populated dashboard is the monitoring deliverable.

### Backend dev (without Docker)

```bash
cd backend
bun install
bun test          # runs db.test.ts
bun run dev       # http://localhost:3000
```

### Frontend dev (without Docker)

```bash
cd frontend
bun install
bun run dev       # http://localhost:5173, proxies /api → :3000
```

## CI/CD pipeline

`.github/workflows/ci-cd.yml` runs on every push/PR to `main`:

1. **build-test** — installs deps, runs `bun test`, builds the frontend.
2. **build-push** (push to `main` only) — builds both Docker images and pushes
   them to GHCR as `ghcr.io/<owner>/<repo>-backend` and `-frontend`
   (`latest` + commit SHA tags). Uses the built-in `GITHUB_TOKEN`.
3. **deploy** (opt-in) — SSHes to the VPS and runs `docker compose pull && up -d`.
   Skipped automatically unless the `VPS_HOST` secret is set.

### Required GitHub secrets (only for the deploy step)

| Secret        | Purpose                          |
|---------------|----------------------------------|
| `VPS_HOST`    | VPS IP / hostname                |
| `VPS_USER`    | SSH user                         |
| `VPS_SSH_KEY` | private SSH key (PEM)            |

> Make the GHCR packages public, or grant the VPS a token, so images can be pulled.

## Infrastructure as Code

### Terraform — deploy containers to an existing VPS

The VPS already exists, so Terraform doesn't create a VM; it drives the remote
Docker daemon over SSH (`kreuzwerker/docker` provider) and declares the network +
containers as managed state.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in host, user, key, owner
terraform init
terraform validate
terraform apply
```

### Ansible — configure the VPS

Installs Docker + Compose, configures UFW, ships the production compose +
monitoring config, logs in to GHCR, and brings the stack up.

```bash
cd ansible
cp inventory.ini.example inventory.ini         # set host/user/key
ansible-playbook -i inventory.ini playbook.yml \
  -e "ghcr_owner=<owner>/<repo> ghcr_user=<user> ghcr_token=<token>"
```

## Monitoring details

- **Node Exporter** → host CPU / memory / network.
- **cAdvisor** → per-container CPU / memory / uptime (`tt-*` containers).
- **Backend `/metrics`** → app uptime, request counter, task count.
- Grafana datasource and the dashboard are provisioned automatically from
  `monitoring/grafana/provisioning/` — no manual setup.
