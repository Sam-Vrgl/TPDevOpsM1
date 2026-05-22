output "app_url" {
  description = "URL where the frontend is reachable on the VPS."
  value       = "http://${var.vps_host}:8080"
}

output "backend_container_id" {
  value = docker_container.backend.id
}

output "frontend_container_id" {
  value = docker_container.frontend.id
}
