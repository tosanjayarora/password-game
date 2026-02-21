# The Password Game

This project is intended to demonstrate some basic concepts around personal account security and password hygiene.

## Local debugging
You can run and debug the entire solution locally using Azure Functions tools and Azurite.

### Setup your dev environment

1. Install [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-install-azurite) (or use `npm run start:azurite` from the repo root, which starts Azurite on ports `11000-11002`).
2. Install the [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=windows%2Ccsharp%2Cbash#install-the-azure-functions-core-tools).
3. Install [NodeJS](node). (Note: please refer the version compatibility between NodeJS ad Azure function, refer link [here](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=javascript%2Cwindows%2Cazure-cli&pivots=nodejs-model-v4#supported-versions))
4. Install [Visual Studio Code](https://code.visualstudio.com/).

### Get a SignalR instance

To actually run the chat locally, you'll need an Azure SignalR instance. [Create an Azure SignalR](https://docs.microsoft.com/en-us/azure/azure-signalr/signalr-tutorial-authenticate-azure-functions#create-an-azure-signalr-service-instance) dev/test instance with the _Serverless_ service mode and take note of the connection string.

### Create Azure Functions settings

1. Copy the contents of `backend-api/example.settings.json` to `backend-api/local.settings.json`.
2. Replace the value `YOUR_SIGNALR_CONNECTION_STRING` with your connection string from the previous section.

### Build the shared package

Run the following to build:
```bash
pushd ./shared
npm install
npm run build
popd
```

### Run the solution

Start Azurite before running the backend:

```bash
npm run start:azurite
```

The backend settings in `backend-api/local.settings.json` are configured to use these Azurite ports.

#### From VS Code

1. In VS Code, start the `backend-api` by choosing `Debug backend-api` from the Run and Debug tab and pressing the green arrow button.
2. In VS Code, start the `cat-game` app by choosing `Debug cat-game` from the Run and Debug tab and pressing the green arrow button.
3. In VS Code, start the `dog-game` app by choosing `Debug dog-game` from the Run and Debug tab and pressing the green arrow button.

#### From powershell

1. cd to src\password-game\backend-api folder, run 'npm install', then 'npm run start' to start backend-api project.
2. cd to src\password-game\cat-game folder, run 'npm install', then 'npm run serve' to start cat-game project with http://localhost:8080/.
3. cd to src\password-game\dog-game folder, run 'npm install', then 'npm run serve' to start dog-game project with http://localhost:8081/.

### SignalR Configuration

After above 3 projects are all started, if you receive below error message in the cat-game chat room while sending message. Pleaes configure your SignalR to Serverless by refer link [here](https://learn.microsoft.com/en-us/azure/azure-signalr/concept-service-mode#setting-the-service-mode).
```
Server returned handshake error: SignalR Service is now in 'Default' service mode. Current mode works as a proxy that routes client traffic to the connected app servers. However app servers are not connected.
```

## Automated deployment

The solution is aware of three environments: `Main`, `Backup`, and `Beta`. The `main` branch deploys to `Main`, the `backup` branch deploys to `Backup`, and all other configured branches deploy to `Beta`.

The deployment structure uses one resource group for the control plane, and then one resource group per environment. If you fork this project, you need only set up a single environment.

### GitHub workflow setup

To setup the GitHub Actions project deployment workflow for automated deployment to Azure, do the following:

(These commands use the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/get-started-with-azure-cli).)

1. **Create a storage account where Terraform state will be saved:**

Note the storage account name for use in step 4.

```bash
# Create Resource Group
az group create -n PwdControlGroup -l westus2

# Create Storage Account
az storage account create -n pwdcontrolstorage -g PwdControlGroup --sku Standard_LRS

# Create Storage Account Container
az storage container create -n tfstate --account-name pwdcontrolstorage
```

2. **Create a service principal for Terraform deployment:**

Note the service principal's appId and tenant for use in the following steps.

```bash
az ad app create --display-name "PwdGame Github Actions Runner"
```

Create a file `credential.json` replacing ENV_NAME for each environment you are setting up:

```json
{
    "audiences": [ "api://AzureADTokenExchange" ],
    "description": "Github actions federated credential for ENV_NAME environment",
    "issuer": "https://token.actions.githubusercontent.com",
    "name": "Dev",
    "subject": "repo:organization/repository:environment:ENV_NAME"
}
```

And create the federated credential based on this file:

```bash
az ad app federated-credential create --id YOUR_DEPLOYMENT_APPID --parameters credential.json
```

Finally, assign create a service principal for this app in your tenant and assign this service principal a role for the control plane resource group:

```bash
az ad sp create --id YOUR_DEPLOYMENT_APPID
az role assignment create --assignee YOUR_DEPLOYMENT_APPID --role Contributor --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/PwdControlGroup
```

3. **Create a resource group for each environment where the solution will be deployed:**

_Use a different resource group name than step 1 otherwise the Terraform deployment will break._

Note the resource group name for use in step 4.

```bash
# Create Resource Group
az group create -n PwdGameGroup -l westus2

# Assign the Service Principal access
az role assignment create --assignee YOUR_DEPLOYMENT_APPID --role Contributor --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/PwdGameGroup
```

Do this for each environment you want to create.

4. **Add the following secrets and variables to your GitHub repository and environments** ([GitHub docs](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository)):

Create a github environment per deployment environment..

Repository secrets:

- `ARM_TENANT_ID`: Your Azure AD tenant ID
- `ARM_CLIENT_ID`: Your service principal app ID
- `ARM_SUBSCRIPTION_ID`: Your Azure subscription ID
- `AZURE_TFSTATE_STORAGE_ACCOUNT`: The storage account you created in step 2

Repository environment variables:
- `AZURE_TFSTATE_RESOURCE_GROUP`: The resource group name you created in step 2

Environment environment variables:
- `AZURE_RESOURCE_GROUP`: The resource group name you created in step 3

