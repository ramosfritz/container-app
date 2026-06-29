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
az account set --subscription "312af5ea-e2a5-4232-8674-703521f18a74"
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

### Part 3: Build & Push Images (ACR Build vs. Local Docker Build)

Because the Azure Portal GUI does not compile raw code files into Docker images, you must build and push the images once from your local machine before deploying the Container Apps.

Choose **one** of the two methods below to build and upload your images:

#### Option A: Build in the Cloud using Azure CLI (No Local Docker Required)
This is the easiest method if you do not have Docker Desktop running on your machine.
Run these commands from your local project root:
```bash
# Build and push the Backend
az acr build --registry acrfritzramoscontainerapp --image backend:latest ./backend

# Build and push the Frontend
az acr build --registry acrfritzramoscontainerapp --image frontend:latest ./frontend
```

#### Option B: Build Locally using Docker CLI (Requires Docker Desktop Running)
Use this method if you have Docker Desktop running locally and want to build the containers on your machine:

1. **Log in to your Azure Container Registry via Docker**:
   ```bash
   az acr login --name acrfritzramoscontainerapp
   ```
2. **Build and Tag the Images Locally**:
   Run these commands from your local project root:
   ```bash
   # Build & Tag Backend
   docker build -t acrfritzramoscontainerapp.azurecr.io/backend:latest ./backend

   # Build & Tag Frontend
   docker build -t acrfritzramoscontainerapp.azurecr.io/frontend:latest ./frontend
   ```
3. **Push the Images to your Azure Container Registry**:
   ```bash
   # Push Backend
   docker push acrfritzramoscontainerapp.azurecr.io/backend:latest

   # Push Frontend
   docker push acrfritzramoscontainerapp.azurecr.io/frontend:latest
   ```

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

## 🐳 Hybrid Deployment: Docker Terminal + Azure Portal GUI (Alternative)

This hybrid deployment method is ideal if you want to build and tag the Docker containers locally in your terminal, upload them to Azure Container Registry (ACR), and then use the graphical Azure Portal interface to configure the environment and deploy the Container Apps.

> [!NOTE]
> Ensure you have **Docker Desktop** running on your local machine before starting.

### Step 1: Create the Resource Group and Azure Container Registry (ACR) in the Azure Portal

Before you can log in, build, or upload your Docker containers, you must create a Resource Group and an Azure Container Registry (ACR) inside the Azure Portal.

#### 1. Create a Resource Group:
1. Sign in to the [Azure Portal](https://portal.azure.com).
2. Search for **Resource groups** in the top search bar and click it.
3. Click **+ Create**.
4. Configure the details:
   - **Subscription**: Select your active subscription (e.g., `PAYG-Basic`).
   - **Resource group**: Enter `rg-fritz-ramos-container-app`.
   - **Region**: Select `East US` (or your preferred registry location).
5. Click **Review + create**, then click **Create**.

#### 2. Create the Azure Container Registry (ACR):
1. Search for **Container registries** in the search bar and click it.
2. Click **+ Create**.
3. Configure the details:
   - **Resource group**: Select `rg-fritz-ramos-container-app`.
   - **Registry name**: Enter `acrfritzramoscontainerapp` (must be unique).
   - **Location**: Select `West US` (or matching your preferred app region).
   - **SKU**: Select `Basic`.
4. Click **Review + create**, then click **Create**.
5. **Enable Admin Access (Required)**:
   - Once the registry is created, navigate to the registry resource in the portal.
   - In the left menu under **Settings**, click **Access keys**.
   - Check the **Enabled** box for the **Admin user** field (this allows your Container Apps to log in and pull images).

---

### Step 2: Build the Docker Images Locally
Open your terminal at the root directory of the project (`c:\Users\DELL\Documents\Container-App`) and execute these commands:

1. **Log in to your Azure Container Registry**:
   ```bash
   az acr login --name acrfritzramoscontainerapp
   ```
2. **Build and Tag the Backend Image**:
   ```bash
   docker build -t acrfritzramoscontainerapp.azurecr.io/backend:latest ./backend
   ```
3. **Build and Tag the Frontend Image**:
   ```bash
   docker build -t acrfritzramoscontainerapp.azurecr.io/frontend:latest ./frontend
   ```

---

### Step 3: Upload (Push) the Images to ACR
Push the locally built images from your machine to your Azure Container Registry:

```bash
# Upload Backend Image
docker push acrfritzramoscontainerapp.azurecr.io/backend:latest

# Upload Frontend Image
docker push acrfritzramoscontainerapp.azurecr.io/frontend:latest
```

---

### Step 4: Deploy the Backend Container App (and Create the Environment)
To create the Container Apps Environment, we will create the Backend Container App first. The Azure Portal lets you create the Environment directly from the Container App creation wizard.

1. Search for **Container Apps** in the top search bar and click it.
2. Click **+ Create**.
3. Configure the **Basics** tab:
   - **Resource group**: Select `rg-fritz-ramos-container-app`.
   - **Container app name**: Enter `backend-app`.
   - **Region**: Select `West US` (or matching your preferred region).
   - **Container Apps Environment**: Click **Create new**.
     - **Environment name**: Enter `aca-env-fritz-ramos-west`.
     - Go to the **Monitoring** tab, and select `law-fritz-ramos-west` as the Log Analytics workspace (or click Create new for the workspace if it does not exist).
     - Click **Create** to save the environment.
4. Click **Next: Container >** and configure the container settings:
   - Uncheck **Use quickstart image**.
   - **Name**: `backend`.
   - **Image source**: Select **Azure Container Registry**.
   - **Registry**: Select `acrfritzramoscontainerapp`.
   - **Image**: Select `backend`.
   - **Image tag**: Select `latest`.
   - **CPU and Memory**: Select `0.25 CPU cores, 0.5 Gi memory`.
5. Click **Next: Ingress >** and configure network ingress:
   - **Ingress**: Check **Enabled**.
   - **Target port**: Enter `5000`.
   - **Ingress traffic**: Select **Limited to Container Apps Environment** (Internal ingress for backend security).
6. Click **Review + create**, then click **Create**.
7. Once deployed, navigate to the backend container app resource and copy its internal **FQDN** (e.g., `https://backend-app.internal.wonderfulcliff-af8321cd.westus.azurecontainerapps.io`).

---

### Step 5: Deploy the Frontend Container App
1. Go back to **Container Apps** in the Azure Portal and click **+ Create**.
2. Configure the **Basics** tab:
   - **Resource group**: Select `rg-fritz-ramos-container-app`.
   - **Container app name**: Enter `frontend-app`.
   - **Region**: Select `West US`.
   - **Container Apps Environment**: Select the existing `aca-env-fritz-ramos-west` that you created in the step above.
3. Click **Next: Container >** and configure the container settings:
   - Uncheck **Use quickstart image**.
   - **Name**: `frontend`.
   - **Image source**: Select **Azure Container Registry**.
   - **Registry**: Select `acrfritzramoscontainerapp`.
   - **Image**: Select `frontend`.
   - **Image tag**: Select `latest`.
   - **Environment variables**: Add the following:
     - Name: `PORT` | Value: `3000`
     - Name: `BACKEND_URL` | Value: *[Paste the Backend FQDN you copied in the step above]*
4. Click **Next: Ingress >** and configure network ingress:
   - **Ingress**: Check **Enabled**.
   - **Target port**: Enter `3000`.
   - **Ingress traffic**: Select **Accepting traffic from anywhere** (External ingress).
5. Click **Review + create**, then click **Create**.
6. Once deployed, navigate to the frontend container app resource and click the **Application Url** to open the live application!

---

## 🔄 How to Redeploy Updates & Code Edits (Manual)

If you modify the frontend website files, the backend code, or styles, you must rebuild the Docker images, push them to your registry, and tell Azure Container Apps to update and pull the new container.

### Step 1: Rebuild and Push the Updated Image
Choose either option based on your environment:

#### Option A: Using Azure CLI Cloud Build (No Local Docker)
Run this from the project root (replace `frontend` with `backend` if you updated the API):
```bash
az acr build --registry acrfritzramoscontainerapp --image frontend:latest ./frontend
```

#### Option B: Using Local Docker CLI
Run these from the project root:
```bash
# Rebuild image locally
docker build -t acrfritzramoscontainerapp.azurecr.io/frontend:latest ./frontend

# Push updated image to ACR
docker push acrfritzramoscontainerapp.azurecr.io/frontend:latest
```

---

### Step 2: Trigger the Redeployment in Azure
Simply pushing the image to ACR does not automatically notify Container Apps to deploy it. You must trigger a new revision deployment using one of the methods below:

#### Method 1: Using the Azure CLI (Fastest)
Run this command to force the Container App to pull the new image and roll out a new revision:
```bash
az containerapp update \
  --name frontend-app \
  --resource-group rg-fritz-ramos-container-app \
  --image acrfritzramoscontainerapp.azurecr.io/frontend:latest
```
*(If you updated the backend instead, replace `frontend-app` and the image name with `backend-app` and `backend:latest` respectively).*

#### Method 2: Using the Azure Portal GUI (Point and Click)
1. In the portal, navigate to **Container Apps** and select your app (e.g. `frontend-app`).
2. In the left menu under **Application**, click on **Containers**.
3. Click the **Edit and deploy** button in the top menu.
4. Click on the container row (e.g. `frontend`) and click **Edit**.
5. In the flyout panel, verify that the image tag is set to `latest`, and click **Save**.
6. Click the **Create** button at the bottom of the screen.
*This creates a new revision, which forces Azure to contact your Container Registry, pull the newly uploaded container image, and route traffic to the updated container.*

---

## ⏪ How to Roll Back to a Previous Revision (Troubleshooting)

If a new deployment contains bugs, crashes, or is otherwise broken, you can roll back your Container App to a previously working version. The exact steps depend on your app's **Revision Mode** (Single vs. Multiple).

---

### Case A: If your app is in Single Revision Mode (Default)
In Single revision mode, updating your Container App automatically creates a new revision, routes 100% of traffic to it, and deactivates the older one.

#### Method 1: Re-deploy the older working Docker image (Recommended)
The most reliable way to roll back is to re-deploy the older working image tag:
```bash
# Redeploy Backend to older version (e.g. backend:v1.0 or backend:latest if you reverted the registry tag)
az containerapp update \
  --name backend-app \
  --resource-group rg-fritz-ramos-container-app \
  --image acrfritzramoscontainerapp.azurecr.io/backend:<working-tag>

# Redeploy Frontend to older version
az containerapp update \
  --name frontend-app \
  --resource-group rg-fritz-ramos-container-app \
  --image acrfritzramoscontainerapp.azurecr.io/frontend:<working-tag>
```

#### Method 2: Switch to Multiple Revision Mode to reactivate an old revision
To reactivate a previous revision directly without building/pushing another image:
1. Navigate to your Container App (e.g., `frontend-app`) in the **Azure Portal**.
2. In the left menu under **Application**, click on **Revision management**.
3. At the top of the screen, click **Choose revision mode** and select **Multiple** (this allows more than one revision to exist and be active). Click **Save**.
4. In the list of revisions below, locate the last working revision (you can identify it by its creation timestamp).
5. Click on that revision, and in the right pane or toolbar, check/ensure that it is **Active**.
6. Set the traffic splitting percentage:
   - For your **working revision**: Enter `100` (%)
   - For the **broken revision**: Enter `0` (%)
7. Click **Save** to route all user traffic back to the stable version.

---

### Case B: If your app is in Multiple Revision Mode
If you already have Multiple revision mode enabled, you can route traffic to your older stable revision instantly.

#### Method 1: Using the Azure CLI (Fastest)
1. **List all revisions** of your app to find the name of the working revision:
   ```bash
   az containerapp revision list \
     --name frontend-app \
     --resource-group rg-fritz-ramos-container-app \
     --output table
   ```
   *Copy the revision name (e.g., `frontend-app--r1a2b3c`) of the working revision.*

2. **Shift 100% of traffic** to the working revision:
   ```bash
   az containerapp ingress traffic set \
     --name frontend-app \
     --resource-group rg-fritz-ramos-container-app \
     --traffic <WORKING_REVISION_NAME>=100
   ```
   *(Replace `<WORKING_REVISION_NAME>` with the revision name you copied).*

#### Method 2: Using the Azure Portal GUI
1. Navigate to your Container App in the **Azure Portal**.
2. In the left menu under **Application**, click on **Revision management**.
3. Under the **Traffic allocation** or **Revisions** table, find the row of the working revision.
4. Update the **Traffic %** column:
   - Set the working revision to `100`.
   - Set the broken revision to `0`.
5. Click **Save** at the top. The traffic will instantly cut over to the working revision.

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
