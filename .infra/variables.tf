# You can use a '.tfvars' file to supply values for these variables or provide them at execution time.
# read more here: https://www.terraform.io/docs/configuration/variables.html

variable "azure_environment" {
  type        = string
  description = "The Azure cloud to deploy to (possible values are public, usgovernment, german, and china)."
  default     = "public"
}

variable "azure_region" {
  description = "The Azure region in which to deploy the resource group"
  type        = string
  default     = "westus2"
}

variable "azure_resource_group_name" {
  type        = string
  description = "The name of the resource group that was setup with the Service Principal as owner where resources will be deployed"
}