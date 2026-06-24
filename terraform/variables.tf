variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
  default     = "rg-fritz-ramos-container-app"
}

variable "location" {
  type        = string
  description = "Azure region where resources will be created"
  default     = "eastus"
}

variable "acr_name" {
  type        = string
  description = "Name of the Azure Container Registry (globally unique alphanumeric)"
  default     = "acrfritzramoscontainerapp"
}

variable "environment_name" {
  type        = string
  description = "Name of the Container Apps Environment"
  default     = "aca-env-fritz-ramos"
}

variable "backend_image_tag" {
  type        = string
  description = "Docker image tag for the backend container"
  default     = "latest"
}

variable "frontend_image_tag" {
  type        = string
  description = "Docker image tag for the frontend container"
  default     = "latest"
}
