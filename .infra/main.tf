locals {
  service_prefix = "pwdgame"
}

terraform {
  backend "azurerm" {
    container_name = "tfstate"
    # Remaining parameters from '-backend-config' arguments
  }
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.48.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "random_string" "service_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Create Resource Group
resource "azurerm_resource_group" "main_rg" {
  name     = var.azure_resource_group_name
  location = var.azure_region
}

resource "azurerm_application_insights" "main_ai" {
  depends_on = [azurerm_resource_group.main_rg]
  name                = "${local.service_prefix}-ai-${random_string.service_suffix.id}"
  location            = azurerm_resource_group.main_rg.location
  resource_group_name = azurerm_resource_group.main_rg.name
  application_type    = "web"
  timeouts {
    create = "10m"
  }  
}

resource "azurerm_storage_account" "main_storage" {
  depends_on = [azurerm_application_insights.main_ai]
  name                     = "${local.service_prefix}stg${random_string.service_suffix.id}"
  location                 = azurerm_resource_group.main_rg.location
  resource_group_name      = azurerm_resource_group.main_rg.name
  account_kind             = "StorageV2"
  account_tier             = "Standard"
  account_replication_type = "LRS"
  access_tier              = "Hot"
  timeouts {
    create = "10m"
  }  
}

# Static Web Apps for frontends (no service plan quota required)
resource "azurerm_static_web_app" "cat_game" {
  depends_on = [azurerm_storage_account.main_storage]
  name                = "${local.service_prefix}-cat-game-${random_string.service_suffix.id}"
  location            = azurerm_resource_group.main_rg.location
  resource_group_name = azurerm_resource_group.main_rg.name
  sku_tier            = "Free"
  sku_size            = "Free"
}

resource "azurerm_static_web_app" "dog_game" {
  depends_on = [azurerm_static_web_app.cat_game]
  name                = "${local.service_prefix}-dog-game-${random_string.service_suffix.id}"
  location            = azurerm_resource_group.main_rg.location
  resource_group_name = azurerm_resource_group.main_rg.name
  sku_tier            = "Free"
  sku_size            = "Free"
}

resource "azurerm_signalr_service" "chat_service" {
  depends_on = [azurerm_linux_web_app.dog_game]
  name                = "${local.service_prefix}-signalr-${random_string.service_suffix.id}"
  location            = azurerm_resource_group.main_rg.location
  resource_group_name = azurerm_resource_group.main_rg.name
  sku {
    name     = "Free_F1"
    capacity = 1
  }
  cors {
    allowed_origins = [
      "https://${azurerm_linux_web_app.cat_game.default_hostname}",
      "https://${azurerm_linux_web_app.dog_game.default_hostname}",
    ]
  }
  service_mode = "Serverless"
  timeouts {
    create = "10m"
  }  
}

resource "azurerm_linux_function_app" "backend_api" {
  depends_on = [azurerm_signalr_service.chat_service]
  name                       = "${local.service_prefix}-backend-api-${random_string.service_suffix.id}"
  location                   = azurerm_resource_group.main_rg.location
  resource_group_name        = azurerm_resource_group.main_rg.name
  storage_account_name       = azurerm_storage_account.main_storage.name
  storage_account_access_key = azurerm_storage_account.main_storage.primary_access_key
  https_only                 = true
  app_settings = {
    "NODE_ENV"                       = "production",
    "StorageAccountConnectionString" = azurerm_storage_account.main_storage.primary_connection_string
    "SignalRConnectionString"        = azurerm_signalr_service.chat_service.primary_connection_string
    "WEBSITE_RUN_FROM_PACKAGE"       = 1
  }
  site_config {
    application_insights_key = azurerm_application_insights.main_ai.instrumentation_key
    application_stack {
      node_version = 18
    }
    cors {
      allowed_origins = [
        "https://${azurerm_static_web_app.cat_game.default_static_web_app_url}",
        "https://${azurerm_static_web_app.dog_game.default_static_web_app_url}",
      ]
      support_credentials = true
    }
  }
  timeouts {
    create = "10m"
  }  
}

output "app_insights_instrumentation_key" {
  value     = azurerm_application_insights.main_ai.instrumentation_key
  sensitive = true
}

output "cat_game_url" {
  value = azurerm_static_web_app.cat_game.default_static_web_app_url
}

output "dog_game_url" {
  value = azurerm_static_web_app.dog_game.default_static_web_app_url
}

output "backend_api_func_app_name" {
  value = azurerm_linux_function_app.backend_api.name
}

output "backend_api_func_app_hostname" {
  value = azurerm_linux_function_app.backend_api.default_hostname
}
