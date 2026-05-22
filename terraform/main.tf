# The VPS already exists (bare SSH box), so Terraform does not *provision* a VM.
# Instead it drives the remote Docker daemon over SSH: it ensures Docker is
# present, then declares the application's network + containers as managed state.
#
# This keeps container deployment reproducible and idempotent via `terraform apply`.

provider "docker" {
  host = "ssh://${var.vps_user}@${var.vps_host}"
  ssh_opts = [
    "-i", pathexpand(var.ssh_private_key_path),
    "-o", "StrictHostKeyChecking=accept-new",
  ]
}

locals {
  backend_image  = "ghcr.io/${var.github_owner}-backend:${var.image_tag}"
  frontend_image = "ghcr.io/${var.github_owner}-frontend:${var.image_tag}"
}

# Make sure Docker is installed on the box before the provider needs it.
# (For a fuller bootstrap — firewall, monitoring stack — use the Ansible playbook.)
resource "null_resource" "ensure_docker" {
  connection {
    type        = "ssh"
    host        = var.vps_host
    user        = var.vps_user
    private_key = file(pathexpand(var.ssh_private_key_path))
  }

  provisioner "remote-exec" {
    inline = [
      "command -v docker >/dev/null 2>&1 || (curl -fsSL https://get.docker.com | sh)",
    ]
  }
}

resource "docker_network" "appnet" {
  name       = "appnet"
  depends_on = [null_resource.ensure_docker]
}

resource "docker_image" "backend" {
  name         = local.backend_image
  keep_locally = false
  depends_on   = [null_resource.ensure_docker]
}

resource "docker_image" "frontend" {
  name         = local.frontend_image
  keep_locally = false
  depends_on   = [null_resource.ensure_docker]
}

resource "docker_container" "backend" {
  name    = "tt-backend"
  image   = docker_image.backend.image_id
  restart = "unless-stopped"

  env = ["PORT=3000", "DB_PATH=/app/data/tasks.sqlite"]

  volumes {
    volume_name    = "backend-data"
    container_path = "/app/data"
  }

  networks_advanced {
    name = docker_network.appnet.name
  }
}

resource "docker_container" "frontend" {
  name    = "tt-frontend"
  image   = docker_image.frontend.image_id
  restart = "unless-stopped"

  ports {
    internal = 80
    external = 8080
  }

  networks_advanced {
    name = docker_network.appnet.name
  }

  depends_on = [docker_container.backend]
}
