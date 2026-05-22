variable "vps_host" {
  description = "IP or hostname of the existing VPS (bare SSH box)."
  type        = string
}

variable "vps_user" {
  description = "SSH user with Docker access on the VPS."
  type        = string
  default     = "root"
}

variable "ssh_private_key_path" {
  description = "Path to the private SSH key used to reach the VPS."
  type        = string
  default     = "~/.ssh/id_ed25519"
}

variable "github_owner" {
  description = "GitHub owner/org used to build the GHCR image references (e.g. 'myuser/tpdevopsm1')."
  type        = string
}

variable "image_tag" {
  description = "Image tag to deploy from GHCR."
  type        = string
  default     = "latest"
}
