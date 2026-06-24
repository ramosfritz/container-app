output "acr_login_server" {
  value       = azurerm_container_registry.acr.login_server
  description = "The login server for the Azure Container Registry"
}

output "frontend_url" {
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
  description = "The public URL of the frontend application"
}

output "backend_internal_url" {
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
  description = "The internal FQDN of the backend application"
}
