# Containerized Azure App Deployment with Terraform & GitHub Actions

This repository contains a containerized web application consisting of a Node.js API backend and a high-aesthetic, glassmorphic HTML/JS/CSS frontend. The application is designed to be deployed to Azure Container Apps (ACA) using Terraform for infrastructure provisioning and GitHub Actions for continuous integration and deployment.

The application includes:
- **Welcome message**: "Welcome to Azure App Container by Fritz Ramos"
- **Sub-heading**: "This is the latest version of the app"
- **Dynamic Connection Status**: Shows a green glowing "ok" status badge when connected to the backend, or a red "disconnected" status badge when the backend is unreachable.
- **Premium Styling**: Large, modern typography, sleek gradients, a glassmorphic card interface, and subtle animations.

---

## 📂 File Directory Structure

- **Backend Application** (`backend/`)
  - [package.json](backend/package.json) &mdash; Lists dependencies.
  - [server.js](backend/server.js) &mdash; Simple Express API hosting `/api/status`.
  - [Dockerfile](backend/Dockerfile) &mdash; Packs the backend application.
- **Frontend Application** (`frontend/`)
  - [package.json](frontend/package.json) &mdash; Lists dependencies.
  - [server.js](frontend/server.js) &mdash; Serves static files and proxies `/api/status` to prevent CORS issues.
  - [public/index.html](frontend/public/index.html) &mdash; Clean, modern structure with custom SVGs and Google Fonts.
  - [public/style.css](frontend/public/style.css) &mdash; Premium dark glassmorphism theme, larger fonts, and glowing status animations.
  - [public/app.js](frontend/public/app.js) &mdash; Client-side code that polls the backend status and updates the UI.
  - [Dockerfile](frontend/Dockerfile) &mdash; Packs the frontend application.
- **Orchestration**
  - [docker-compose.yml](docker-compose.yml) &mdash; Runs backend & frontend containers locally on a shared network.
- **Infrastructure (Terraform)** (`terraform/`)
  - [providers.tf](terraform/providers.tf) &mdash; Configures the Azure provider.
  - [variables.tf](terraform/variables.tf) &mdash; Standardizes naming variables and default regions.
  - [main.tf](terraform/main.tf) &mdash; Provisions the Resource Group, ACR, Log Analytics, ACA Environment, and the Frontend/Backend Container Apps.
  - [outputs.tf](terraform/outputs.tf) &mdash; Outputs URLs and registry parameters.
- **CI/CD Pipeline**
  - [.github/workflows/deploy.yml](.github/workflows/deploy.yml) &mdash; Pushes images to ACR and runs Terraform.

---

## 🏗️ Architecture Design

```
                     +---------------------------------------+
                     |             Client Browser            |
                     +-------------------+-------------------+
                                         |
                                         | HTTPS: Public URL
                                         v
                     +-------------------+-------------------+
                     |   Frontend Container App (Port 3000)  |
                     +-------------------+-------------------+
                                         |
                                         | HTTPS: Internal FQDN
                                         v
                     +-------------------+-------------------+
                     |   Backend Container App (Port 5000)   |
                     |         (Internal Ingress Only)       |
                     +---------------------------------------+
```

- **Security**: The backend has `external_enabled = false`, making it accessible **only** within the Container Apps Environment.
- **CORS Bypass**: The client browser calls the frontend's `/api/status` endpoint directly. The frontend Node.js server proxies this call to the backend's internal URL, avoiding CORS.

---

## 🚀 How to Deploy to Azure

Follow these steps to deploy the application:

### Step 1: Create an Azure Service Principal
Run the following command in your terminal using the Azure CLI:
```bash
az ad sp create-for-rbac --name "ContainerAppDeployer" --role contributor --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID> --sdk-auth
```
Copy the JSON output.

### Step 2: Add Secrets to GitHub
Create a GitHub repository for your code and go to **Settings > Secrets and variables > Actions > New repository secret**:
1. Name: `AZURE_CREDENTIALS`
2. Value: Paste the JSON output from Step 1.

### Step 3: Push to the `main` Branch
Commit and push the files to your GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit of Container-App"
git branch -M main
git remote add origin https://github.com/ramosfritz/container-app.git
git push -u origin main
```

Once pushed, the **Deploy to Azure Container Apps** GitHub Actions workflow will trigger. It will:
1. Provision the Resource Group and the Azure Container Registry (`acrfritzramoscontainerapp`).
2. Log in to the registry.
3. Build the frontend and backend Docker images, tagging them with the Git Commit SHA.
4. Push the images to ACR.
5. Provision the Container Apps Environment and deploy the Container Apps.
6. Print the Frontend application's public URL in the outputs!
