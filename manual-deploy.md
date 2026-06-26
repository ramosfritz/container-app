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

## 🖱️ Point-and-Click Azure Portal GUI Instructions (Alternative)

If you prefer to deploy manually using the **Azure Portal graphical interface**, follow these step-by-step instructions.

### Part 1: Create a Resource Group
1. Sign in to the [Azure Portal](https://portal.azure.com).
2. Search for **Resource groups** in the top search bar and click it.
3. Click **+ Create**.
4. Configure the details:
   - **Subscription**: Select your active subscription (e.g., `PAYG-Basic`).
   - **Resource group**: Enter `rg-fritz-ramos-container-app`.
   - **Region**: Select `East US` (or your preferred registry location).
5. Click **Review + create**, then click **Create**.

---

### Part 2: Create Azure Container Registry (ACR)
1. Search for **Container registries** in the search bar and click it.
2. Click **+ Create**.
3. Configure the details:
   - **Resource group**: Select `rg-fritz-ramos-container-app`.
   - **Registry name**: Enter `acrfritzramoscontainerapp` (must be unique).
   - **Location**: Select `West US` (or matching your preferred app region).
   - **SKU**: Select `Basic`.
4. Click **Review + create**, then click **Create**.
5. **Enable Admin Access**:
   - Once the registry is created, navigate to it in the portal.
   - In the left menu under **Settings**, click **Access keys**.
   - Check the **Enabled** box for the **Admin user** field (this exposes the username and password that the Container Apps will use to pull images).

---

### Part 3: Build & Push Images
> [!NOTE]
> The Azure Portal GUI does not compile raw code files into Docker images. You must push the images once using the Azure CLI from your local project root:
> ```bash
> az acr build --registry acrfritzramoscontainerapp --image backend:latest ./backend
> az acr build --registry acrfritzramoscontainerapp --image frontend:latest ./frontend
> ```

---

### Part 4: Create a Log Analytics Workspace
1. Search for **Log Analytics workspaces** in the top search bar and click it.
2. Click **+ Create**.
3. Configure the details:
   - **Resource group**: Select `rg-fritz-ramos-container-app`.
   - **Name**: Enter `law-fritz-ramos-west`.
   - **Region**: Select `West US`.
4. Click **Review + create**, then click **Create**.

---

### Part 5: Deploy the Backend Container App
1. Search for **Container Apps** in the top search bar and click it.
2. Click **+ Create**.
3. Configure the **Basics** tab:
   - **Resource group**: Select `rg-fritz-ramos-container-app`.
   - **Container app name**: Enter `backend-app`.
   - **Region**: Select `West US`.
   - **Container Apps Environment**: Click **Create new**.
     - **Environment name**: Enter `aca-env-fritz-ramos-west`.
     - Go to the **Monitoring** tab, and select `law-fritz-ramos-west` as the Log Analytics workspace.
     - Click **Create** to save the environment.
4. Click **Next: Container >** and configure the container settings:
   - Uncheck **Use quickstart image**.
   - **Name**: `backend`.
   - **Image source**: Select `Azure Container Registry`.
   - **Registry**: Select `acrfritzramoscontainerapp`.
   - **Image**: Select `backend`.
   - **Image tag**: Select `latest`.
   - **CPU and Memory**: Select `0.25 CPU cores, 0.5 Gi memory`.
5. Click **Next: Ingress >** and configure network ingress:
   - **Ingress**: Check **Enabled**.
   - **Target port**: Enter `5000`.
   - **Ingress traffic**: Select **Limited to Container Apps Environment** (Internal ingress for security).
6. Click **Review + create**, then click **Create**.
7. **Copy FQDN**: Once deployed, go to the resource and copy the **FQDN** URL (e.g. `https://backend-app.internal...`). We need this for the frontend configuration.

---

### Part 6: Deploy the Frontend Container App
1. Search for **Container Apps** in the top search bar and click it.
2. Click **+ Create**.
3. Configure the **Basics** tab:
   - **Resource group**: Select `rg-fritz-ramos-container-app`.
   - **Container app name**: Enter `frontend-app`.
   - **Region**: Select `West US`.
   - **Container Apps Environment**: Select the existing `aca-env-fritz-ramos-west`.
4. Click **Next: Container >** and configure the container settings:
   - Uncheck **Use quickstart image**.
   - **Name**: `frontend`.
   - **Image source**: Select `Azure Container Registry`.
   - **Registry**: Select `acrfritzramoscontainerapp`.
   - **Image**: Select `frontend`.
   - **Image tag**: Select `latest`.
   - **CPU and Memory**: Select `0.25 CPU cores, 0.5 Gi memory`.
   - **Environment variables**: Add the following:
     - Name: `PORT` | Value: `3000`
     - Name: `BACKEND_URL` | Value: Paste the Backend FQDN you copied (e.g. `https://backend-app.internal...`)
5. Click **Next: Ingress >** and configure network ingress:
   - **Ingress**: Check **Enabled**.
   - **Target port**: Enter `3000`.
   - **Ingress traffic**: Select **Accepting traffic from anywhere** (External ingress).
6. Click **Review + create**, then click **Create**.
7. **Open App**: Once deployed, navigate to the frontend app resource and click the **Application Url** at the top right to open the live site!

---

## 🧹 Tearing Down (Clean up to avoid charges)

### If Deployed via Terraform:
Run this command from the `terraform` folder:
```bash
terraform destroy -auto-approve
```

### If Deployed via Azure Portal (Point and Click):
1. Navigate to **Resource groups** in the portal.
2. Select `rg-fritz-ramos-container-app`.
3. Click **Delete resource group** in the top menu.
4. Type the name of the resource group to confirm, and click **Delete**.
*This will automatically remove all services, databases, registries, and environments inside it, stopping any Azure charges.*
