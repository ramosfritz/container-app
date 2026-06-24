# CI/CD Pipeline Setup & Deployment Guide

This guide describes how to configure GitHub Actions authentication to Azure, so that any push to the `main` branch will automatically build and deploy your application.

---

## Step 1: Create an Azure Service Principal
First, you need to create a Service Principal (app registration) in your Azure account. This will act as the credential that GitHub uses to log into your subscription.

Run the following command in your terminal (using Azure CLI):
```bash
az ad sp create-for-rbac --name "ContainerAppDeployer" --role contributor --scopes /subscriptions/312af5ea-e2a5-4232-8674-703521f18a74 --sdk-auth
```

> [!IMPORTANT]
> - Replace `312af5ea-e2a5-4232-8674-703521f18a74` with your target subscription ID if you ever deploy to a different subscription.
> - The command will output a JSON block. Copy this JSON block entirely (including the curly braces `{}`).

---

## Step 2: Store the Credentials in GitHub
1. Go to your GitHub repository: [https://github.com/ramosfritz/container-app](https://github.com/ramosfritz/container-app).
2. Click on **Settings** (top navigation bar of the repository).
3. In the left sidebar, expand **Secrets and variables** and click on **Actions**.
4. Click the **New repository secret** button.
5. Configure the secret:
   - **Name**: `AZURE_CREDENTIALS`
   - **Secret**: Paste the exact JSON block copied from Step 1.
6. Click **Add secret**.

---

## Step 3: Trigger the Pipeline
Since we configured the workflow to run on any push to the `main` branch, pushing new code will immediately start the build and deployment.

To push these updates and trigger the pipeline, run the following Git commands in your project root directory:
```bash
# Stage the modified workflow and the new deploy-command.md file
git add .

# Commit the changes
git commit -m "Configure GitHub credentials helper and add deploy-command documentation"

# Push to GitHub (triggers the workflow)
git push origin main
```

---

## Step 4: Monitor the Deployment
1. Go to the **Actions** tab in your GitHub repository.
2. Click on the running workflow named **Build, Push and Deploy**.
3. You can watch the live console logs as GitHub:
   - Sets up Terraform.
   - Logs into Azure.
   - Builds the backend and frontend Docker containers.
   - Pushes them to the Azure Container Registry.
   - Applies the Terraform changes in `westus` to deploy the Container Apps!
