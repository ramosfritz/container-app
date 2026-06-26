# Local Manual Deployment Guide

This guide details how to manually deploy the entire containerized application (Registry, Container Apps, Workspace, Environment) directly from your local machine using the Azure CLI and Terraform.

---

## 🛠️ Prerequisites
Make sure you have the following installed on your machine:
1. **Azure CLI** (verify with `az --version`)
2. **Terraform** (verify with `terraform --version`)

---

## 🚀 Step-by-Step Deployment Instructions

Run all commands from the root of your project directory (`c:\Users\DELL\Documents\Container-App`).

### Step 1: Log in to Azure
Open your terminal and authenticate to your Azure account:
```bash
# Log in to Azure
az login

# Verify your active subscription
az account show --output table
```
*If you have multiple subscriptions, set the active subscription:*
```bash
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

---

### Step 2: Initialize Terraform
Navigate to the `terraform` directory and initialize the providers:
```bash
# Go to the terraform folder
cd terraform

# Initialize Terraform (downloads the Azure provider)
terraform init
```

---

### Step 3: Provision the Resource Group and Registry
Run a targeted apply to create the Azure Container Registry (ACR) first. This registry needs to exist before we can build and upload the Docker images.
```bash
terraform apply -target azurerm_container_registry.acr -auto-approve
```

---

### Step 4: Build and Upload Docker Images to ACR
We will use Azure CLI's **ACR Tasks** (`az acr build`) to compile and push the images directly in the cloud. This means **you do not need Docker Desktop running on your machine**.

Run these commands from the **root directory** of the project:
```bash
# Go back to the root directory
cd ..

# Build and push the Backend image
az acr build --registry acrfritzramoscontainerapp --image backend:latest ./backend

# Build and push the Frontend image
az acr build --registry acrfritzramoscontainerapp --image frontend:latest ./frontend
```

---

### Step 5: Provision the Container Apps and Environment
Now that the Docker images are stored in your registry, complete the deployment of the Log Analytics Workspace, Container Apps Environment, and the Frontend and Backend apps.

Run these commands from the **terraform directory**:
```bash
# Go back to the terraform folder
cd terraform

# Provision the remaining resources
terraform apply -auto-approve
```

Once completed, Terraform will print the public URL of your frontend application in the terminal outputs:
```text
Outputs:
frontend_url = "https://frontend-app.wonderfulcliff-af8321cd.westus.azurecontainerapps.io"
```

---

## 🧹 Tearing Down (Clean up to avoid charges)
To destroy all provisioned resources and stop any Azure charges, run this command from the `terraform` folder:
```bash
terraform destroy -auto-approve
```
*This command will cleanly remove the Resource Group, Registry, Log Analytics Workspace, Environment, and both apps.*
